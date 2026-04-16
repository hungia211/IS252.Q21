import pandas as pd
from fastapi import HTTPException, UploadFile
from app.services.file_service import load_uploaded_csv
from app.mining.pre_processing import analyze_pearson


async def process_pearson_correlation(file: UploadFile):
    df = await load_uploaded_csv(file)

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file has no data.")

    if df.shape[1] != 2:
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain exactly 2 columns. Found: {df.shape[1]}."
        )

    numeric_df = df.apply(pd.to_numeric, errors="coerce")
    if numeric_df.isnull().all().any():
        non_numeric = [col for col in df.columns if numeric_df[col].isnull().all()]
        raise HTTPException(
            status_code=400,
            detail=f"Column(s) contain no numeric data: {non_numeric}."
        )

    valid_rows = numeric_df.dropna()
    if len(valid_rows) < 3:
        raise HTTPException(
            status_code=400,
            detail="Need at least 3 valid numeric rows to compute Pearson correlation."
        )

    return analyze_pearson(df=df)