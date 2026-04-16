from fastapi import APIRouter, File, Form, UploadFile
from app.services.frequent_itemsets_and_rules_service import process_frequent_itemsets_and_rules

router = APIRouter(prefix="/frequent-itemsets-rules", tags=["Frequent Itemsets & Association Rules"])


@router.post("/analyze")
async def frequent_itemsets_and_rules_api(
    file: UploadFile = File(...),
    min_support: float = Form(...),
    min_confidence: float = Form(...),
):
    return await process_frequent_itemsets_and_rules(
        file=file,
        min_support=min_support,
        min_confidence=min_confidence,
    )