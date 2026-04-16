import json
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, UploadFile

from app.mining.decision_tree import run_decision_tree_analysis
from app.mining.native_bayes_laplace import run_naive_bayes_laplace_prediction
from app.mining.native_bayes import get_dataset_metadata, run_naive_bayes_prediction
from app.services.file_service import load_uploaded_table


def _parse_list_field(raw_value: str, field_name: str) -> List[str]:
    if raw_value is None or not raw_value.strip():
        raise HTTPException(status_code=400, detail=f"'{field_name}' is required")

    raw_value = raw_value.strip()

    if raw_value.startswith("["):
        try:
            parsed = json.loads(raw_value)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=400,
                detail=f"'{field_name}' is not valid JSON array",
            ) from exc

        if not isinstance(parsed, list):
            raise HTTPException(status_code=400, detail=f"'{field_name}' must be a list")

        values = [str(item).strip() for item in parsed if str(item).strip()]
        if not values:
            raise HTTPException(status_code=400, detail=f"'{field_name}' cannot be empty")
        return values

    values = [item.strip() for item in raw_value.split(",") if item.strip()]
    if not values:
        raise HTTPException(status_code=400, detail=f"'{field_name}' cannot be empty")
    return values


def _parse_selected_values_json(raw_value: str) -> Dict[str, str]:
    if raw_value is None or not raw_value.strip():
        raise HTTPException(status_code=400, detail="'selected_values_json' is required")

    try:
        parsed = json.loads(raw_value)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="'selected_values_json' must be a valid JSON object string",
        ) from exc

    if not isinstance(parsed, dict):
        raise HTTPException(
            status_code=400,
            detail="'selected_values_json' must be a JSON object",
        )

    result: Dict[str, str] = {}
    for key, value in parsed.items():
        result[str(key).strip()] = str(value).strip()

    if not result:
        raise HTTPException(status_code=400, detail="'selected_values_json' cannot be empty")

    return result


def _validate_decision_and_attributes(
    columns: List[str],
    decision_attr: str,
    selected_attributes: List[str],
    selected_values: Dict[str, str],
) -> None:
    if decision_attr not in columns:
        raise HTTPException(
            status_code=400,
            detail=f"Decision attribute '{decision_attr}' does not exist",
        )

    for attr in selected_attributes:
        if attr not in columns:
            raise HTTPException(
                status_code=400,
                detail=f"Selected attribute '{attr}' does not exist",
            )

        if attr == decision_attr:
            raise HTTPException(
                status_code=400,
                detail=f"Selected attribute '{attr}' must be different from decision_attr",
            )

        if attr not in selected_values:
            raise HTTPException(
                status_code=400,
                detail=f"Missing selected value for attribute '{attr}'",
            )


async def get_classification_metadata_service(file: UploadFile) -> Dict[str, Any]:
    df = await load_uploaded_table(file)
    return get_dataset_metadata(df)


# đọc file, kiểm tra xem tham số algorithm là gini hay gain để gọi hàm run_decision_tree_analysis
async def decision_tree_service(
    file: UploadFile,
    algorithm: str,
    target_col: Optional[str],
) -> Dict[str, Any]:
    df = await load_uploaded_table(file)

    algorithm = (algorithm or "").strip().lower()
    if algorithm not in {"gain", "gini"}:
        raise HTTPException(status_code=400, detail="algorithm must be 'gain' or 'gini'")

    if target_col is not None:
        target_col = target_col.strip()
        if not target_col:
            target_col = None

    try:
        return run_decision_tree_analysis(
            df=df,
            target_col=target_col,
            algorithm=algorithm,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


async def naive_bayes_service(
    file: UploadFile,
    decision_attr: str,
    selected_attributes_raw: str,
    selected_values_json: str,
) -> Dict[str, Any]:
    df = await load_uploaded_table(file)
    columns = df.columns.tolist()

    selected_attributes = _parse_list_field(selected_attributes_raw, "selected_attributes")
    selected_values = _parse_selected_values_json(selected_values_json)
    decision_attr = decision_attr.strip()

    _validate_decision_and_attributes(columns, decision_attr, selected_attributes, selected_values)

    try:
        return run_naive_bayes_prediction(
            df=df,
            decision_attr=decision_attr,
            selected_attributes=selected_attributes,
            selected_values=selected_values,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


async def naive_bayes_laplace_service(
    file: UploadFile,
    decision_attr: str,
    selected_attributes_raw: str,
    selected_values_json: str,
    laplace_alpha: float,
) -> Dict[str, Any]:
    df = await load_uploaded_table(file)
    columns = df.columns.tolist()

    selected_attributes = _parse_list_field(selected_attributes_raw, "selected_attributes")
    selected_values = _parse_selected_values_json(selected_values_json)
    decision_attr = decision_attr.strip()

    _validate_decision_and_attributes(columns, decision_attr, selected_attributes, selected_values)

    if laplace_alpha <= 0:
        raise HTTPException(status_code=400, detail="laplace_alpha must be greater than 0")

    try:
        return run_naive_bayes_laplace_prediction(
            df=df,
            decision_attr=decision_attr,
            selected_attributes=selected_attributes,
            selected_values=selected_values,
            alpha=laplace_alpha,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc