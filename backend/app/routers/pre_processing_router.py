from fastapi import APIRouter, File, UploadFile
from app.services.pre_processing_service import process_pearson_correlation

router = APIRouter(prefix="/pre_processing", tags=["Pre Processing"])


@router.post("/pearson_correlation")
async def pearson_correlation_api(
    file: UploadFile = File(...),
):
    return await process_pearson_correlation(file=file)