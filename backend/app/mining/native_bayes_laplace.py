from typing import Any, Dict, List

import pandas as pd


def _prepare_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = df.copy()
    cleaned.columns = [str(col).strip() for col in cleaned.columns]
    cleaned = cleaned.fillna("MISSING")

    for col in cleaned.columns:
        cleaned[col] = cleaned[col].astype(str).str.strip()

    return cleaned


def run_naive_bayes_laplace_prediction(
    df: pd.DataFrame,
    decision_attr: str,
    selected_attributes: List[str],
    selected_values: Dict[str, str],
    alpha: float = 1.0,
) -> Dict[str, Any]:
    cleaned = _prepare_dataframe(df)

    if decision_attr not in cleaned.columns:
        raise ValueError(f"Decision column '{decision_attr}' does not exist")

    for attr in selected_attributes:
        if attr not in cleaned.columns:
            raise ValueError(f"Selected attribute '{attr}' does not exist")

    if alpha <= 0:
        raise ValueError("laplace_alpha must be greater than 0")

    classes = sorted(cleaned[decision_attr].unique().tolist())
    total_rows = len(cleaned)

    prior_probabilities: Dict[str, float] = {}
    conditional_probabilities_after_laplace: Dict[str, Any] = {}
    posterior_scores: Dict[str, float] = {}

    for cls in classes:
        class_subset = cleaned[cleaned[decision_attr] == cls]
        class_count = len(class_subset)

        prior = class_count / total_rows if total_rows > 0 else 0.0
        prior_probabilities[str(cls)] = float(prior)

        score = prior
        conditional_probabilities_after_laplace[str(cls)] = {}

        for attr in selected_attributes:
            value = str(selected_values[attr]).strip()
            known_values = sorted(cleaned[attr].unique().tolist())
            value_space_size = len(known_values)

            if value not in known_values:
                value_space_size += 1

            match_count = int((class_subset[attr] == value).sum())
            numerator = match_count + alpha
            denominator = class_count + alpha * value_space_size
            probability = numerator / denominator if denominator > 0 else 0.0

            conditional_probabilities_after_laplace[str(cls)][attr] = {
                "selected_value": value,
                "match_count_before_laplace": int(match_count),
                "alpha": float(alpha),
                "value_space_size": int(value_space_size),
                "numerator": float(numerator),
                "denominator": float(denominator),
                "probability_after_laplace": float(probability),
            }

            score *= probability

        posterior_scores[str(cls)] = float(score)

    total_score = sum(posterior_scores.values())
    posterior_probabilities = {
        cls: (score / total_score if total_score > 0 else 0.0)
        for cls, score in posterior_scores.items()
    }

    predicted_class = max(posterior_scores, key=posterior_scores.get) if posterior_scores else None

    return {
        "model": "naive_bayes_laplace",
        "decision_attr": decision_attr,
        "selected_attributes": selected_attributes,
        "selected_values": selected_values,
        "laplace_alpha": float(alpha),
        "classes": classes,
        "prior_probabilities": prior_probabilities,
        "conditional_probabilities_after_laplace": conditional_probabilities_after_laplace,
        "posterior_scores": posterior_scores,
        "posterior_probabilities": posterior_probabilities,
        "predicted_class": predicted_class,
        "note": "Phiên bản này dùng Laplace smoothing để tránh xác suất bằng 0.",
    }