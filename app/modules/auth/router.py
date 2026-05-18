from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user import User
from app.core.security import create_access_token

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class EmailCheckRequest(BaseModel):
    email: str

@router.post("/check-email")
async def check_email(req: EmailCheckRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalars().first()
    if user:
        return {"exists": True}
    return {"exists": False}

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Find user
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    # Check password (plain text check based on user's manual DB insertion)
    if user.password != req.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    # Generate JWT
    token = create_access_token(subject=str(user.id))
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }

@router.post("/register")
async def register():
    return {"message": "Register endpoint"}

@router.post("/forgot-password")
async def forgot_password():
    return {"message": "Forgot password endpoint"}
