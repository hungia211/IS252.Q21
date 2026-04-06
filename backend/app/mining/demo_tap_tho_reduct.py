import pandas as pd
from itertools import combinations
from pathlib import Path


def resolve_csv_path(file_path: str) -> Path:
    p = Path(file_path)

    if p.is_absolute() and p.exists():
        return p

    cwd_path = Path.cwd() / file_path
    if cwd_path.exists():
        return cwd_path

    script_dir = Path(__file__).resolve().parent
    script_path = script_dir / file_path
    if script_path.exists():
        return script_path

    uploads_path = Path.cwd() / "uploads" / file_path
    if uploads_path.exists():
        return uploads_path

    raise FileNotFoundError(
        f"Không tìm thấy file CSV: '{file_path}'. "
        f"Bạn hãy thử đặt file vào thư mục backend/uploads hoặc nhập đúng đường dẫn."
    )


def read_csv_file(file_path):
    real_path = resolve_csv_path(file_path)

    try:
        df = pd.read_csv(real_path)
    except UnicodeDecodeError:
        try:
            df = pd.read_csv(real_path, encoding="utf-8-sig")
        except UnicodeDecodeError:
            df = pd.read_csv(real_path, encoding="cp1258")

    df.columns = [str(c).strip() for c in df.columns]
    return df


def normalize_key(key):
    return key if isinstance(key, tuple) else (key,)


def get_equivalence_classes(df, object_col, attrs):
    if len(attrs) == 0:
        return [{
            "attr_values": {},
            "objects": df[object_col].astype(str).tolist()
        }]

    grouped = df.groupby(attrs, dropna=False, sort=False)
    result = []

    for key, group in grouped:
        key = normalize_key(key)
        attr_values = {attrs[i]: str(key[i]) for i in range(len(attrs))}
        objects = group[object_col].astype(str).tolist()

        result.append({
            "attr_values": attr_values,
            "objects": objects
        })

    return result


def get_decision_classes(df, object_col, decision_attr):
    grouped = df.groupby(decision_attr, dropna=False, sort=False)
    result = {}

    for val, group in grouped:
        result[str(val)] = set(group[object_col].astype(str).tolist())

    return result


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
        key = (
            tuple(sorted(rule["conditions"].items())),
            rule["decision"]
        )
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


def rule_to_text(rule, decision_attr):
    left = " AND ".join([f"{k} = {v}" for k, v in rule["conditions"].items()])
    right = f"THEN {decision_attr} = {rule['decision']}"
    return f"IF {left} {right} (support={rule['support']}, confidence=100%)"


def main():
    print("=== DEMO TÍNH REDUCT VÀ LUẬT PHÂN LỚP ===")
    file_path = input("Nhập đường dẫn file CSV: ").strip()
    df = read_csv_file(file_path)

    print("\nCác cột hiện có:", list(df.columns))

    if len(df.columns) < 3:
        raise ValueError("File cần ít nhất 3 cột: object_id, thuộc tính điều kiện..., thuộc tính quyết định")

    object_col = df.columns[0]
    decision_attr = df.columns[-1]
    condition_attrs = list(df.columns[1:-1])

    df[object_col] = df[object_col].astype(str)
    df[decision_attr] = df[decision_attr].astype(str)

    print("\n===== THÔNG TIN TỰ SUY RA =====")
    print("Cột đối tượng:", object_col)
    print("Thuộc tính điều kiện:", condition_attrs)
    print("Thuộc tính quyết định:", decision_attr)

    full_gamma = dependency_degree(df, object_col, condition_attrs, decision_attr)
    reducts = find_reducts(df, object_col, condition_attrs, decision_attr)
    exact_rules = generate_exact_rules(df, reducts, decision_attr)

    print("\n===== KẾT QUẢ =====")
    print("Độ phụ thuộc của toàn bộ tập thuộc tính điều kiện:", round(full_gamma, 4))

    print("\nCác reduct tìm được:")
    if reducts:
        for idx, red in enumerate(reducts, start=1):
            print(f"Reduct {idx}: {red}")
    else:
        print("Không tìm được reduct.")

    print("\n3 luật phân lớp chính xác 100%:")
    top_3 = exact_rules[:3]

    if top_3:
        for idx, rule in enumerate(top_3, start=1):
            print(f"Luật {idx}: {rule_to_text(rule, decision_attr)}")
    else:
        print("Dữ liệu hiện tại không sinh ra được luật exact 100%.")

    # print("\nTổng số luật exact tìm được:", len(exact_rules))


if __name__ == "__main__":
    main()