from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional
from datetime import date, time
from app.core.database import get_db
from app.models.appointment import Appointment
from app.models.package import Package

class AppointmentCreate(BaseModel):
    package_ids: list[int]
    appointment_date: date
    appointment_time: time
    visit_type: str
    address: Optional[str] = None
    phone_number: Optional[str] = None

router = APIRouter()

@router.get("/")
async def get_appointments(db: AsyncSession = Depends(get_db)):
    # In a real app, filter by current user: where(Appointment.user_id == current_user.id)
    # For now, let's just return all appointments and join the package data
    result = await db.execute(select(Appointment))
    appointments = result.scalars().all()
    
    # We can fetch packages separately or use joinedload. Let's do a simple mapping for safety.
    pkg_result = await db.execute(select(Package))
    packages = {p.id: p for p in pkg_result.scalars().all()}
    
    response = []
    for appt in appointments:
        pkg = packages.get(appt.package_id)
        response.append({
            "id": appt.id,
            "appointment_date": appt.appointment_date,
            "appointment_time": appt.appointment_time,
            "status": appt.status,
            "visit_type": appt.visit_type,
            "address": appt.address,
            "phone_number": appt.phone_number,
            "package_name": pkg.package_name if pkg else "Custom Test",
            "price": pkg.price if pkg else 0
        })
    return response

@router.post("/")
async def create_appointment(req: AppointmentCreate, db: AsyncSession = Depends(get_db)):
    # Hardcoded user_id=1 for now
    new_appts = []
    for pid in req.package_ids:
        appt = Appointment(
            user_id=1,
            package_id=pid,
            appointment_date=req.appointment_date,
            appointment_time=req.appointment_time,
            visit_type=req.visit_type,
            address=req.address,
            phone_number=req.phone_number,
            status="Booked"
        )
        db.add(appt)
        new_appts.append(appt)
        
    await db.commit()
    return {"message": f"Successfully created {len(new_appts)} appointments."}

@router.put("/{appointment_id}/cancel")
async def cancel_appointment(appointment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appt.status = "Cancelled"
    await db.commit()
    return {"message": "Appointment cancelled successfully"}

@router.delete("/{appointment_id}")
async def delete_appointment(appointment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    await db.delete(appt)
    await db.commit()
    return {"message": "Appointment deleted successfully"}
