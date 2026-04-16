from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile

from app.services.classification_service import (
    decision_tree_service,
    get_classification_metadata_service,
    naive_bayes_laplace_service,
    naive_bayes_service,
)

router = APIRouter(prefix="/classification", tags=["Classification"])


@router.post("/metadata")
async def get_classification_metadata(
    file: UploadFile = File(...),
):
    return await get_classification_metadata_service(file)


@router.post("/decision-tree")
async def build_decision_tree(
    file: UploadFile = File(...),
    algorithm: str = Form(...),
    target_col: Optional[str] = Form(None),
):
    return await decision_tree_service(
        file=file,
        algorithm=algorithm,
        target_col=target_col,
    )


@router.post("/naive-bayes/predict")
async def predict_naive_bayes(
    file: UploadFile = File(...),
    decision_attr: str = Form(...),
    selected_attributes: str = Form(...),
    selected_values_json: str = Form(...),
):
    return await naive_bayes_service(
        file=file,
        decision_attr=decision_attr,
        selected_attributes_raw=selected_attributes,
        selected_values_json=selected_values_json,
    )


@router.post("/naive-bayes-laplace/predict")
async def predict_naive_bayes_laplace(
    file: UploadFile = File(...),
    decision_attr: str = Form(...),
    selected_attributes: str = Form(...),
    selected_values_json: str = Form(...),
    laplace_alpha: float = Form(1.0),
):
    return await naive_bayes_laplace_service(
        file=file,
        decision_attr=decision_attr,
        selected_attributes_raw=selected_attributes,
        selected_values_json=selected_values_json,
        laplace_alpha=laplace_alpha,
    )