from fastapi import APIRouter, UploadFile, File
from app.services.file_service import save_and_preview_file

router = APIRouter(tags=["upload"])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    result = save_and_preview_file(file)
    return result