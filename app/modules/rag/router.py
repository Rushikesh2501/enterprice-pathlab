from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app.utils.pdf_extractor import extract_text_from_pdf, split_text_into_chunks
from app.services.embeddings.chroma import chroma_service

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    user_id: int
    n_results: Optional[int] = 4

@router.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    """
    Developer API to upload a PDF and view the extracted plain text and sliding window chunks.
    """
    try:
        content = await file.read()
        extracted_text = extract_text_from_pdf(content)
        if not extracted_text:
            raise HTTPException(status_code=400, detail="Could not extract text from the uploaded PDF. Ensure it is not scanned or empty.")
        
        chunks = split_text_into_chunks(extracted_text)
        return {
            "filename": file.filename,
            "total_character_count": len(extracted_text),
            "chunk_count": len(chunks),
            "chunks": chunks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF extraction failed: {str(e)}")

@router.post("/generate-embeddings")
async def generate_embeddings(
    user_id: int = Form(...),
    report_id: int = Form(...),
    file: UploadFile = File(...)
):
    """
    Developer API to manually run the chunking and ChromaDB vector indexing pipeline for a specific report.
    """
    try:
        content = await file.read()
        extracted_text = extract_text_from_pdf(content)
        if not extracted_text:
            raise HTTPException(status_code=400, detail="Failed to extract text from PDF.")
        
        chunks = split_text_into_chunks(extracted_text)
        if not chunks:
            raise HTTPException(status_code=400, detail="No chunks generated from the extracted text.")
        
        chroma_service.add_report_chunks(
            user_id=user_id,
            report_id=report_id,
            chunks=chunks
        )
        
        return {
            "status": "success",
            "message": f"Successfully indexed {len(chunks)} chunks into ChromaDB vector store.",
            "report_id": report_id,
            "user_id": user_id,
            "chunks_indexed": len(chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate and store embeddings: {str(e)}")

@router.post("/search")
async def semantic_search(req: SearchRequest):
    """
    Developer API to perform a vector semantic search on the patient's reports inside ChromaDB.
    """
    try:
        search_results = chroma_service.search_reports(
            query=req.query,
            user_id=req.user_id,
            n_results=req.n_results
        )
        
        # Format ChromaDB output cleanly
        formatted_results = []
        if search_results and "documents" in search_results and search_results["documents"]:
            docs = search_results["documents"][0]
            ids = search_results["ids"][0]
            metadatas = search_results["metadatas"][0]
            distances = search_results.get("distances", [[]])[0]
            
            for i in range(len(docs)):
                formatted_results.append({
                    "id": ids[i],
                    "document_chunk": docs[i],
                    "metadata": metadatas[i],
                    "similarity_distance": distances[i] if i < len(distances) else None
                })
        
        return {
            "query": req.query,
            "user_id": req.user_id,
            "results_count": len(formatted_results),
            "matches": formatted_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Semantic search failed: {str(e)}")
