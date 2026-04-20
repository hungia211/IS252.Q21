from typing import Any, Dict

from fastapi import HTTPException, UploadFile

from app.mining.clustering import KMeansClustering, KohonenNetwork
from app.services.file_service import load_uploaded_table


async def kmeans_service(
    file: UploadFile,
    k: int,
    max_iters: int,
) -> Dict[str, Any]:
    # Tải dữ liệu từ file tải lên thành DataFrame bằng hàm dùng chung
    df = await load_uploaded_table(file)

    # Kiểm tra tính hợp lệ của tham số đầu vào
    if k <= 0:
        raise HTTPException(status_code=400, detail="Number of clusters (k) must be more than 0")
    if max_iters <= 0:
        raise HTTPException(status_code=400, detail="Max number of iterables must be more than 0")

    try:
        # Khởi tạo lớp xử lý thuật toán K-Means
        kmeans = KMeansClustering(k=k, max_iters=max_iters)
        # Chạy thuật toán trên dữ liệu và trả về kết quả dạng dictionary (JSON)
        return kmeans.run(df)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


async def kohonen_service(
    file: UploadFile,
    rows: int,
    cols: int,
) -> Dict[str, Any]:
    # Tải dữ liệu từ file tải lên thành DataFrame
    df = await load_uploaded_table(file)

    # Kiểm tra tính hợp lệ của kích thước lưới và các siêu tham số
    if rows <= 0 or cols <= 0:
        raise HTTPException(status_code=400, detail="Kích thước lưới (rows, cols) phải lớn hơn 0")

    try:
        # Khởi tạo lớp xử lý mạng nơ-ron Kohonen
        kohonen = KohonenNetwork(rows=rows, cols=cols)
        # Chạy thuật toán và trả về kết quả cấu trúc
        return kohonen.run(df)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc