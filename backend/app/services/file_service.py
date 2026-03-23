import os
import pandas as pd

UPLOAD_DIR = "uploads"

def save_and_preview_file(file):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    if file.filename.endswith(".csv"):
        df = pd.read_csv(file_path)
    elif file.filename.endswith(".xlsx") or file.filename.endswith(".xls"):
        df = pd.read_excel(file_path)
    else:
        return {"error": "Chỉ hỗ trợ file CSV hoặc Excel"}

    return {
        "file_name": file.filename,
        "columns": df.columns.tolist(),
        "row_count": len(df),
        "preview": df.head(5).to_dict(orient="records")
    }