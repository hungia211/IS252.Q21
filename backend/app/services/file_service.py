import io
import pandas as pd
from fastapi import HTTPException, UploadFile


async def load_uploaded_csv(file: UploadFile) -> pd.DataFrame:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    encodings_to_try = ["utf-8", "utf-8-sig", "cp1258", "latin1"]
    last_error = None

    for encoding in encodings_to_try:
        try:
            text = content.decode(encoding)
            df = pd.read_csv(io.StringIO(text))
            df.columns = [str(c).strip() for c in df.columns]
            return df
        except Exception as e:
            last_error = e

    raise HTTPException(
        status_code=400,
        detail=f"Cannot read CSV file. Error: {str(last_error)}"
    )


def parse_comma_separated_list(raw_text: str) -> list[str]:
    return [item.strip() for item in raw_text.split(",") if item.strip()]