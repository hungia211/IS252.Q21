# pip install pandas openpyxl
from itertools import combinations


def normalize_key(key):
    return key if isinstance(key, tuple) else (key,)


def get_equivalence_classes(df, object_col, attrs):
    if not attrs:
        return [{
            "attr_values": {},
            "objects": df[object_col].astype(str).tolist()
        }]

    grouped = df.groupby(attrs, dropna=False, sort=False)
    eq_classes = []

    for key, group in grouped:
        key = normalize_key(key)
        attr_values = {attrs[i]: str(key[i]) for i in range(len(attrs))}
        objects = group[object_col].astype(str).tolist()

        eq_classes.append({
            "attr_values": attr_values,
            "objects": objects
        })

    return eq_classes


def calculate_approximation(df, object_col, x_objects, b_attributes):
    df = df.copy()
    df[object_col] = df[object_col].astype(str)

    x_set = set(x_objects)
    eq_classes = get_equivalence_classes(df, object_col, b_attributes)

    lower = set()
    upper = set()

    for cls in eq_classes:
        cls_objects = set(cls["objects"])

        if cls_objects.issubset(x_set):
            lower |= cls_objects

        if cls_objects & x_set:
            upper |= cls_objects

    accuracy = len(lower) / len(upper) if len(upper) > 0 else 0.0

    return {
        "input": {
            "object_col": object_col,
            "x_objects": x_objects,
            "b_attributes": b_attributes
        },
        "equivalence_classes": eq_classes,
        "lower_approximation": sorted(lower),
        "upper_approximation": sorted(upper),
        "accuracy": round(accuracy, 4)
    }


def get_decision_classes(df, object_col, decision_attr):
    grouped = df.groupby(decision_attr, dropna=False, sort=False)
    result = {}

    for val, group in grouped:
        result[str(val)] = set(group[object_col].astype(str).tolist())

    return result


def lower_approximation_of_decision_classes(cond_eq_classes, decision_eq_classes):
    result = {}
    positive_region = set()

    for decision_value, decision_objects in decision_eq_classes.items():
        lower = set()

        for cls in cond_eq_classes:
            cls_objects = set(cls["objects"])
            if cls_objects.issubset(decision_objects):
                lower |= cls_objects

        result[decision_value] = sorted(lower)
        positive_region |= lower

    return result, sorted(positive_region)


def analyze_dependency(df, object_col, decision_attr, condition_attrs):
    df = df.copy()
    df[object_col] = df[object_col].astype(str)
    df[decision_attr] = df[decision_attr].astype(str)

    decision_grouped = df.groupby(decision_attr, dropna=False, sort=False)
    decision_eq_classes = {}
    for val, group in decision_grouped:
        decision_eq_classes[str(val)] = sorted(group[object_col].astype(str).tolist())

    decision_eq_classes_set = {k: set(v) for k, v in decision_eq_classes.items()}
    cond_eq_classes = get_equivalence_classes(df, object_col, condition_attrs)

    lower_result, positive_region = lower_approximation_of_decision_classes(
        cond_eq_classes,
        decision_eq_classes_set
    )

    k = len(positive_region) / len(df) if len(df) > 0 else 0.0

    return {
        "input": {
            "object_col": object_col,
            "decision_attr": decision_attr,
            "condition_attrs": condition_attrs
        },
        "decision_equivalence_classes": decision_eq_classes,
        "condition_equivalence_classes": cond_eq_classes,
        "lower_approximations": lower_result,
        "positive_region": positive_region,
        "dependency_degree": round(k, 4)
    }


def positive_region(df, object_col, condition_attrs, decision_attr):
    cond_eq = get_equivalence_classes(df, object_col, condition_attrs)
    decision_classes = get_decision_classes(df, object_col, decision_attr)

    pos = set()

    for _, decision_objects in decision_classes.items():
        for cls in cond_eq:
            cls_objects = set(cls["objects"])
            if cls_objects.issubset(decision_objects):
                pos |= cls_objects

    return pos


def dependency_degree(df, object_col, condition_attrs, decision_attr):
    pos = positive_region(df, object_col, condition_attrs, decision_attr)
    return len(pos) / len(df) if len(df) > 0 else 0.0


def find_reducts(df, object_col, condition_attrs, decision_attr):
    full_gamma = dependency_degree(df, object_col, condition_attrs, decision_attr)
    reducts = []

    for r in range(1, len(condition_attrs) + 1):
        for subset in combinations(condition_attrs, r):
            subset = list(subset)
            gamma_subset = dependency_degree(df, object_col, subset, decision_attr)

            if abs(gamma_subset - full_gamma) < 1e-9:
                minimal = True
                for red in reducts:
                    if set(red).issubset(set(subset)):
                        minimal = False
                        break

                if minimal:
                    reducts.append(subset)

    return reducts


def generate_exact_rules(df, reducts, decision_attr):
    all_rules = []

    for reduct in reducts:
        grouped = df.groupby(reduct, dropna=False, sort=False)

        for key, group in grouped:
            key = normalize_key(key)
            decisions = group[decision_attr].astype(str).unique().tolist()

            if len(decisions) == 1:
                conditions = {reduct[i]: str(key[i]) for i in range(len(reduct))}
                decision_value = decisions[0]

                rule = {
                    "reduct": reduct,
                    "conditions": conditions,
                    "decision": decision_value,
                    "support": len(group),
                    "confidence": 1.0
                }
                all_rules.append(rule)

    unique = {}
    for rule in all_rules:
        key = (tuple(sorted(rule["conditions"].items())), rule["decision"])
        if key not in unique:
            unique[key] = rule
        else:
            old = unique[key]
            if len(rule["reduct"]) < len(old["reduct"]):
                unique[key] = rule
            elif len(rule["reduct"]) == len(old["reduct"]) and rule["support"] > old["support"]:
                unique[key] = rule

    rules = list(unique.values())
    rules.sort(key=lambda x: (-x["support"], len(x["conditions"])))
    return rules


def analyze_reduct_and_rules(df, object_col, decision_attr, condition_attrs):
    df = df.copy()
    df[object_col] = df[object_col].astype(str)
    df[decision_attr] = df[decision_attr].astype(str)

    full_gamma = dependency_degree(df, object_col, condition_attrs, decision_attr)
    reducts = find_reducts(df, object_col, condition_attrs, decision_attr)
    exact_rules = generate_exact_rules(df, reducts, decision_attr)

    return {
        "inferred_columns": {
            "object_col": object_col,
            "condition_attrs": condition_attrs,
            "decision_attr": decision_attr
        },
        "dependency_degree": round(full_gamma, 4),
        "reducts": reducts,
        "top_3_exact_rules": exact_rules[:3],
        "total_exact_rules": len(exact_rules)
    }