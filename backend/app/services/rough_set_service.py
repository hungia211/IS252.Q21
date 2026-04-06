from fastapi import HTTPException, UploadFile
from app.services.file_service import load_uploaded_csv, parse_comma_separated_list
from app.mining.rough_set import (
    calculate_approximation,
    analyze_dependency,
    analyze_reduct_and_rules,
)


async def process_rough_approximation(
    file: UploadFile,
    object_col: str,
    x_objects: str,
    b_attributes: str,
):
    df = await load_uploaded_csv(file)

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file has no data.")

    object_col = object_col.strip() if object_col else ""
    if not object_col:
        object_col = df.columns[0]

    X = parse_comma_separated_list(x_objects)
    B = parse_comma_separated_list(b_attributes)

    if not X:
        raise HTTPException(status_code=400, detail="x_objects cannot be empty.")

    if not B:
        raise HTTPException(status_code=400, detail="b_attributes cannot be empty.")

    if object_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{object_col}' does not exist.")

    for b in B:
        if b not in df.columns:
            raise HTTPException(status_code=400, detail=f"Attribute '{b}' does not exist.")

    all_objects = set(df[object_col].astype(str).tolist())
    missing_objects = [obj for obj in X if obj not in all_objects]
    if missing_objects:
        raise HTTPException(
            status_code=400,
            detail=f"These objects do not exist in CSV: {missing_objects}"
        )

    return calculate_approximation(
        df=df,
        object_col=object_col,
        x_objects=X,
        b_attributes=B,
    )


async def process_dependency_analysis(
    file: UploadFile,
    object_col: str,
    decision_attr: str,
    condition_attrs: str,
):
    df = await load_uploaded_csv(file)

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file has no data.")

    object_col = object_col.strip() if object_col else ""
    if not object_col:
        object_col = df.columns[0]

    C = parse_comma_separated_list(condition_attrs)

    if object_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{object_col}' does not exist.")

    if decision_attr not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"Decision attribute '{decision_attr}' does not exist."
        )

    if not C:
        raise HTTPException(status_code=400, detail="condition_attrs cannot be empty.")

    for c in C:
        if c not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Condition attribute '{c}' does not exist."
            )

    if decision_attr in C:
        raise HTTPException(
            status_code=400,
            detail="decision_attr must not be inside condition_attrs."
        )

    return analyze_dependency(
        df=df,
        object_col=object_col,
        decision_attr=decision_attr,
        condition_attrs=C,
    )


async def process_reduct_analysis(file: UploadFile):
    df = await load_uploaded_csv(file)

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file has no data.")

    if len(df.columns) < 3:
        raise HTTPException(
            status_code=400,
            detail="CSV must contain at least 3 columns: object_id, condition attributes..., decision attribute."
        )

    object_col = df.columns[0]
    decision_attr = df.columns[-1]
    condition_attrs = list(df.columns[1:-1])

    return analyze_reduct_and_rules(
        df=df,
        object_col=object_col,
        decision_attr=decision_attr,
        condition_attrs=condition_attrs,
    )