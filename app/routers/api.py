from fastapi import APIRouter
from app.modules.auth import router as auth_router
from app.modules.users import router as users_router
from app.modules.reports import router as reports_router
from app.modules.appointments import router as appointments_router
from app.modules.catalogue import router as catalogue_router
from app.modules.chatbot import router as chatbot_router
from app.modules.rag import router as rag_router
from app.modules.admin import router as admin_router
from app.modules.test_history import router as test_history_router

api_router = APIRouter()

api_router.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router.router, prefix="/users", tags=["Users"])
api_router.include_router(reports_router.router, prefix="/reports", tags=["Reports"])
api_router.include_router(appointments_router.router, prefix="/appointments", tags=["Appointments"])
api_router.include_router(catalogue_router.router, prefix="/catalogue", tags=["Catalogue"])
api_router.include_router(chatbot_router.router, prefix="/chatbot", tags=["AI Chatbot"])
api_router.include_router(rag_router.router, prefix="/rag", tags=["RAG Services"])
api_router.include_router(admin_router.router, prefix="/admin", tags=["Admin"])
api_router.include_router(test_history_router.router, prefix="/test-history", tags=["Test History"])
