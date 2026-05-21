# pyrefly: ignore [missing-import]
import google.generativeai as genai
from app.core.config import settings

class GeminiService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY, transport='rest')
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.model = None

    async def generate_response(self, prompt: str, context: str = "") -> str:
        """
        Generate a response using Gemini based on prompt and provided context.
        Supports automatic fallback to alternate models on rate limits/429.
        """
        if not settings.GEMINI_API_KEY:
            return "Gemini API key not configured."
        
        system_instruction = (
            "You are an AI assistant for an Enterprise Pathology Laboratory. "
            "You must be able to understand and reply in English, Hindi, Marathi, and Roman Marathi. "
            "You should help patients understand their reports, book appointments, and browse pathology packages. "
            "Answer strictly based on the provided context if available.\n\n"
        )
        
        full_prompt = f"{system_instruction}Context:\n{context}\n\nUser Query: {prompt}"
        
        models_to_try = [
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-3.5-flash',
            'gemini-2.5-flash-lite'
        ]
        
        last_error = None
        for model_name in models_to_try:
            try:
                # Initialize model dynamically to support robust fallback
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(full_prompt)
                return response.text
            except Exception as e:
                err_msg = str(e)
                print(f"Gemini fallback warning: model {model_name} failed with error: {err_msg}")
                last_error = e
                # Proceed to try the next model in the fallback chain
                continue
        
        return f"Error generating response: {str(last_error)}"

gemini_service = GeminiService()
