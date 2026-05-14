from itertools import combinations
import re

import pandas as pd


def normalize_item(value) -> str:
    text = str(value).strip()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([,.;:])$", r"\1", text)
    text = re.sub(r"[.;]+$", "", text).strip()
    return text


def build_transaction_list(df: pd.DataFrame) -> list[frozenset]:
    transaction_col = df.columns[0]
    item_col = df.columns[1]

    clean_df = df.copy()
    clean_df[transaction_col] = clean_df[transaction_col].astype(str).str.strip()
    clean_df[item_col] = clean_df[item_col].map(normalize_item)
    clean_df = clean_df[clean_df[item_col] != ""]

    transactions = (
        clean_df.groupby(transaction_col)[item_col]
        .apply(lambda items: frozenset(items.tolist()))
        .tolist()
    )
    return transactions


def compute_support(itemset: frozenset, transactions: list[frozenset]) -> float:
    count = sum(1 for transaction in transactions if itemset.issubset(transaction))
    return count / len(transactions) if transactions else 0.0


def generate_candidates(prev_frequent: list[frozenset], size: int) -> list[frozenset]:
    candidates = set()
    for a, b in combinations(prev_frequent, 2):
        union = a | b
        if len(union) == size:
            candidates.add(union)
    return list(candidates)


def find_frequent_itemsets(
    transactions: list[frozenset],
    min_support: float
) -> list[dict]:
    all_items = frozenset(item for transaction in transactions for item in transaction)
    transaction_count = len(transactions)

    result = []
    current_frequent = []

    for item in all_items:
        itemset = frozenset([item])
        support = compute_support(itemset, transactions)
        if support >= min_support:
            current_frequent.append(itemset)
            result.append({
                "itemset": itemset,
                "support": round(support, 6),
                "count": round(support * transaction_count),
            })

    size = 2
    while current_frequent:
        candidates = generate_candidates(current_frequent, size)
        current_frequent = []

        for candidate in candidates:
            support = compute_support(candidate, transactions)
            if support >= min_support:
                current_frequent.append(candidate)
                result.append({
                    "itemset": candidate,
                    "support": round(support, 6),
                    "count": round(support * transaction_count),
                })

        size += 1

    result.sort(key=lambda item: (len(item["itemset"]), -item["support"], sorted(item["itemset"])))
    return result


def find_maximal_frequent_itemsets(frequent_itemsets: list[dict]) -> list[dict]:
    all_itemsets = [entry["itemset"] for entry in frequent_itemsets]
    maximal = []

    for entry in frequent_itemsets:
        itemset = entry["itemset"]
        is_maximal = not any(
            itemset < other
            for other in all_itemsets
            if other != itemset
        )
        if is_maximal:
            maximal.append(entry)

    maximal.sort(key=lambda item: (len(item["itemset"]), -item["support"], sorted(item["itemset"])))
    return maximal


def generate_association_rules(
    frequent_itemsets: list[dict],
    transactions: list[frozenset],
    min_confidence: float
) -> list[dict]:
    rules = []
    freq_map = {itemset["itemset"]: itemset["support"] for itemset in frequent_itemsets}

    for entry in frequent_itemsets:
        itemset = entry["itemset"]
        if len(itemset) < 2:
            continue

        for size in range(1, len(itemset)):
            for antecedent_tuple in combinations(sorted(itemset), size):
                antecedent = frozenset(antecedent_tuple)
                consequent = itemset - antecedent

                antecedent_support = freq_map.get(antecedent)
                if antecedent_support is None:
                    antecedent_support = compute_support(antecedent, transactions)

                if antecedent_support == 0:
                    continue

                confidence = entry["support"] / antecedent_support
                if confidence < min_confidence:
                    continue

                rules.append({
                    "antecedent": antecedent,
                    "consequent": consequent,
                    "confidence": round(confidence, 6),
                })

    rules.sort(key=lambda rule: (
        len(rule["antecedent"]),
        -rule["confidence"],
        sorted(rule["antecedent"]),
        sorted(rule["consequent"]),
    ))
    return rules


def analyze_frequent_itemsets_and_rules(
    df: pd.DataFrame,
    min_support: float,
    min_confidence: float
) -> dict:
    if df.shape[1] != 2:
        raise ValueError(
            f"DataFrame must contain exactly 2 columns (transaction_id, item). "
            f"Found: {df.shape[1]}."
        )
    if not (0.0 < min_support <= 1.0):
        raise ValueError("min_support must be in range (0, 1].")
    if not (0.0 < min_confidence <= 1.0):
        raise ValueError("min_confidence must be in range (0, 1].")

    transactions = build_transaction_list(df)

    frequent_itemsets = find_frequent_itemsets(transactions, min_support)
    maximal_frequent_itemsets = find_maximal_frequent_itemsets(frequent_itemsets)
    association_rules = generate_association_rules(
        frequent_itemsets, transactions, min_confidence
    )

    def serialize_itemsets(itemsets):
        return [
            {
                "itemset": sorted(entry["itemset"]),
                "support": entry["support"],
                "count": entry["count"],
            }
            for entry in itemsets
        ]

    def serialize_rules(rules):
        return [
            {
                "antecedent": sorted(rule["antecedent"]),
                "consequent": sorted(rule["consequent"]),
                "rule": (
                    f"{', '.join(sorted(rule['antecedent']))} -> "
                    f"{', '.join(sorted(rule['consequent']))}"
                ),
                "confidence": rule["confidence"],
            }
            for rule in rules
        ]

    return {
        "min_support": min_support,
        "min_confidence": min_confidence,
        "frequent_itemsets": serialize_itemsets(frequent_itemsets),
        "total_frequent_itemsets": len(frequent_itemsets),
        "maximal_frequent_itemsets": serialize_itemsets(maximal_frequent_itemsets),
        "total_maximal_frequent_itemsets": len(maximal_frequent_itemsets),
        "association_rules": serialize_rules(association_rules),
        "total_rules": len(association_rules),
    }
