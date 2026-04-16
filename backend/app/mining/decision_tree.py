import math
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd


EPSILON = 1e-12

# hàm chuẩn hóa dữ liệu
def _prepare_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = df.copy()
    cleaned.columns = [str(col).strip() for col in cleaned.columns]
    cleaned = cleaned.fillna("MISSING")

    for col in cleaned.columns:
        cleaned[col] = cleaned[col].astype(str).str.strip()

    return cleaned

# tính entropy
def _entropy(series: pd.Series) -> float:
    counts = series.value_counts()
    total = len(series)
    if total == 0:
        return 0.0

    value = 0.0
    for count in counts:
        p = count / total
        if p > 0:
            value -= p * math.log2(p)
    return float(value)

# tính gini
def _gini(series: pd.Series) -> float:
    counts = series.value_counts()
    total = len(series)
    if total == 0:
        return 0.0

    return float(1.0 - sum((count / total) ** 2 for count in counts))

# tính chi tiết entropy khi chia theo một thuộc tính
def _split_details_entropy(
    df: pd.DataFrame,
    feature: str,
    target_col: str,
) -> Tuple[float, Dict[str, Any]]:
    total = len(df)
    weighted_entropy = 0.0
    branches: Dict[str, Any] = {}

    for feature_value, subset in df.groupby(feature, dropna=False):
        branch_entropy = _entropy(subset[target_col])
        weight = len(subset) / total
        weighted_entropy += weight * branch_entropy

        branches[str(feature_value)] = {
            "count": int(len(subset)),
            "weight": float(weight),
            "class_distribution": {
                str(k): int(v) for k, v in subset[target_col].value_counts().to_dict().items()
            },
            "entropy": float(branch_entropy),
        }

    return float(weighted_entropy), branches

# tính chi tiết gini
def _split_details_gini(
    df: pd.DataFrame,
    feature: str,
    target_col: str,
) -> Tuple[float, Dict[str, Any]]:
    total = len(df)
    weighted_gini = 0.0
    branches: Dict[str, Any] = {}

    for feature_value, subset in df.groupby(feature, dropna=False):
        branch_gini = _gini(subset[target_col])
        weight = len(subset) / total
        weighted_gini += weight * branch_gini

        branches[str(feature_value)] = {
            "count": int(len(subset)),
            "weight": float(weight),
            "class_distribution": {
                str(k): int(v) for k, v in subset[target_col].value_counts().to_dict().items()
            },
            "gini": float(branch_gini),
        }

    return float(weighted_gini), branches

# tính điểm cho từng feature
def _compute_feature_scores(
    df: pd.DataFrame,
    features: List[str],
    target_col: str,
    algorithm: str,
) -> Tuple[Dict[str, float], Dict[str, Any], float]:
    scores: Dict[str, float] = {}
    details: Dict[str, Any] = {}

    if algorithm == "gain":
        base_score = _entropy(df[target_col])

        for feature in features:
            weighted_entropy, branches = _split_details_entropy(df, feature, target_col)
            gain = base_score - weighted_entropy

            scores[feature] = float(gain)
            details[feature] = {
                "base_entropy": float(base_score),
                "weighted_entropy_after_split": float(weighted_entropy),
                "information_gain": float(gain),
                "branches": branches,
            }

        return scores, details, float(base_score)

    if algorithm == "gini":
        base_score = _gini(df[target_col])

        for feature in features:
            weighted_gini, branches = _split_details_gini(df, feature, target_col)

            scores[feature] = float(weighted_gini)
            details[feature] = {
                "base_gini": float(base_score),
                "weighted_gini_after_split": float(weighted_gini),
                "branches": branches,
            }

        return scores, details, float(base_score)

    raise ValueError("algorithm must be either 'gain' or 'gini'")

# lấy class chiếm đa số
def _majority_class(series: pd.Series) -> str:
    mode = series.mode()
    if mode.empty:
        return str(series.iloc[0])
    return str(mode.iloc[0])

# chọn feature tốt nhất
def _select_best_feature(scores: Dict[str, float], algorithm: str) -> Optional[str]:
    if not scores:
        return None

    if algorithm == "gain":
        return max(scores, key=scores.get)

    return min(scores, key=scores.get)


def _has_meaningful_improvement(
    current_score: float,
    best_feature_score: float,
    algorithm: str,
) -> bool:
    if algorithm == "gain":
        return best_feature_score > EPSILON

    return best_feature_score + EPSILON < current_score


# xây dựng cây
def _build_tree(
    df: pd.DataFrame,
    target_col: str,
    features: List[str],
    algorithm: str,
) -> Dict[str, Any]:
    majority = _majority_class(df[target_col])

    if df[target_col].nunique() == 1:
        return {
            "type": "leaf",
            "label": str(df[target_col].iloc[0]),
            "samples": int(len(df)),
            "majority_class": majority,
            "reason": "pure_node",
        }

    if not features:
        return {
            "type": "leaf",
            "label": majority,
            "samples": int(len(df)),
            "majority_class": majority,
            "reason": "no_feature_left",
        }

    feature_scores, _, current_score = _compute_feature_scores(df, features, target_col, algorithm)
    best_feature = _select_best_feature(feature_scores, algorithm)

    if best_feature is None:
        return {
            "type": "leaf",
            "label": majority,
            "samples": int(len(df)),
            "majority_class": majority,
            "reason": "no_valid_split",
        }

    if not _has_meaningful_improvement(current_score, feature_scores[best_feature], algorithm):
        return {
            "type": "leaf",
            "label": majority,
            "samples": int(len(df)),
            "majority_class": majority,
            "reason": "no_impurity_reduction",
        }

    remaining_features = [feature for feature in features if feature != best_feature]

    node: Dict[str, Any] = {
        "type": "node",
        "feature": best_feature,
        "criterion": algorithm,
        "score": float(feature_scores[best_feature]),
        "current_score": float(current_score),
        "samples": int(len(df)),
        "majority_class": majority,
        "children": {},
    }

    for feature_value, subset in df.groupby(best_feature, dropna=False):
        child_df = subset.drop(columns=[best_feature])
        node["children"][str(feature_value)] = _build_tree(
            child_df,
            target_col=target_col,
            features=remaining_features,
            algorithm=algorithm,
        )

    return node


def _node_metric_text(node: Dict[str, Any]) -> str:
    if node.get("criterion") == "gain":
        return f"gain={node.get('score', 0.0):.4f}"
    return f"weighted_gini={node.get('score', 0.0):.4f}"


# chuyển cây thành text
def tree_to_text(tree: Dict[str, Any]) -> str:
    lines: List[str] = []

    def walk(node: Dict[str, Any], prefix: str = "") -> None:
        if node["type"] == "leaf":
            lines.append(
                f"{prefix}Predict = {node['label']} (samples={node['samples']}, reason={node.get('reason', 'leaf')})"
            )
            return

        lines.append(
            f"{prefix}[{node['feature']}] ({_node_metric_text(node)}, samples={node['samples']})"
        )

        children = list(node["children"].items())
        for index, (feature_value, child) in enumerate(children):
            connector = "└──" if index == len(children) - 1 else "├──"
            lines.append(f"{prefix}{connector} {node['feature']} = {feature_value}")

            extension = "    " if index == len(children) - 1 else "│   "
            walk(child, prefix + extension)

    walk(tree)
    return "\n".join(lines)


# dự đoán
def predict_one(tree: Dict[str, Any], row: pd.Series) -> str:
    node = tree

    while node["type"] == "node":
        feature = node["feature"]
        value = str(row.get(feature, "MISSING"))

        if value in node["children"]:
            node = node["children"][value]
        else:
            return str(node["majority_class"])

    return str(node["label"])


def run_decision_tree_analysis(
    df: pd.DataFrame,
    target_col: Optional[str] = None,
    algorithm: str = "gain",
) -> Dict[str, Any]:
    cleaned = _prepare_dataframe(df)

    if cleaned.empty:
        raise ValueError("Dataset is empty")

    if target_col is None:
        target_col = cleaned.columns[-1]

    if target_col not in cleaned.columns:
        raise ValueError(f"Target column '{target_col}' does not exist")

    algorithm = algorithm.lower().strip()
    if algorithm not in {"gain", "gini"}:
        raise ValueError("algorithm must be either 'gain' or 'gini'")

    features = [col for col in cleaned.columns if col != target_col]
    if not features:
        raise ValueError("Dataset must contain at least one feature column")

    feature_scores, feature_details, dataset_score = _compute_feature_scores(
        cleaned,
        features,
        target_col,
        algorithm,
    )

    best_attribute = _select_best_feature(feature_scores, algorithm)
    tree_structure = _build_tree(
        cleaned,
        target_col=target_col,
        features=features,
        algorithm=algorithm,
    )
    tree_representation = tree_to_text(tree_structure)

    training_predictions = []
    for _, row in cleaned.iterrows():
        training_predictions.append(predict_one(tree_structure, row))

    root_explanation = None
    if best_attribute is not None:
        if algorithm == "gain":
            root_explanation = (
                f"Thuộc tính '{best_attribute}' được chọn vì có Information Gain lớn nhất "
                f"({feature_scores[best_attribute]:.6f}), tức là làm giảm entropy mạnh nhất."
            )
        else:
            root_explanation = (
                f"Thuộc tính '{best_attribute}' được chọn vì có weighted Gini nhỏ nhất "
                f"({feature_scores[best_attribute]:.6f}), tức là tạo ra các nhánh con sạch hơn."
            )

    return {
        "selected_algorithm": algorithm,
        "target_col": target_col,
        "features_used": features,
        "dataset_score": float(dataset_score),
        "feature_scores": feature_scores,
        "feature_details": feature_details,
        "best_attribute": best_attribute,
        "root_explanation": root_explanation,
        "tree_structure": tree_structure,
        "tree_representation": tree_representation,
        "training_predictions": training_predictions,
    }