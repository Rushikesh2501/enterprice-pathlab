from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from app.core.database import Base

class Package(Base):
    __tablename__ = "Packages" # Match exactly with DB

    id = Column(Integer, primary_key=True, index=True)
    package_name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
