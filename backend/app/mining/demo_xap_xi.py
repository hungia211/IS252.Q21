import pandas as pd


def read_excel_file(file_path):
    df = pd.read_excel(file_path)
    df.columns = [str(c).strip() for c in df.columns]
    return df


def normalize_key(key):
    return key if isinstance(key, tuple) else (key,)


def get_equivalence_classes(df, object_col, attrs):
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


def lower_upper_approximation(eq_classes, X_set):
    lower = set()
    upper = set()

    for cls in eq_classes:
        cls_objects = set(cls["objects"])

        if cls_objects.issubset(X_set):
            lower |= cls_objects

        if cls_objects & X_set:
            upper |= cls_objects

    return sorted(lower), sorted(upper)


def main():
    print("=== DEMO TÍNH XẤP XỈ TRÊN / DƯỚI ===")
    file_path = input("Nhập đường dẫn file CSV: ").strip()
    df = read_csv_file(file_path)

    print("\nCác cột hiện có:", list(df.columns))

    object_col = input(f"Nhập tên cột mã đối tượng [mặc định: {df.columns[0]}]: ").strip()
    if not object_col:
        object_col = df.columns[0]

    x_input = input("Nhập tập đối tượng X (ví dụ: o1,o2,o5): ").strip()
    b_input = input("Nhập tập thuộc tính B (ví dụ: troi,gio): ").strip()

    X = [x.strip() for x in x_input.split(",") if x.strip()]
    B = [b.strip() for b in b_input.split(",") if b.strip()]

    if object_col not in df.columns:
        raise ValueError(f"Cột '{object_col}' không tồn tại.")

    for b in B:
        if b not in df.columns:
            raise ValueError(f"Thuộc tính '{b}' không tồn tại trong file CSV.")

    df[object_col] = df[object_col].astype(str)

    import pandas as pd


def read_csv_file(file_path):
    df = pd.read_csv(file_path)
    df.columns = [str(c).strip() for c in df.columns]
    return df


def normalize_key(key):
    return key if isinstance(key, tuple) else (key,)


def get_equivalence_classes(df, object_col, attrs):
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


def lower_upper_approximation(eq_classes, X_set):
    lower = set()
    upper = set()

    for cls in eq_classes:
        cls_objects = set(cls["objects"])

        if cls_objects.issubset(X_set):
            lower |= cls_objects

        if cls_objects & X_set:
            upper |= cls_objects

    return sorted(lower), sorted(upper)


def main():
    print("=== DEMO TÍNH XẤP XỈ TRÊN / DƯỚI ===")
    file_path = input("Nhập đường dẫn file CSV: ").strip()
    df = read_csv_file(file_path)

    print("\nCác cột hiện có:", list(df.columns))

    object_col = input(f"Nhập tên cột mã đối tượng [mặc định: {df.columns[0]}]: ").strip()
    if not object_col:
        object_col = df.columns[0]

    x_input = input("Nhập tập đối tượng X (ví dụ: o1,o2,o5): ").strip()
    b_input = input("Nhập tập thuộc tính B (ví dụ: troi,gio): ").strip()

    X = [x.strip() for x in x_input.split(",") if x.strip()]
    B = [b.strip() for b in b_input.split(",") if b.strip()]

    if object_col not in df.columns:
        raise ValueError(f"Cột '{object_col}' không tồn tại.")

    for b in B:
        if b not in df.columns:
            raise ValueError(f"Thuộc tính '{b}' không tồn tại trong file CSV.")

    df[object_col] = df[object_col].astype(str)

    X_set = set(X)
    eq_classes = get_equivalence_classes(df, object_col, B)
    lower, upper = lower_upper_approximation(eq_classes, X_set)

    accuracy = len(lower) / len(upper) if len(upper) > 0 else 0.0

    print("\n===== KẾT QUẢ =====")
    print("Tập đối tượng X:", X)
    print("Tập thuộc tính B:", B)

    print("\nLớp tương đương theo B:")
    for idx, cls in enumerate(eq_classes, start=1):
        print(f"Lớp {idx}: {cls['attr_values']} -> {cls['objects']}")

    print("\nXấp xỉ dưới của X theo B:", lower)
    print("Xấp xỉ trên của X theo B:", upper)
    print("Độ chính xác alpha_B(X):", round(accuracy, 4))


if __name__ == "__main__":
    main()