from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.report import Report
from app.utils.azure_storage import download_user_report

router = APIRouter()

@router.get("/")
async def get_reports(request: Request, db: AsyncSession = Depends(get_db)):
    # In a real app, you would filter by current_user.id
    result = await db.execute(select(Report))
    reports = result.scalars().all()
    
    # Converts base_url to string (includes trailing slash)
    base_url = str(request.base_url)
    
    return [
        {
            "id": r.id,
            "report_name": r.report_name,
            # Dynamically route downloads through our secure backend proxy based on current hosting domain
            "file_url": f"{base_url}api/v1/reports/{r.id}/download",
            "report_date": r.report_date,
            "uploaded_at": r.uploaded_at
        } for r in reports
    ]

@router.get("/{report_id}/download")
async def download_report(report_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    try:
        file_bytes = download_user_report(report.file_url)
        return Response(
            content=file_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{report.report_name.replace(" ", "_")}.pdf"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve file from storage: {e}")

from app.models.appointment import Appointment

@router.delete("/{report_id}")
async def delete_report(report_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Find the report by report_id
        result = await db.execute(select(Report).where(Report.id == report_id))
        report = result.scalars().first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Parse the appointment ID from report.file_url (e.g. "..._{appointment_id}.pdf")
        file_url = report.file_url
        try:
            filename = file_url.split("/")[-1] # report_rushikesh_jagtap_7.pdf
            base_name = filename.rsplit(".", 1)[0] # report_rushikesh_jagtap_7
            appt_id_str = base_name.split("_")[-1] # 7
            appointment_id = int(appt_id_str)
            
            # Find the appointment and revert its status back to "Successful"
            appt_result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
            appointment = appt_result.scalars().first()
            if appointment:
                appointment.status = "Successful"
                
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
        except Exception as parse_err:
            print(f"Non-fatal error parsing appointment ID from file_url: {parse_err}")
            
        # Delete from SQL Database
        await db.delete(report)
        await db.commit()
        
        return {"message": "Report successfully deleted"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {str(e)}")
