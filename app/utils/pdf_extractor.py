import io
import PyPDF2
from typing import List

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """
    Extracts plain text from raw PDF bytes.
    """
    try:
        pdf_file = io.BytesIO(pdf_content)
        reader = PyPDF2.PdfReader(pdf_file)
        text_content = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text)
        return "\n".join(text_content)
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""

def split_text_into_chunks(text: str, chunk_size: int = 500, chunk_overlap: int = 100) -> List[str]:
    """
    Splits text into logical chunks with overlap to ensure context is preserved.
    """
    if not text:
        return []
    
    # Split text into lines to avoid splitting in the middle of sentences or test names
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    chunks = []
    current_chunk = []
    current_length = 0
    
    for line in lines:
        line_len = len(line)
        
        # If a single line is extremely long, split it by characters
        if line_len > chunk_size:
            if current_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = []
                current_length = 0
            
            # Direct character split for giant lines
            for i in range(0, line_len, chunk_size - chunk_overlap):
                chunks.append(line[i : i + chunk_size])
            continue
        
        if current_length + line_len + len(current_chunk) > chunk_size:
            # Save the current chunk
            chunks.append("\n".join(current_chunk))
            
            # Start a new chunk with overlap
            # We keep the last 1-2 lines for context overlap
            overlap_lines = []
            overlap_len = 0
            for prev_line in reversed(current_chunk):
                if overlap_len + len(prev_line) + len(overlap_lines) < chunk_overlap:
                    overlap_lines.insert(0, prev_line)
                    overlap_len += len(prev_line)
                else:
                    break
            
            current_chunk = overlap_lines + [line]
            current_length = sum(len(l) for l in current_chunk)
        else:
            current_chunk.append(line)
            current_length += line_len
            
    if current_chunk:
        chunks.append("\n".join(current_chunk))
        
    return chunks
