import pandas as pd
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


def main():
    print("=== DEMO KHẢO SÁT PHỤ THUỘC ===")
    file_path = input("Nhập đường dẫn file CSV: ").strip()
    df = read_csv_file(file_path)

    print("\nCác cột hiện có:", list(df.columns))

    object_col = input(f"Nhập tên cột mã đối tượng [mặc định: {df.columns[0]}]: ").strip()
    if not object_col:
        object_col = df.columns[0]

    decision_attr = input("Nhập thuộc tính quyết định X (ví dụ: choi): ").strip()
    cond_input = input("Nhập tập thuộc tính điều kiện C (ví dụ: troi,gio): ").strip()
    C = [x.strip() for x in cond_input.split(",") if x.strip()]

    if object_col not in df.columns:
        raise ValueError(f"Cột '{object_col}' không tồn tại.")

    if decision_attr not in df.columns:
        raise ValueError(f"Thuộc tính quyết định '{decision_attr}' không tồn tại.")

    for c in C:
        if c not in df.columns:
            raise ValueError(f"Thuộc tính điều kiện '{c}' không tồn tại.")

    if decision_attr in C:
        raise ValueError("Thuộc tính quyết định không được nằm trong tập điều kiện C.")

    df[object_col] = df[object_col].astype(str)
    df[decision_attr] = df[decision_attr].astype(str)

    decision_grouped = df.groupby(decision_attr, dropna=False, sort=False)
    decision_eq_classes = {}
    for val, group in decision_grouped:
        decision_eq_classes[str(val)] = set(group[object_col].astype(str).tolist())

    cond_eq_classes = get_equivalence_classes(df, object_col, C)

    lower_result, positive_region = lower_approximation_of_decision_classes(
        cond_eq_classes,
        decision_eq_classes
    )

    k = len(positive_region) / len(df) if len(df) > 0 else 0.0

    print("\n===== KẾT QUẢ =====")
    print("Thuộc tính quyết định X:", decision_attr)
    print("Tập thuộc tính điều kiện C:", C)

    print("\nLớp tương đương của X:")
    for decision_value, objects in decision_eq_classes.items():
        print(f"{decision_attr} = {decision_value} -> {sorted(objects)}")

    print("\nLớp tương đương của C:")
    for idx, cls in enumerate(cond_eq_classes, start=1):
        print(f"Lớp {idx}: {cls['attr_values']} -> {cls['objects']}")

    print("\nXấp xỉ dưới của từng lớp quyết định theo C:")
    for decision_value, lower in lower_result.items():
        print(f"Lower_C({decision_attr} = {decision_value}) = {lower}")

    print("\nPOS_C(X) =", positive_region)
    print("Độ phụ thuộc k = γ(C, X) =", round(k, 4))


if __name__ == "__main__":
    main()