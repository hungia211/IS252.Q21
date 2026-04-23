import { useState } from "react";

export default function Preprocess() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Vui lòng chọn file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:8000/pre_processing/pearson_correlation",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json(); // ✅ đúng
      setResult(data);
    } catch (error) {
      console.error("Lỗi:", error);
      setResult({ error: "Có lỗi xảy ra" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Title */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h1 className="text-lg font-semibold">Mức độ tương quan</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-4 grid grid-cols-5 gap-6">
        {/* LEFT */}
        <div className="col-span-2">
          <h2 className="text-lg font-semibold mb-4">Nhập Dữ Liệu</h2>

          <input
            type="file"
            onChange={handleFileChange}
            className="border rounded p-2 w-full"
          />

          {file && (
            <p className="text-sm mt-1 text-gray-500">{file.name}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={loading}
            className={`mt-4 px-4 py-2 rounded text-white ${
              loading
                ? "bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Đang xử lý..." : "Tính toán"}
          </button>
        </div>

        {/* RIGHT */}
        <div className="col-span-3 border-l pl-6">
          <h2 className="text-lg font-semibold mb-4">Kết quả</h2>

          {!result && !loading && (
            <p className="text-gray-500">Chưa có dữ liệu</p>
          )}

          {loading && (
            <p className="text-blue-500">Đang xử lý dữ liệu...</p>
          )}

          {result && !result.error && (
            <div className="bg-gray-50 p-4 rounded-xl border space-y-2">

              <p><b>Cột X:</b> {result.col_x}</p>
              <p><b>Cột Y:</b> {result.col_y}</p>

              <p><b>Số mẫu:</b> {result.n}</p>

              <p><b>Mean X:</b> {result.mean_x}</p>
              <p><b>Mean Y:</b> {result.mean_y}</p>

              <p><b>Mean(X)*Mean(Y):</b> {result.mean_x_times_mean_y}</p>
              <p><b>Mean(XY):</b> {result.mean_xy}</p>

              <p><b>Std X:</b> {result.std_x}</p>
              <p><b>Std Y:</b> {result.std_y}</p>

              <p><b>Var X:</b> {result.var_x}</p>
              <p><b>Var Y:</b> {result.var_y}</p>

              <p><b>Cov:</b> {result.cov}</p>

              <p>
                <b>r:</b>{" "}
                <span className="text-blue-600 font-semibold">
                  {result.r}
                </span>
              </p>

              <p>
                <b>Hồi quy:</b>{" "}
                <span className="text-purple-600">
                  {result.linear_regression_formula}
                </span>
              </p>

              <p>
                <b>Kết luận:</b>{" "}
                <span className="text-red-500 font-medium">
                  {result.conclusion}
                </span>
              </p>

              {/* ✅ BASE64 IMAGE */}
              {result.chart && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Biểu đồ:</p>
                  <img
                    src={`data:image/png;base64,${result.chart}`}
                    alt="chart"
                    className="rounded-lg shadow border"
                  />
                </div>
              )}
            </div>
          )}

          {result?.error && (
            <p className="text-red-500">{result.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}