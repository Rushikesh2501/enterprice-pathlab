from fastapi import APIRouter

router = APIRouter()

@router.get("/me")
async def get_profile():
    return {"message": "Get profile endpoint"}

@router.put("/me")
async def update_profile():
    return {"message": "Update profile endpoint"}

@router.post("/me/image")
async def upload_profile_image():
    return {"message": "Upload profile image endpoint"}
