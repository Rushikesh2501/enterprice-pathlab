from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    PATIENT = "patient"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255))
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False) # Changed from hashed_password to match user DB
    phone = Column(String(20))
    gender = Column(String(50))
    date_of_birth = Column(String(50)) # Using string for simplicity, or Date
    blood_group = Column(String(10))
    created_at = Column(DateTime, default=datetime.utcnow)

    reports = relationship("Report", back_populates="user")
    appointments = relationship("Appointment", back_populates="user")
