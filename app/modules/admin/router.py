from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.report import Report
from app.models.appointment import Appointment
from app.utils.azure_storage import upload_user_report
from datetime import date

router = APIRouter()

@router.get("/users")
async def manage_users():
    return {"message": "Manage users endpoint"}

@router.post("/reports/upload")
async def upload_report(
    appointment_id: int = Form(...),
    report_name: str = Form(...),
    report_date: date = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Look up the appointment to ensure validity and retrieve user_id
        from app.models.package import Package
        appt_result = await db.execute(
            select(Appointment, Package.package_name)
            .join(Package, Appointment.package_id == Package.id)
            .where(Appointment.id == appointment_id)
        )
        row = appt_result.first()
        if not row:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        appointment = row.Appointment
        package_name = row.package_name
        
        user_id = appointment.user_id
        content = await file.read()
        
        # Upload to User-specific folder under the storage account
        storage_uri = upload_user_report(user_id=user_id, file_name=file.filename, file_content=content)
        
        # Record the transaction inside Azure SQL Database
        new_report = Report(
            user_id=user_id,
            report_name=report_name,
            file_url=storage_uri,  # e.g., azure://{user_id}/{filename}
            report_date=report_date
        )
        db.add(new_report)

        # Record in TestHistory so patient's "Completed Tests" count increases!
        from app.models.test_history import TestHistory
        new_test_history = TestHistory(
            user_id=user_id,
            test_name=package_name,
            result_summary="Report successfully compiled and uploaded.",
            test_date=report_date
        )
        db.add(new_test_history)
        
        # Automatically mark the appointment as Completed since report is uploaded
        appointment.status = "Completed"
        
        await db.commit()
        await db.refresh(new_report)
        
        return {
            "message": "Report successfully uploaded, assigned, and appointment marked as Completed.",
            "report_id": new_report.id,
            "appointment_id": appointment_id,
            "storage_uri": storage_uri
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload report: {str(e)}")

from app.models.user import User
from app.models.package import Package

@router.get("/packages")
async def manage_packages():
    return {"message": "Manage packages endpoint"}

@router.get("/appointments")
async def manage_appointments(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(Appointment, User.full_name, Package.package_name)
            .join(User, Appointment.user_id == User.id)
            .join(Package, Appointment.package_id == Package.id)
            .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
        )
        rows = result.all()
        return [
            {
                "id": row.Appointment.id,
                "user_id": row.Appointment.user_id,
                "patient_name": row.full_name,
                "package_id": row.Appointment.package_id,
                "package_name": row.package_name,
                "appointment_date": row.Appointment.appointment_date.isoformat(),
                "appointment_time": row.Appointment.appointment_time.isoformat(),
                "status": row.Appointment.status,
                "visit_type": row.Appointment.visit_type,
                "address": row.Appointment.address,
                "phone_number": row.Appointment.phone_number
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch appointments: {str(e)}")

@router.delete("/reports/{appointment_id}")
async def delete_report(appointment_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Look up the appointment to ensure validity and retrieve user_id
        appt_result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
        appointment = appt_result.scalars().first()
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Look up any report associated with this user and appointment_id
        report_result = await db.execute(
            select(Report)
            .where(Report.user_id == appointment.user_id)
            .where(Report.file_url.like(f"%_{appointment_id}.pdf"))
        )
        report = report_result.scalars().first()
        
        if report:
            await db.delete(report)

        # Look up the package name
        from app.models.package import Package
        package_result = await db.execute(select(Package).where(Package.id == appointment.package_id))
        package = package_result.scalars().first()
        package_name = package.package_name if package else "Pathology Test"

        # Look up and delete any test history record with same name and user
        from app.models.test_history import TestHistory
        th_result = await db.execute(
            select(TestHistory)
            .where(TestHistory.user_id == appointment.user_id)
            .where(TestHistory.test_name == package_name)
        )
        th_records = th_result.scalars().all()
        for th in th_records:
            await db.delete(th)
            
        # Revert appointment status back to "Successful" (so it shows "Upload Report" option again!)
        appointment.status = "Successful"
        
        await db.commit()
        return {"message": f"Report record for Appointment #{appointment_id} successfully deleted, and status set back to Successful."}
    except HTTPException as he:
        raise he
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {str(e)}")
