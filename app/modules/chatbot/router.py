from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.models.user import User
from app.models.package import Package
from app.models.report import Report
from app.models.appointment import Appointment
from app.models.test_history import TestHistory

from app.services.ai.gemini import gemini_service
from app.services.embeddings.chroma import chroma_service

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    patient_id: Optional[int] = None

@router.post("/chat")
async def chat_endpoint(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    try:
        # Retrieve all pathology packages to provide context about what packages are available in the laboratory
        package_result = await db.execute(select(Package))
        packages = package_result.scalars().all()
        package_list_str = "\n".join([
            f"- {p.package_name}: {p.description} (Price: INR {p.price})"
            for p in packages
        ])
        
        # Core laboratory packages context
        context = (
            f"Here are the available test packages in our laboratory:\n"
            f"{package_list_str}\n\n"
        )
        
        # SECURE & SECURED: Allow the bot to access ONLY that specific patient's data!
        if req.patient_id:
            # 1. Fetch patient profile
            user_result = await db.execute(select(User).where(User.id == req.patient_id))
            patient = user_result.scalars().first()
            if patient:
                context += (
                    f"--- LOGGED IN PATIENT PROFILE (DO NOT DISCLOSE TO OTHER USERS) ---\n"
                    f"Patient ID: {patient.id}\n"
                    f"Name: {patient.full_name}\n"
                    f"Email: {patient.email}\n"
                    f"Gender: {patient.gender}\n"
                    f"DOB: {patient.date_of_birth}\n\n"
                )
                
                # 2. RAG Pipeline: Query ChromaDB for relevant PDF report chunks for this specific patient
                try:
                    search_results = chroma_service.search_reports(
                        query=req.message,
                        user_id=req.patient_id,
                        n_results=4
                    )
                    
                    if search_results and "documents" in search_results and search_results["documents"]:
                        # Extract the matching chunks list (returns a list of lists of strings)
                        flat_chunks = []
                        for doc_list in search_results["documents"]:
                            flat_chunks.extend(doc_list)
                        
                        if flat_chunks:
                            context += "--- RELEVANT EXTRACTED MEDICAL REPORT CHUNKS ---\n"
                            for i, chunk in enumerate(flat_chunks):
                                context += f"Chunk {i+1}:\n{chunk}\n\n"
                            context += "----------------------------------------------\n\n"
                except Exception as chroma_err:
                    print(f"Failed to query ChromaDB for patient reports: {chroma_err}")
                
                # 3. Fetch test history for overview
                th_result = await db.execute(select(TestHistory).where(TestHistory.user_id == req.patient_id))
                test_histories = th_result.scalars().all()
                th_str = "\n".join([
                    f"- {th.test_name}: {th.result_summary} (Date: {th.test_date})"
                    for th in test_histories
                ])
                if th_str:
                    context += f"Patient Overall Test History Summary:\n{th_str}\n\n"
                
                # 4. Fetch appointments
                appt_result = await db.execute(select(Appointment).where(Appointment.user_id == req.patient_id))
                appointments = appt_result.scalars().all()
                appt_str = "\n".join([
                    f"- Appt #{a.id} (Date: {a.appointment_date}, Status: {a.status})"
                    for a in appointments
                ])
                if appt_str:
                    context += f"Patient Appointments:\n{appt_str}\n\n"
        
        # Generate the response using Gemini Service and our curated, secure context
        reply = await gemini_service.generate_response(prompt=req.message, context=context)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")


