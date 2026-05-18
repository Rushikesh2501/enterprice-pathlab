from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.package import Package

router = APIRouter()

@router.get("/")
async def get_packages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Package))
    packages = result.scalars().all()
    return packages
