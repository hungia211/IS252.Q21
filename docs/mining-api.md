# Tài liệu API Mining

## 1. Tổng quan

Phần mining của backend hiện có 2 nhóm API:

- `Classification`
- `Rough Set`

Tất cả API hiện tại đều nhận dữ liệu bằng `multipart/form-data` và đều có trường `file` để upload file `.csv`, `.xlsx`, hoặc `.xls`.

## 2. Quy ước chung

### Định dạng file hỗ trợ

- `.csv`
- `.xlsx`
- `.xls`

Nếu sai định dạng, backend trả về:

```json
{
  "detail": "Only .csv, .xlsx, .xls files are supported."
}
```

### Một số quy ước xử lý dữ liệu

- Backend tự động bỏ khoảng trắng thừa ở tên cột và giá trị chuỗi.
- Một số thuật toán classification sẽ đổi giá trị rỗng thành `MISSING`.
- `target_col`: nếu không truyền thì mặc định lấy cột cuối cùng.
- `object_col`: nếu để rỗng thì mặc định lấy cột đầu tiên.

### File mẫu trong repo

- [test.csv](/D:/UIT_thu/HK8/MINING/IS252.Q21/backend/app/mining/test.csv)
- [weather.csv](/D:/UIT_thu/HK8/MINING/IS252.Q21/backend/app/mining/weather.csv)

## 3. Nhóm Classification

## 3.1. `POST /classification/metadata`

### Mục đích

Đọc file dữ liệu và trả về thông tin tổng quan của dataset.

### Input

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `file` | File | Có | File dữ liệu cần phân tích |

### Ví dụ request

```bash
curl -X POST http://localhost:8000/classification/metadata ^
  -F "file=@backend/app/mining/test.csv"
```

### Output

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `row_count` | number | Số dòng dữ liệu |
| `columns` | array string | Danh sách tên cột |
| `suggested_decision_attr` | string \| null | Cột quyết định gợi ý, hiện tại là cột cuối cùng |
| `unique_values` | object | Danh sách giá trị duy nhất của từng cột |

### Ví dụ response

```json
{
  "row_count": 10,
  "columns": ["troi", "nhiet_do", "do_am", "gio", "choi"],
  "suggested_decision_attr": "choi",
  "unique_values": {
    "troi": ["may", "mua", "nang"],
    "nhiet_do": ["cao", "thap", "vua"],
    "do_am": ["cao", "vua"],
    "gio": ["manh", "yeu"],
    "choi": ["co", "khong"]
  }
}
```

## 3.2. `POST /classification/decision-tree`

### Mục đích

Xây dựng cây quyết định từ dataset theo:

- `gain`: Information Gain
- `gini`: Gini Index

### Input

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `file` | File | Có | File dữ liệu huấn luyện |
| `algorithm` | string | Có | Chỉ nhận `gain` hoặc `gini` |
| `target_col` | string | Không | Cột cần dự đoán; nếu không truyền thì lấy cột cuối cùng |

### Ví dụ request

```bash
curl -X POST http://localhost:8000/classification/decision-tree ^
  -F "file=@backend/app/mining/test.csv" ^
  -F "algorithm=gain" ^
  -F "target_col=choi"
```

### Ý nghĩa input

- `file`: dữ liệu dùng để xây cây
- `algorithm=gain`: chọn thuộc tính theo Information Gain
- `algorithm=gini`: chọn thuộc tính theo Gini
- `target_col=choi`: cột kết quả cần dự đoán

### Output

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `selected_algorithm` | string | Thuật toán thực tế đã dùng |
| `target_col` | string | Cột đích |
| `features_used` | array string | Các thuộc tính dùng để tách |
| `dataset_score` | number | Entropy hoặc Gini của toàn bộ tập dữ liệu |
| `feature_scores` | object | Điểm của từng thuộc tính |
| `feature_details` | object | Thông tin chi tiết của từng thuộc tính |
| `best_attribute` | string \| null | Thuộc tính tốt nhất ở root |
| `root_explanation` | string \| null | Giải thích vì sao chọn root |
| `tree_structure` | object | Cấu trúc cây ở dạng JSON |
| `tree_representation` | string | Cây ở dạng text |
| `training_predictions` | array string | Dự đoán trên tập train |

### Ý nghĩa `tree_structure`

- Nếu `type = "node"`:
  - `feature`: cột dùng để tách
  - `criterion`: `gain` hoặc `gini`
  - `score`: điểm của thuộc tính
  - `current_score`: điểm hiện tại trước khi tách
  - `samples`: số mẫu tại node
  - `majority_class`: lớp nhiều nhất
  - `children`: các nhánh con
- Nếu `type = "leaf"`:
  - `label`: nhãn dự đoán
  - `samples`: số mẫu ở lá
  - `majority_class`: lớp đa số
  - `reason`: lý do dừng

### Ví dụ response rút gọn

```json
{
  "selected_algorithm": "gain",
  "target_col": "choi",
  "features_used": ["troi", "nhiet_do", "do_am", "gio"],
  "dataset_score": 0.97095,
  "feature_scores": {
    "troi": 0.32193,
    "nhiet_do": 0.09546
  },
  "best_attribute": "troi",
  "root_explanation": "Thuộc tính 'troi' được chọn vì có Information Gain lớn nhất.",
  "tree_structure": {
    "type": "node",
    "feature": "troi",
    "criterion": "gain"
  },
  "tree_representation": "[troi] ...",
  "training_predictions": ["khong", "khong", "co"]
}
```

## 3.3. `POST /classification/naive-bayes/predict`

### Mục đích

Dự đoán cột quyết định bằng Naive Bayes cơ bản.

### Input

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `file` | File | Có | Dataset huấn luyện |
| `decision_attr` | string | Có | Cột cần dự đoán |
| `selected_attributes` | string | Có | Danh sách thuộc tính đầu vào |
| `selected_values_json` | string | Có | Chuỗi JSON object chứa giá trị cần dự đoán |

### Cách truyền `selected_attributes`

Có thể truyền:

```text
troi,gio
```

hoặc:

```json
["troi", "gio"]
```

### Cách truyền `selected_values_json`

Ví dụ:

```json
{"troi":"nang","gio":"yeu"}
```

### Ví dụ request

```bash
curl -X POST http://localhost:8000/classification/naive-bayes/predict ^
  -F "file=@backend/app/mining/test.csv" ^
  -F "decision_attr=choi" ^
  -F "selected_attributes=[\"troi\",\"gio\"]" ^
  -F "selected_values_json={\"troi\":\"nang\",\"gio\":\"yeu\"}"
```

### Ý nghĩa input

- `decision_attr=choi`: dự đoán cột `choi`
- `selected_attributes=["troi","gio"]`: dùng 2 thuộc tính `troi` và `gio`
- `selected_values_json={"troi":"nang","gio":"yeu"}`: mẫu cần dự đoán có `troi = nang`, `gio = yeu`

### Output

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `model` | string | Tên mô hình, ở đây là `naive_bayes` |
| `decision_attr` | string | Cột đích |
| `selected_attributes` | array string | Các thuộc tính đã dùng |
| `selected_values` | object | Giá trị của mẫu cần dự đoán |
| `classes` | array string | Các lớp có thể xảy ra |
| `prior_probabilities` | object | Xác suất tiên nghiệm |
| `conditional_probabilities` | object | Xác suất có điều kiện |
| `posterior_scores` | object | Điểm Bayes chưa chuẩn hóa |
| `posterior_probabilities` | object | Xác suất hậu nghiệm đã chuẩn hóa |
| `predicted_class` | string \| null | Lớp dự đoán cuối cùng |
| `zero_probability_detected` | boolean | Có xuất hiện xác suất bằng 0 hay không |
| `note` | string \| null | Ghi chú thêm |

### Ý nghĩa chi tiết trong `conditional_probabilities`

Mỗi thuộc tính trong mỗi lớp có:

- `selected_value`: giá trị đang xét
- `match_count`: số dòng khớp
- `class_count`: tổng số dòng của lớp
- `probability`: xác suất có điều kiện

### Ví dụ response

```json
{
  "model": "naive_bayes",
  "decision_attr": "choi",
  "selected_attributes": ["troi", "gio"],
  "selected_values": {
    "troi": "nang",
    "gio": "yeu"
  },
  "classes": ["co", "khong"],
  "prior_probabilities": {
    "co": 0.6,
    "khong": 0.4
  },
  "posterior_scores": {
    "co": 0.0833,
    "khong": 0.15
  },
  "posterior_probabilities": {
    "co": 0.3571,
    "khong": 0.6429
  },
  "predicted_class": "khong",
  "zero_probability_detected": false,
  "note": null
}
```

## 3.4. `POST /classification/naive-bayes-laplace/predict`

### Mục đích

Tương tự Naive Bayes nhưng có thêm Laplace smoothing để tránh xác suất bằng 0.

### Input

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `file` | File | Có | Dataset huấn luyện |
| `decision_attr` | string | Có | Cột cần dự đoán |
| `selected_attributes` | string | Có | Danh sách thuộc tính đầu vào |
| `selected_values_json` | string | Có | Chuỗi JSON object chứa giá trị cần dự đoán |
| `laplace_alpha` | number | Không | Hệ số Laplace, mặc định `1.0`, phải lớn hơn `0` |

### Ví dụ request

```bash
curl -X POST http://localhost:8000/classification/naive-bayes-laplace/predict ^
  -F "file=@backend/app/mining/test.csv" ^
  -F "decision_attr=choi" ^
  -F "selected_attributes=troi,gio" ^
  -F "selected_values_json={\"troi\":\"nang\",\"gio\":\"yeu\"}" ^
  -F "laplace_alpha=1"
```

### Output

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `model` | string | `naive_bayes_laplace` |
| `decision_attr` | string | Cột đích |
| `selected_attributes` | array string | Thuộc tính đầu vào |
| `selected_values` | object | Giá trị mẫu cần dự đoán |
| `laplace_alpha` | number | Hệ số Laplace đã dùng |
| `classes` | array string | Các lớp có thể |
| `prior_probabilities` | object | Xác suất tiên nghiệm |
| `conditional_probabilities_after_laplace` | object | Xác suất có điều kiện sau smoothing |
| `posterior_scores` | object | Điểm Bayes chưa chuẩn hóa |
| `posterior_probabilities` | object | Xác suất hậu nghiệm đã chuẩn hóa |
| `predicted_class` | string \| null | Lớp dự đoán |
| `note` | string | Ghi chú |

### Ý nghĩa chi tiết trong `conditional_probabilities_after_laplace`

- `selected_value`: giá trị đang dự đoán
- `match_count_before_laplace`: số lần xuất hiện trước smoothing
- `alpha`: hệ số Laplace
- `value_space_size`: số lượng giá trị có thể của thuộc tính
- `numerator`: tử số sau smoothing
- `denominator`: mẫu số sau smoothing
- `probability_after_laplace`: xác suất sau smoothing

### Ví dụ response

```json
{
  "model": "naive_bayes_laplace",
  "decision_attr": "choi",
  "selected_attributes": ["troi", "gio"],
  "selected_values": {
    "troi": "nang",
    "gio": "yeu"
  },
  "laplace_alpha": 1.0,
  "classes": ["co", "khong"],
  "posterior_scores": {
    "co": 0.0952,
    "khong": 0.1333
  },
  "posterior_probabilities": {
    "co": 0.4167,
    "khong": 0.5833
  },
  "predicted_class": "khong",
  "note": "Phiên bản này dùng Laplace smoothing để tránh xác suất bằng 0."
}
```

## 4. Nhóm Rough Set

## 4.1. `POST /rough-set/approximation`

### Mục đích

Tính:

- lớp tương đương theo tập thuộc tính `B`
- lower approximation của tập `X`
- upper approximation của tập `X`
- độ chính xác xấp xỉ

### Input

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `file` | File | Có | Dataset rough set |
| `object_col` | string | Không | Cột định danh đối tượng; nếu để rỗng thì lấy cột đầu tiên |
| `x_objects` | string | Có | Danh sách đối tượng của tập X, phân tách bởi dấu phẩy |
| `b_attributes` | string | Có | Danh sách thuộc tính B, phân tách bởi dấu phẩy |

### Ví dụ request

```bash
curl -X POST http://localhost:8000/rough-set/approximation ^
  -F "file=@backend/app/mining/weather.csv" ^
  -F "object_col=object" ^
  -F "x_objects=o4,o5,o10" ^
  -F "b_attributes=troi,gio"
```

### Output

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `input` | object | Nhắc lại input đã dùng |
| `equivalence_classes` | array object | Các lớp tương đương sinh ra từ `b_attributes` |
| `lower_approximation` | array string | Các đối tượng chắc chắn thuộc X |
| `upper_approximation` | array string | Các đối tượng có khả năng thuộc X |
| `accuracy` | number | Độ chính xác xấp xỉ = `|lower| / |upper|` |

### Ý nghĩa phần tử trong `equivalence_classes`

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `attr_values` | object | Giá trị của nhóm thuộc tính B |
| `objects` | array string | Các đối tượng thuộc lớp đó |

### Ví dụ response

```json
{
  "input": {
    "object_col": "object",
    "x_objects": ["o4", "o5", "o10"],
    "b_attributes": ["troi", "gio"]
  },
  "lower_approximation": ["o4", "o5", "o10"],
  "upper_approximation": ["o4", "o5", "o10"],
  "accuracy": 1.0
}
```

## 4.2. `POST /rough-set/dependency`

### Mục đích

Phân tích mức độ phụ thuộc của thuộc tính quyết định `D` vào tập thuộc tính điều kiện `C`.

### Input

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `file` | File | Có | Dataset rough set |
| `object_col` | string | Không | Cột đối tượng; nếu để rỗng thì lấy cột đầu tiên |
| `decision_attr` | string | Có | Thuộc tính quyết định |
| `condition_attrs` | string | Có | Danh sách thuộc tính điều kiện |

### Ví dụ request

```bash
curl -X POST http://localhost:8000/rough-set/dependency ^
  -F "file=@backend/app/mining/weather.csv" ^
  -F "object_col=object" ^
  -F "decision_attr=choi" ^
  -F "condition_attrs=troi,nhiet_do,do_am,gio"
```

### Output

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `input` | object | Nhắc lại tham số đầu vào |
| `decision_equivalence_classes` | object | Lớp tương đương theo thuộc tính quyết định |
| `condition_equivalence_classes` | array object | Lớp tương đương theo thuộc tính điều kiện |
| `lower_approximations` | object | Lower approximation của từng lớp quyết định |
| `positive_region` | array string | Vùng dương POS(C, D) |
| `dependency_degree` | number | Độ phụ thuộc |

### Ví dụ response

```json
{
  "input": {
    "object_col": "object",
    "decision_attr": "choi",
    "condition_attrs": ["troi", "nhiet_do", "do_am", "gio"]
  },
  "positive_region": ["o1", "o2", "o3", "o4", "o5", "o6", "o7", "o8", "o9", "o10"],
  "dependency_degree": 1.0
}
```

## 4.3. `POST /rough-set/reduct`

### Mục đích

Tìm reduct và sinh luật chính xác.

### Lưu ý

API này chỉ nhận `file`. Backend sẽ tự suy ra:

- cột đầu tiên là `object_col`
- cột cuối cùng là `decision_attr`
- các cột ở giữa là `condition_attrs`

### Input

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `file` | File | Có | Dataset rough set |

### Ví dụ request

```bash
curl -X POST http://localhost:8000/rough-set/reduct ^
  -F "file=@backend/app/mining/weather.csv"
```

### Output

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `inferred_columns` | object | Các cột backend tự suy ra |
| `dependency_degree` | number | Độ phụ thuộc của toàn bộ tập điều kiện với decision |
| `reducts` | array array string | Danh sách reduct tối thiểu |
| `top_3_exact_rules` | array object | 3 luật chính xác đầu tiên |
| `total_exact_rules` | number | Tổng số luật chính xác |

### Ý nghĩa của từng luật trong `top_3_exact_rules`

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `reduct` | array string | Reduct tạo ra luật |
| `conditions` | object | Điều kiện IF |
| `decision` | string | Kết luận THEN |
| `support` | number | Số dòng ủng hộ luật |
| `confidence` | number | Độ tin cậy của luật |

### Ví dụ response

```json
{
  "inferred_columns": {
    "object_col": "object",
    "condition_attrs": ["troi", "nhiet_do", "do_am", "gio"],
    "decision_attr": "choi"
  },
  "dependency_degree": 1.0,
  "reducts": [
    ["troi", "gio"],
    ["troi", "do_am"]
  ],
  "top_3_exact_rules": [
    {
      "reduct": ["troi", "gio"],
      "conditions": {
        "troi": "mua",
        "gio": "yeu"
      },
      "decision": "co",
      "support": 3,
      "confidence": 1.0
    }
  ],
  "total_exact_rules": 6
}
```
---
## 5. Nhóm Pre Processing

## 5.1. `POST /pre_processing/pearson_correlation`

### Mục đích

Tính hệ số tương quan Pearson giữa hai cột số trong dataset, đồng thời trả về phương trình hồi quy tuyến tính và biểu đồ scatter plot dạng base64.

### Input

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `file` | File | Có | File dữ liệu, phải có đúng 2 cột số |

### Lưu ý về file đầu vào

- File phải có đúng **2 cột**.
- Cả 2 cột phải chứa dữ liệu số (numeric).
- Cần ít nhất **3 dòng hợp lệ** sau khi loại bỏ các giá trị không phải số.
- Cột đầu tiên được xem là `X`, cột thứ hai là `Y`.

### Ví dụ request

```bash
curl -X POST http://localhost:8000/pre_processing/pearson_correlation ^
  -F "file=@backend/app/mining/tienxuly.xlsx"
```

### Output

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `col_x` | string | Tên cột X |
| `col_y` | string | Tên cột Y |
| `n` | number | Số quan sát hợp lệ |
| `mean_x` | number | Trung bình của X |
| `mean_y` | number | Trung bình của Y |
| `mean_x_times_mean_y` | number | Tích của `mean_x` và `mean_y` |
| `mean_xy` | number | Trung bình của tích `X * Y` |
| `std_x` | number | Độ lệch chuẩn của X (mẫu, ddof=1) |
| `std_y` | number | Độ lệch chuẩn của Y (mẫu, ddof=1) |
| `var_x` | number | Phương sai của X (mẫu, ddof=1) |
| `var_y` | number | Phương sai của Y (mẫu, ddof=1) |
| `cov` | number | Hiệp phương sai của X và Y |
| `linear_regression_formula` | string | Phương trình hồi quy dạng `Y = a + bX` |
| `r` | number | Hệ số tương quan Pearson |
| `conclusion` | string | Nhận xét mức độ tương quan bằng tiếng Việt |
| `chart` | string | Biểu đồ scatter plot dạng base64 PNG |

### Ý nghĩa trường `conclusion`

Backend tự động diễn giải hệ số `r` theo thang đo:

| Điều kiện | Kết quả |
|---|---|
| `r = 1.0` | Tương quan tuyến tính hoàn hảo |
| `r >= 0.9` | Mối tương quan dương/âm rất mạnh |
| `r >= 0.7` | Mối tương quan dương/âm mạnh |
| `r >= 0.5` | Mối tương quan dương/âm trung bình |
| `r >= 0.3` | Mối tương quan dương/âm yếu |
| `r < 0.3` | Mối tương quan rất yếu hoặc không có tương quan tuyến tính |

### Cách dùng trường `chart` phía frontend

Trường `chart` là chuỗi base64 của ảnh PNG. Để hiển thị:

```html
<img src="data:image/png;base64,{{chart}}" />
```

### Ví dụ response

```json
{
  "col_x": "X",
  "col_y": "Y",
  "n": 10,
  "mean_x": 5.5,
  "mean_y": 12.3,
  "mean_x_times_mean_y": 67.65,
  "mean_xy": 74.2,
  "std_x": 3.02765,
  "std_y": 4.11816,
  "var_x": 9.16667,
  "var_y": 16.9589,
  "cov": 11.38889,
  "linear_regression_formula": "Y = 5.6241 + 1.2154X",
  "r": 0.912345,
  "conclusion": "Mối tương quan dương rất mạnh (r ≈ 0.9123)",
  "chart": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

---

## 6. Nhóm Frequent Itemsets and Rules

## 6.1. `POST /frequent-itemsets-rules/analyze`

### Mục đích

Phân tích tập dữ liệu giao dịch để tìm:

- Tập phổ biến (Frequent Itemsets) theo thuật toán Apriori
- Tập phổ biến tối đại (Maximal Frequent Itemsets)
- Luật kết hợp (Association Rules) theo ngưỡng confidence

### Input

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `file` | File | Có | File dữ liệu giao dịch |
| `min_support` | number | Có | Ngưỡng support tối thiểu, trong khoảng `(0, 1]` |
| `min_confidence` | number | Có | Ngưỡng confidence tối thiểu, trong khoảng `(0, 1]` |

### Lưu ý về file đầu vào

- File phải có đúng **2 cột**: cột 1 là mã giao dịch (transaction ID), cột 2 là mã hàng (item).
- Mỗi dòng là một cặp `(transaction_id, item)`.
- Phải có ít nhất **2 giao dịch** phân biệt.

### Ví dụ định dạng file


| transaction_id | item |
|---|---|
1|A
1|B
1|C
2|A
2|C
3|B
3|C


### Ví dụ request

```bash
curl -X POST http://localhost:8000/frequent-itemsets-rules/analyze ^
  -F "file=@backend/app/mining/tapphobien.xlsx" ^
  -F "min_support=0.5" ^
  -F "min_confidence=0.7"
```

### Output

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `min_support` | number | Ngưỡng support đã dùng |
| `min_confidence` | number | Ngưỡng confidence đã dùng |
| `frequent_itemsets` | array object | Danh sách tất cả các tập phổ biến |
| `total_frequent_itemsets` | number | Tổng số tập phổ biến |
| `maximal_frequent_itemsets` | array object | Danh sách tập phổ biến tối đại |
| `total_maximal_frequent_itemsets` | number | Tổng số tập phổ biến tối đại |
| `association_rules` | array object | Danh sách các luật kết hợp |
| `total_rules` | number | Tổng số luật kết hợp |

### Cấu trúc mỗi phần tử trong `frequent_itemsets` và `maximal_frequent_itemsets`

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `itemset` | array string | Danh sách các item trong tập (đã sắp xếp) |
| `support` | number | Giá trị support |
| `count` | number | Số giao dịch chứa tập item này |

### Cấu trúc mỗi phần tử trong `association_rules`

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `rule` | string | Luật dạng `[antecedent] → [consequent]` |
| `confidence` | number | Độ tin cậy của luật |

### Ví dụ response

```json
{
  "min_mupport": 0.5,
  "min_confidence": 0.7,
  "frequent_itemsets": [
    { "itemset": ["A"], "support": 0.666667, "count": 2 },
    { "itemset": ["B"], "support": 0.666667, "count": 2 },
    { "itemset": ["C"], "support": 1.0, "count": 3 },
    { "itemset": ["A", "C"], "support": 0.666667, "count": 2 },
    { "itemset": ["B", "C"], "support": 0.666667, "count": 2 }
  ],
  "total_frequent_itemsets": 5,
  "maximal_frequent_itemsets": [
    { "itemset": ["A", "C"], "support": 0.666667, "count": 2 },
    { "itemset": ["B", "C"], "support": 0.666667, "count": 2 }
  ],
  "total_maximal_frequent_itemsets": 2,
  "association_rules": [
    { "rule": "['A'] → ['C']", "confidence": 1.0 },
    { "rule": "['B'] → ['C']", "confidence": 1.0 }
  ],
  "total_rules": 2
}
```

---

## 7. Nhóm Clustering

## 7.1. `POST /clustering/k-means`

### Mục đích

Phân cụm dữ liệu bằng thuật toán K-Means. Trả về thông tin từng cụm, vị trí centroid, phân công điểm dữ liệu và chi tiết từng vòng lặp.

### Input

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `file` | File | Có | File dữ liệu số |
| `k` | number | Có | Số cụm muốn phân, phải lớn hơn `0` |
| `max_iters` | number | Không | Số vòng lặp tối đa, mặc định `100`, phải lớn hơn `0` |

### Lưu ý về file đầu vào

- Tất cả các cột phải là dữ liệu **số** (numeric).
- Số dòng phải lớn hơn hoặc bằng `k`.

### Ví dụ request

```bash
curl -X POST http://localhost:8000/clustering/k-means ^
  -F "file=@backend/app/mining/k-means.xlsx" ^
  -F "k=2" ^
  -F "max_iters=100"
```

### Output

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `graph_data` | array object | Dữ liệu dùng để vẽ biểu đồ cụm, cấu trúc giống `cluster_info` |
| `cluster_info` | array object | Thông tin chi tiết từng cụm |
| `iterations` | array object | Chi tiết từng vòng lặp của thuật toán |

### Cấu trúc mỗi phần tử trong `cluster_info`

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `cluster_id` | number | Chỉ số cụm, bắt đầu từ `0` |
| `centroid` | array number | Tọa độ tâm cụm |
| `points` | array array number | Danh sách các điểm dữ liệu thuộc cụm |

### Cấu trúc mỗi phần tử trong `iterations`

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `iteration` | number | Số thứ tự vòng lặp (bắt đầu từ `1`) |
| `centroids` | array array number | Vị trí các centroid tại vòng lặp này |
| `partition_matrix` | array number | Nhãn cụm của từng điểm dữ liệu tại vòng lặp này |
| `error` | number | Tổng bình phương khoảng cách đến centroid (SSE) tại vòng lặp này |

### Ví dụ response rút gọn

```json
{
  "graph_data": [
    {
      "cluster_id": 0,
      "centroid": [1.0, 2.0],
      "points": [[1.0, 2.0], [1.5, 1.8]]
    },
    {
      "cluster_id": 1,
      "centroid": [5.0, 6.0],
      "points": [[5.0, 6.0], [4.8, 6.2]]
    }
  ],
  "cluster_info": [
    {
      "cluster_id": 0,
      "centroid": [1.0, 2.0],
      "points": [[1.0, 2.0], [1.5, 1.8]]
    },
    {
      "cluster_id": 1,
      "centroid": [5.0, 6.0],
      "points": [[5.0, 6.0], [4.8, 6.2]]
    }
  ],
  "iterations": [
    {
      "iteration": 1,
      "centroids": [[1.2, 2.1], [5.1, 6.0]],
      "partition_matrix": [0, 0, 1, 1],
      "error": 0.53
    },
    {
      "iteration": 2,
      "centroids": [[1.0, 2.0], [5.0, 6.0]],
      "partition_matrix": [0, 0, 1, 1],
      "error": 0.41
    }
  ]
}
```

---

## 7.2. `POST /clustering/kohonen`

### Mục đích

Phân cụm dữ liệu bằng mạng nơ-ron Kohonen (Self-Organizing Map — SOM). Trả về thông tin neuron chiến thắng của từng điểm dữ liệu và trạng thái lưới SOM sau khi huấn luyện.

### Tham số cố định

Backend dùng các giá trị mặc định sau, **không thể thay đổi qua API**:

| Tham số | Giá trị | Ý nghĩa |
|---|---|---|
| `epochs` | `100` | Số vòng lặp huấn luyện |
| `initial_lr` | `0.5` | Learning rate ban đầu |

### Input

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `file` | File | Có | File dữ liệu số |
| `rows` | number | Có | Số hàng của lưới SOM, phải lớn hơn `0` |
| `cols` | number | Có | Số cột của lưới SOM, phải lớn hơn `0` |

### Lưu ý về file đầu vào

- Tất cả các cột phải là dữ liệu **số** (numeric).

### Ví dụ request

```bash
curl -X POST http://localhost:8000/clustering/kohonen ^
  -F "file=@backend/app/mining/kohonen.xlsx" ^
  -F "rows=3" ^
  -F "cols=3"
```

### Output

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `winning_info` | array object | Thông tin neuron chiến thắng (BMU) của từng điểm dữ liệu |
| `graph_data` | object | Thông tin toàn bộ lưới SOM sau huấn luyện, dùng để vẽ biểu đồ |
| `distance_table` | array object | Bảng khoảng cách từ mỗi điểm đến BMU của nó |

### Cấu trúc mỗi phần tử trong `winning_info`

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `input_vector` | array number | Vector dữ liệu đầu vào |
| `winning_vector` | array number | Vector trọng số của neuron chiến thắng |
| `winning_neuron` | array number | Tọa độ `[row, col]` của neuron chiến thắng trên lưới |
| `min_distance` | number | Khoảng cách Euclidean từ input đến neuron chiến thắng |

### Cấu trúc trường `graph_data`

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `grid_dimensions` | object | Kích thước lưới gồm `rows` và `cols` |
| `neurons` | array object | Danh sách tất cả các neuron trong lưới |

Mỗi phần tử trong `neurons`:

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `row` | number | Chỉ số hàng của neuron |
| `col` | number | Chỉ số cột của neuron |
| `weight_vector` | array number | Vector trọng số của neuron sau huấn luyện |

### Cấu trúc mỗi phần tử trong `distance_table`

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `vector` | array number | Vector dữ liệu đầu vào |
| `distance_to_centroid` | number | Khoảng cách Euclidean đến neuron chiến thắng |
| `neuron_position` | array number | Tọa độ `[row, col]` của neuron chiến thắng |

### Ví dụ response rút gọn

```json
{
  "winning_info": [
    {
      "input_vector": [1.0, 2.0],
      "winning_vector": [1.05, 1.98],
      "winning_neuron": [0, 1],
      "min_distance": 0.0539
    },
    {
      "input_vector": [5.0, 6.0],
      "winning_vector": [4.97, 6.01],
      "winning_neuron": [2, 2],
      "min_distance": 0.0316
    }
  ],
  "graph_data": {
    "grid_dimensions": { "rows": 3, "cols": 3 },
    "neurons": [
      { "row": 0, "col": 0, "weight_vector": [0.8, 1.5] },
      { "row": 0, "col": 1, "weight_vector": [1.05, 1.98] },
      { "row": 0, "col": 2, "weight_vector": [2.1, 3.0] }
    ]
  },
  "distance_table": [
    {
      "vector": [1.0, 2.0],
      "distance_to_centroid": 0.0539,
      "neuron_position": [0, 1]
    },
    {
      "vector": [5.0, 6.0],
      "distance_to_centroid": 0.0316,
      "neuron_position": [2, 2]
    }
  ]
}
```

## 8. Các lỗi validate thường gặp

Backend hiện tại thường trả lỗi theo dạng:

```json
{
  "detail": "No file uploaded."
}
```

Hoặc:

```json
{
  "detail": "Decision attribute 'choi' does not exist"
}
```

Một số lỗi phổ biến:

- file rỗng
- file sai định dạng
- tên cột không tồn tại
- danh sách thuộc tính rỗng
- `selected_values_json` không phải JSON hợp lệ
- `laplace_alpha <= 0`
- object trong `x_objects` không tồn tại trong file

## 9. Gợi ý tích hợp frontend

- Nên gửi tất cả request dưới dạng `FormData`
- Với `selected_values_json`, nên dùng `JSON.stringify(...)`
- Với `selected_attributes`, nên ưu tiên gửi dạng JSON array để giảm lỗi
- Với API `rough-set/reduct`, file nên có thứ tự cột:
  - cột 1: object id
  - các cột giữa: condition attributes
  - cột cuối: decision attribute
