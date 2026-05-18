from fastapi import APIRouter

router = APIRouter()

@router.post("/chat")
async def chat_endpoint():
    """
    Multilingual chat endpoint (Roman Marathi, Hindi, English, Marathi).
    Example: "mala diabetes che package hawe ahet"
    """
    return {"message": "Chat endpoint"}

@router.get("/history")
async def get_chat_history():
    return {"message": "Get chat history endpoint"}
