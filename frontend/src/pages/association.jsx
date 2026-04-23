import { useState } from "react";

export default function FrequentItemset() {
  const [file, setFile] = useState(null);
  const [minSupport, setMinSupport] = useState(0.0);
  const [minConfidence, setMinConfidence] = useState(0.0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      alert("Vui lòng chọn file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("min_support", parseFloat(minSupport));
	formData.append("min_confidence", parseFloat(minConfidence));	

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8000/frequent-itemsets-rules/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: "Lỗi xử lý!" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* ===== TITLE ===== */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h1 className="text-lg font-semibold">Tập Phổ Biến (Apriori)</h1>
      </div>

      <div className="bg-white rounded-xl shadow p-6 grid grid-cols-5 gap-6">

        {/* ===== LEFT ===== */}
        <div className="col-span-2 pr-6 border-r">
          <h2 className="font-semibold mb-4">Nhập dữ liệu</h2>

          {/* Upload */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Upload File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="border rounded p-2 w-full"
            />
            {file && (
              <p className="text-sm mt-1 text-gray-500">
                {file.name}
              </p>
            )}
          </div>

          {/* Min Support */}
          <div className="mb-4">
            <label className="block text-sm mb-1">
              Min-Support (0 → 1)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={minSupport}
              onChange={(e) => setMinSupport(e.target.value)}
              className="border rounded p-2 w-full"
            />
          </div>

          {/* Min Confidence */}
          <div className="mb-4">
            <label className="block text-sm mb-1">
              Min-Confidence (0 → 1)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={minConfidence}
              onChange={(e) => setMinConfidence(e.target.value)}
              className="border rounded p-2 w-full"
            />
          </div>

          {/* Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 rounded text-white w-full ${
              loading
                ? "bg-gray-400"
                : "bg-gray-800 hover:bg-black"
            }`}
          >
            {loading ? "Đang tính..." : "Tính toán"}
          </button>
        </div>

        {/* ===== RIGHT ===== */}
        <div className="col-span-3 pl-6">
          <h2 className="font-semibold mb-4">Kết quả</h2>

          {!result && !loading && (
            <p className="text-gray-400">Chưa có dữ liệu</p>
          )}

          {loading && (
            <p className="text-blue-500">Đang xử lý...</p>
          )}

          {result?.error && (
            <p className="text-red-500">{result.error}</p>
          )}

          {result && !result.error && (
            <div className="bg-gray-50 p-4 rounded-xl border space-y-6 max-h-[600px] overflow-auto">

              {/* ===== TẬP PHỔ BIẾN ===== */}
              <div>
				<h3 className="font-semibold mb-2">
					Tập phổ biến ({result.total_frequent_itemsets})
				</h3>

				<div className="bg-white rounded border max-h-[250px] overflow-auto">
					<table className="w-full text-sm">
					
					{/* HEADER */}
					<thead className="bg-gray-100 sticky top-0">
						<tr>
						<th className="text-left px-3 py-2 border-b">Giá trị</th>
						<th className="text-right px-3 py-2 border-b">Support</th>
						</tr>
					</thead>

					{/* BODY */}
					<tbody>
						{result.frequent_itemsets?.map((item, i) => (
						<tr key={i} className="hover:bg-gray-50">
							<td className="px-3 py-2 border-b">
							{item.itemset.join(", ")}
							</td>
							<td className="px-3 py-2 border-b text-right text-blue-600 font-semibold">
							{Number(item.support).toFixed(4)}
							</td>
						</tr>
						))}
					</tbody>

					</table>
				</div>
				</div>

              {/* ===== TẬP TỐI ĐẠI ===== */}
              <div>
                <h3 className="font-semibold mb-2">
                  Tập phổ biến tối đại ({result.total_maximal_frequent_itemsets})
                </h3>

                <div className="bg-white rounded border p-3 flex flex-wrap gap-2 text-sm">
                  {result.maximal_frequent_itemsets?.map((item, i) => (
                    <span
                      key={i}
                      className="bg-green-100 text-green-700 px-3 py-1 rounded-lg"
                    >
                      {item.itemset.join(", ")}
                    </span>
                  ))}
                </div>
              </div>

              {/* ===== LUẬT KẾT HỢP ===== */}
              <div>
				<h3 className="font-semibold mb-2">
					Luật kết hợp ({result.total_rules})
				</h3>

				<div className="bg-white rounded border max-h-[250px] overflow-auto">
					<table className="w-full text-sm">

					{/* HEADER */}
					<thead className="bg-gray-100 sticky top-0">
						<tr>
						<th className="text-left px-3 py-2 border-b">Rule</th>
						<th className="text-right px-3 py-2 border-b">Confidence</th>
						</tr>
					</thead>

					{/* BODY */}
					<tbody>
						{result.association_rules?.map((rule, i) => (
						<tr key={i} className="hover:bg-gray-50">
							
							{/* RULE */}
							<td className="px-3 py-2 border-b font-medium">
							{rule.rule}
							</td>

							{/* CONFIDENCE */}
							<td className={`px-3 py-2 border-b text-right font-semibold
							${
								rule.confidence > 0.8
								? "text-green-600"
								: rule.confidence > 0.5
								? "text-yellow-600"
								: "text-red-500"
							}`}
							>
							{Number(rule.confidence).toFixed(4)}
							</td>

						</tr>
						))}
					</tbody>

					</table>
				</div>
				</div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}