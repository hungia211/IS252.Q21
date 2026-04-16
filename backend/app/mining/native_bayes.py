from typing import Any, Dict, List

import pandas as pd


def _prepare_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = df.copy()
    cleaned.columns = [str(col).strip() for col in cleaned.columns]
    cleaned = cleaned.fillna("MISSING")

    for col in cleaned.columns:
        cleaned[col] = cleaned[col].astype(str).str.strip()

    return cleaned


def get_dataset_metadata(df: pd.DataFrame) -> Dict[str, Any]:
    cleaned = _prepare_dataframe(df)

    unique_values: Dict[str, List[str]] = {}
    for col in cleaned.columns:
        unique_values[col] = sorted(cleaned[col].astype(str).unique().tolist())

    return {
        "row_count": int(len(cleaned)),
        "columns": cleaned.columns.tolist(),
        "suggested_decision_attr": cleaned.columns[-1] if len(cleaned.columns) > 0 else None,
        "unique_values": unique_values,
    }


def run_naive_bayes_prediction(
    df: pd.DataFrame,
    decision_attr: str,
    selected_attributes: List[str],
    selected_values: Dict[str, str],
) -> Dict[str, Any]:
    cleaned = _prepare_dataframe(df)

    if decision_attr not in cleaned.columns:
        raise ValueError(f"Decision column '{decision_attr}' does not exist")

    for attr in selected_attributes:
        if attr not in cleaned.columns:
            raise ValueError(f"Selected attribute '{attr}' does not exist")

    classes = sorted(cleaned[decision_attr].unique().tolist())
    total_rows = len(cleaned)

    prior_probabilities: Dict[str, float] = {}
    conditional_probabilities: Dict[str, Any] = {}
    posterior_scores: Dict[str, float] = {}
    zero_probability_detected = False

    for cls in classes:
        class_subset = cleaned[cleaned[decision_attr] == cls]
        class_count = len(class_subset)

        prior = class_count / total_rows if total_rows > 0 else 0.0
        prior_probabilities[str(cls)] = float(prior)

        score = prior
        conditional_probabilities[str(cls)] = {}

        for attr in selected_attributes:
            value = str(selected_values[attr]).strip()
            match_count = int((class_subset[attr] == value).sum())
            probability = (match_count / class_count) if class_count > 0 else 0.0

            if probability == 0.0:
                zero_probability_detected = True

            conditional_probabilities[str(cls)][attr] = {
                "selected_value": value,
                "match_count": int(match_count),
                "class_count": int(class_count),
                "probability": float(probability),
            }

            score *= probability

        posterior_scores[str(cls)] = float(score)

    total_score = sum(posterior_scores.values())
    posterior_probabilities = {
        cls: (score / total_score if total_score > 0 else 0.0)
        for cls, score in posterior_scores.items()
    }

    predicted_class = max(posterior_scores, key=posterior_scores.get) if posterior_scores else None

    note = None
    if zero_probability_detected:
        note = (
            "Phát hiện xác suất bằng 0 trong Bayes thường. "
            "Nếu kết quả quá nhạy hoặc tất cả score đều bằng 0, nên dùng phiên bản Laplace."
        )

    return {
        "model": "naive_bayes",
        "decision_attr": decision_attr,
        "selected_attributes": selected_attributes,
        "selected_values": selected_values,
        "classes": classes,
        "prior_probabilities": prior_probabilities,
        "conditional_probabilities": conditional_probabilities,
        "posterior_scores": posterior_scores,
        "posterior_probabilities": posterior_probabilities,
        "predicted_class": predicted_class,
        "zero_probability_detected": zero_probability_detected,
        "note": note,
    }