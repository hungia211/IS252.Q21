from fastapi import APIRouter, File, Form, UploadFile

from app.services.clustering_service import (
    kmeans_service,
    kohonen_service,
)

router = APIRouter(prefix="/clustering", tags=["Clustering"])


@router.post("/k-means")
async def run_k_means(
    file: UploadFile = File(...),
    k: int = Form(...),
    max_iters: int = Form(100),
):
    return await kmeans_service(
        file=file,
        k=k,
        max_iters=max_iters,
    )


@router.post("/kohonen")
async def run_kohonen(
    file: UploadFile = File(...),
    rows: int = Form(...),
    cols: int = Form(...),
):
    return await kohonen_service(
        file=file,
        rows=rows,
        cols=cols,
    )