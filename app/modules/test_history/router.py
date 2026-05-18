from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.test_history import TestHistory

router = APIRouter()

@router.get("/")
async def get_test_history(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestHistory))
    history = result.scalars().all()
    
    return [
        {
            "id": h.id,
            "test_name": h.test_name,
            "result_summary": h.result_summary,
            "test_date": h.test_date,
            "created_at": h.created_at
        } for h in history
    ]
