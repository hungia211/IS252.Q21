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

## 5. Các lỗi validate thường gặp

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

## 6. Gợi ý tích hợp frontend

- Nên gửi tất cả request dưới dạng `FormData`
- Với `selected_values_json`, nên dùng `JSON.stringify(...)`
- Với `selected_attributes`, nên ưu tiên gửi dạng JSON array để giảm lỗi
- Với API `rough-set/reduct`, file nên có thứ tự cột:
  - cột 1: object id
  - các cột giữa: condition attributes
  - cột cuối: decision attribute
