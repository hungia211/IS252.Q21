from fastapi import HTTPException, UploadFile
from app.services.file_service import load_uploaded_table
from app.mining.frequent_itemsets_and_rules import analyze_frequent_itemsets_and_rules


async def process_frequent_itemsets_and_rules(
    file: UploadFile,
    min_support: float,
    min_confidence: float,
):
    df = await load_uploaded_table(file)

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file has no data.")

    if df.shape[1] != 2:
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain exactly 2 columns: (transaction_id, item). Found: {df.shape[1]}."
        )

    if not (0.0 < min_support <= 1.0):
        raise HTTPException(
            status_code=400,
            detail="min_support must be in range (0, 1]."
        )

    if not (0.0 < min_confidence <= 1.0):
        raise HTTPException(
            status_code=400,
            detail="min_confidence must be in range (0, 1]."
        )

    unique_transactions = df[df.columns[0]].nunique()
    if unique_transactions < 2:
        raise HTTPException(
            status_code=400,
            detail="CSV must contain at least 2 distinct transactions."
        )

    return analyze_frequent_itemsets_and_rules(
        df=df,
        min_support=min_support,
        min_confidence=min_confidence,
    )