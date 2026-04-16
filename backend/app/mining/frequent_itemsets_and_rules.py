from itertools import combinations
import pandas as pd


#  DATA PREPARATION

def build_transaction_list(df: pd.DataFrame) -> list[frozenset]:
    transaction_col = df.columns[0]
    item_col = df.columns[1]

    transactions = (
        df.groupby(transaction_col)[item_col]
        .apply(lambda items: frozenset(items.astype(str).tolist()))
        .tolist()
    )
    return transactions


#  FREQUENT ITEMSETS  (Apriori)

def compute_support(itemset: frozenset, transactions: list[frozenset]) -> float:
    count = sum(1 for t in transactions if itemset.issubset(t))
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
    all_items = frozenset(item for t in transactions for item in t)
    n = len(transactions)

    result = []
    current_frequent = []

    # Kích thước 1
    for item in all_items:
        fs = frozenset([item])
        sup = compute_support(fs, transactions)
        if sup >= min_support:
            current_frequent.append(fs)
            result.append({
                "itemset": fs,
                "support": round(sup, 6),
                "count": round(sup * n),
            })

    size = 2
    while current_frequent:
        candidates = generate_candidates(current_frequent, size)
        current_frequent = []

        for candidate in candidates:
            sup = compute_support(candidate, transactions)
            if sup >= min_support:
                current_frequent.append(candidate)
                result.append({
                    "itemset": candidate,
                    "support": round(sup, 6),
                    "count": round(sup * n),
                })

        size += 1

    result.sort(key=lambda x: (len(x["itemset"]), -x["support"]))
    return result


def find_maximal_frequent_itemsets(frequent_itemsets: list[dict]) -> list[dict]:
    all_itemsets = [entry["itemset"] for entry in frequent_itemsets]
    maximal = []

    for entry in frequent_itemsets:
        fs = entry["itemset"]
        is_maximal = not any(
            fs < other  # fs là tập con thực sự của other
            for other in all_itemsets
            if other != fs
        )
        if is_maximal:
            maximal.append(entry)

    maximal.sort(key=lambda x: (len(x["itemset"]), -x["support"]))
    return maximal


#  ASSOCIATION RULES

def generate_association_rules(
    frequent_itemsets: list[dict],
    transactions: list[frozenset],
    min_confidence: float
) -> list[dict]:
    rules = []
    freq_map = {fs["itemset"]: fs["support"] for fs in frequent_itemsets}

    for entry in frequent_itemsets:
        itemset = entry["itemset"]
        if len(itemset) < 2:
            continue

        for size in range(1, len(itemset)):
            for antecedent_tuple in combinations(sorted(itemset), size):
                antecedent = frozenset(antecedent_tuple)
                consequent = itemset - antecedent

                sup_antecedent = freq_map.get(antecedent)
                if sup_antecedent is None:
                    sup_antecedent = compute_support(antecedent, transactions)

                if sup_antecedent == 0:
                    continue

                sup_consequent = freq_map.get(consequent)
                if sup_consequent is None:
                    sup_consequent = compute_support(consequent, transactions)

                confidence = entry["support"] / sup_antecedent
                if confidence < min_confidence:
                    continue

                rules.append({
                    "antecedent": antecedent,
                    "consequent": consequent,
                    "confidence": round(confidence, 6),
                })

    rules.sort(key=lambda x: (len(x["antecedent"]), -x["confidence"]))
    return rules


#  MAIN ANALYSIS FUNCTION

def analyze_frequent_itemsets_and_rules(
    df: pd.DataFrame,
    min_support: float,
    min_confidence: float
) -> dict:
    if df.shape[1] != 2:
        raise ValueError(
            f"DataFrame phải có đúng 2 cột (mã giao dịch, mã hàng). "
            f"Hiện có {df.shape[1]} cột."
        )
    if not (0.0 < min_support <= 1.0):
        raise ValueError("min_support phải nằm trong khoảng (0, 1].")
    if not (0.0 < min_confidence <= 1.0):
        raise ValueError("min_confidence phải nằm trong khoảng (0, 1].")

    transactions    = build_transaction_list(df)

    frequent_itemsets         = find_frequent_itemsets(transactions, min_support)
    maximal_frequent_itemsets = find_maximal_frequent_itemsets(frequent_itemsets)
    association_rules         = generate_association_rules(
        frequent_itemsets, transactions, min_confidence
    )

    # Serialize frozenset
    def serialize_itemsets(itemsets):
        return [
            {
                "itemset": sorted(entry["itemset"]),
                "support": entry["support"],
                "count":   entry["count"],
            }
            for entry in itemsets
        ]

    def serialize_rules(rules):
        return [
            {
                "rule":       f"{sorted(r['antecedent'])} → {sorted(r['consequent'])}",
                "confidence": r["confidence"],
            }
            for r in rules
        ]

    return {
        "min_mupport":      min_support,
        "min_confidence":   min_confidence,
        "frequent_itemsets":               serialize_itemsets(frequent_itemsets),
        "total_frequent_itemsets":         len(frequent_itemsets),
        "maximal_frequent_itemsets":       serialize_itemsets(maximal_frequent_itemsets),
        "total_maximal_frequent_itemsets": len(maximal_frequent_itemsets),
        "association_rules":               serialize_rules(association_rules),
        "total_rules":                     len(association_rules),
    }