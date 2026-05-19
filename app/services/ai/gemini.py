import google.generativeai as genai
from app.core.config import settings

class GeminiService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.model = None

    async def generate_response(self, prompt: str, context: str = "") -> str:
        """
        Generate a response using Gemini based on prompt and provided context.
        Supports multilingual queries including Roman Marathi.
        """
        if not self.model:
            return "Gemini API key not configured."
        
        system_instruction = (
            "You are an AI assistant for an Enterprise Pathology Laboratory. "
            "You must be able to understand and reply in English, Hindi, Marathi, and Roman Marathi. "
            "You should help patients understand their reports, book appointments, and browse pathology packages. "
            "Answer strictly based on the provided context if available.\n\n"
        )
        
        full_prompt = f"{system_instruction}Context:\n{context}\n\nUser Query: {prompt}"
        
        try:
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            return f"Error generating response: {str(e)}"

gemini_service = GeminiService()
