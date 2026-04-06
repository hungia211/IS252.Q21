from fastapi import APIRouter, File, Form, UploadFile
from app.services.rough_set_service import (
    process_rough_approximation,
    process_dependency_analysis,
    process_reduct_analysis,
)

router = APIRouter(prefix="/rough-set", tags=["Rough Set"])


@router.post("/approximation")
async def rough_approximation_api(
    file: UploadFile = File(...),
    object_col: str = Form(""),
    x_objects: str = Form(...),
    b_attributes: str = Form(...),
):
    return await process_rough_approximation(
        file=file,
        object_col=object_col,
        x_objects=x_objects,
        b_attributes=b_attributes,
    )


@router.post("/dependency")
async def dependency_analysis_api(
    file: UploadFile = File(...),
    object_col: str = Form(""),
    decision_attr: str = Form(...),
    condition_attrs: str = Form(...),
):
    return await process_dependency_analysis(
        file=file,
        object_col=object_col,
        decision_attr=decision_attr,
        condition_attrs=condition_attrs,
    )


@router.post("/reduct")
async def reduct_analysis_api(
    file: UploadFile = File(...),
):
    return await process_reduct_analysis(file=file)