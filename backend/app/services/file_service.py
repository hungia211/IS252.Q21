import io
from pathlib import Path
from typing import List

import pandas as pd
from fastapi import HTTPException, UploadFile


SUPPORTED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty or has no rows.")

    df.columns = [str(col).strip() for col in df.columns]
    return df


def _read_csv_from_bytes(content: bytes) -> pd.DataFrame:
    encodings_to_try = ["utf-8", "utf-8-sig", "cp1258", "latin1"]
    last_error = None

    for encoding in encodings_to_try:
        try:
            text = content.decode(encoding)
            df = pd.read_csv(io.StringIO(text))
            return _clean_dataframe(df)
        except Exception as e:
            last_error = e

    raise HTTPException(
        status_code=400,
        detail=f"Cannot read CSV file. Error: {str(last_error)}"
    )


def _read_excel_from_bytes(content: bytes) -> pd.DataFrame:
    try:
        df = pd.read_excel(io.BytesIO(content))
        return _clean_dataframe(df)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot read Excel file. Error: {str(e)}"
        )


async def load_uploaded_table(file: UploadFile) -> pd.DataFrame:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    filename = file.filename.strip()
    extension = Path(filename).suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only .csv, .xlsx, .xls files are supported."
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if extension == ".csv":
        return _read_csv_from_bytes(content)

    return _read_excel_from_bytes(content)


async def load_multiple_uploaded_tables(files: List[UploadFile]) -> List[dict]:
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    results = []

    for file in files:
        df = await load_uploaded_table(file)
        results.append({
            "filename": file.filename,
            "columns": df.columns.tolist(),
            "row_count": len(df),
            "dataframe": df
        })

    return results


def read_local_table(file_path: str) -> pd.DataFrame:
    path = Path(file_path)

    if not path.exists():
        raise ValueError(f"File not found: {file_path}")

    extension = path.suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError("Only .csv, .xlsx, .xls files are supported.")

    try:
        if extension == ".csv":
            df = pd.read_csv(path)
        else:
            df = pd.read_excel(path)

        if df.empty:
            raise ValueError("File exists but contains no data.")

        df.columns = [str(col).strip() for col in df.columns]
        return df

    except Exception as e:
        raise ValueError(f"Cannot read local file: {str(e)}")


def parse_comma_separated_list(raw_text: str) -> list[str]:
    if not raw_text:
        return []
    return [item.strip() for item in raw_text.split(",") if item.strip()]