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

      const response = await fetch("http://localhost:8000/preprocess", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Lỗi:", error);
      setResult({ error: "Có lỗi xảy ra khi xử lý" });
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

        <label className="block text-m mb-2">Upload File</label>
        <input
          type="file"
          onChange={handleFileChange}
          className="border rounded p-2 w-full"
        />

        {file && (
          <p className="text-sm mt-1 text-gray-500">
            {file.name}
          </p>
        )}

        <div className="mt-4">
          <button
            onClick={handleUpload}
            disabled={loading}
            className={`px-4 py-2 rounded text-white
              ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {loading ? "Đang xử lý..." : "Tính toán"}
          </button>
        </div>
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

            <p><b>Cột X:</b> {result.column_x}</p>
            <p><b>Cột Y:</b> {result.column_y}</p>

            <p><b>X̄:</b> {result.mean_x?.toFixed(4)}</p>
            <p><b>Ȳ:</b> {result.mean_y?.toFixed(4)}</p>
            <p><b>X̄Ȳ:</b> {result.mean_xy?.toFixed(4)}</p>

            <p><b>Độ lệch chuẩn X:</b> {result.variance_x?.toFixed(4)}</p>
            <p><b>Phương sai X:</b> {result.phsai_x?.toFixed(4)}</p>
            <p><b>Phương sai Y:</b> {result.phsai_y?.toFixed(4)}</p>

            <p><b>Hệ số hồi quy (b1):</b> {result.b1?.toFixed(4)}</p>
            <p><b>Hệ số chặn (b0):</b> {result.b0?.toFixed(4)}</p>

            <p>
              <b>Hệ số tương quan (r):</b>{" "}
              <span className="text-blue-600 font-semibold">
                {result.r?.toFixed(4)}
              </span>
            </p>

            <p>
              <b>Diễn giải:</b>{" "}
              <span className="text-red-500 font-medium">
                {result.interpretation}
              </span>
            </p>

            {/* IMAGE */}
            {result.image_url && (
              <div className="mt-4">
                <p className="font-semibold mb-2">Biểu đồ minh họa:</p>
                <img
                  src={`http://localhost:8000${result.image_url}`}
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
