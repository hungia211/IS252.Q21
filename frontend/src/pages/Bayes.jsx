import { useState } from "react";
import * as XLSX from "xlsx";

export default function NaiveBayes() {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [valuesMap, setValuesMap] = useState({});
  const [decisionColumn, setDecisionColumn] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedValues, setSelectedValues] = useState({});
  const [result, setResult] = useState(null);

  // đọc file
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      if (jsonData.length === 0) return;

      const cols = Object.keys(jsonData[0]);
      setColumns(cols);

      const map = {};
      cols.forEach((col) => {
        map[col] = [...new Set(jsonData.map((row) => row[col]))];
      });

      setValuesMap(map);

      // reset
      setDecisionColumn("");
      setSelectedColumns([]);
      setSelectedValues({});
      setResult(null);
    };

    reader.readAsArrayBuffer(f);
  };

  // checkbox
  const handleCheck = (col) => {
    if (selectedColumns.includes(col)) {
      setSelectedColumns(selectedColumns.filter((c) => c !== col));

      const newValues = { ...selectedValues };
      delete newValues[col];
      setSelectedValues(newValues);
    } else {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  // chọn value
  const handleSelect = (col, val) => {
    if (!val) return;

    setSelectedValues((prev) => ({
      ...prev,
      [col]: val,
    }));
  };

  // gửi backend
  const handleSubmit = async () => {
    // validate
    if (!file) return alert("Chưa chọn file");
    if (!decisionColumn) return alert("Chưa chọn cột quyết định");
    if (selectedColumns.length === 0)
      return alert("Chưa chọn thuộc tính");

    // check thiếu value
    for (let col of selectedColumns) {
      if (!selectedValues[col]) {
        return alert(`Chưa chọn giá trị cho cột: ${col}`);
      }
    }

    const formData = new FormData();
      formData.append("file", file);
      formData.append("decision_attr", decisionColumn);
      formData.append(
        "selected_attributes",
        JSON.stringify(selectedColumns)
      );
      formData.append(
        "selected_values_json",
        JSON.stringify(selectedValues)
      );

    try {
      const res = await fetch("http://localhost:8000/classification/naive-bayes/predict", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Lỗi gọi API");
    }
  };

  return (
    <div className="flex-1 p-6 bg-gray-100 min-h-screen rounded-2xl">
      <h1 className="text-2xl font-semibold mb-6">
        Phân lớp Naive Bayes
      </h1>

      <div className="bg-white p-6 rounded-2xl shadow space-y-6">

        {/* Upload */}
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFile}
          className="border p-2 rounded"
        />

        {/* Decision column */}
        {columns.length > 0 && (
          <div>
            <label className="font-medium">Chọn cột quyết định:</label>
            <select
              className="ml-4 border p-2 rounded"
              value={decisionColumn}
              onChange={(e) => setDecisionColumn(e.target.value)}
            >
              <option value="">-- Chọn --</option>
              {columns.map((col) => (
                <option key={col}>{col}</option>
              ))}
            </select>
          </div>
        )}

        {/* Checkbox */}
        <div className="space-y-4">
			{columns.map(
				(col) =>
				col !== decisionColumn && (
					<div key={col} className="flex items-center gap-4">
					
					{/* Checkbox + label */}
					<input
						type="checkbox"
						checked={selectedColumns.includes(col)}
						onChange={() => handleCheck(col)}
					/>
					<span className="w-40">{col}</span>

					{selectedColumns.includes(col) && (
						<select
							className="border p-2 rounded"
							value={selectedValues[col] || ""}
							onChange={(e) => handleSelect(col, e.target.value)}
						>
							<option value="">-- Chọn giá trị --</option>
							{valuesMap[col]?.map((val, idx) => (
							<option key={idx}>{val}</option>
							))}
						</select>
						)}
					</div>
				)
			)}
			</div>

        {/* Button */}
        <button
          onClick={handleSubmit}
          className="bg-blue-900 text-white px-6 py-2 rounded-lg"
        >
          Tính xác suất
        </button>

        {/* Result */}
        {result && (
          <div className="bg-gray-100 p-4 rounded mt-4 space-y-6">

            {/* ===== PREDICTION ===== */}
            <div className="text-lg">
              <b>Dự đoán: </b>
              <span className="text-red-600 font-bold">
                {result.predicted_class}
              </span>
            </div>

            {/* ===== PRIOR ===== */}
            <div>
              <h3 className="font-semibold mb-2">Xác suất ban đầu P(Y)</h3>

              <div className="bg-white rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Class</th>
                      <th className="px-3 py-2 text-right">P(Y)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.prior_probabilities).map(([cls, val]) => (
                      <tr key={cls}>
                        <td className="px-3 py-2 border-b">{cls}</td>
                        <td className="px-3 py-2 border-b text-right text-blue-600 font-semibold">
                          {Number(val).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== LIKELIHOOD ===== */}
            <div>
              <h3 className="font-semibold mb-2">Xác suất có điều kiện P(X|Y)</h3>

              {Object.entries(result.conditional_probabilities).map(([cls, attrs]) => (
                <div key={cls} className="mb-4">
                  <div className="font-medium text-purple-700 mb-2">
                    Class: {cls}
                  </div>

                  <div className="bg-white rounded border">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left">Thuộc tính</th>
                          <th className="px-3 py-2 text-left">Giá trị</th>
                          <th className="px-3 py-2 text-right">P</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(attrs).map(([attr, info]) => (
                          <tr key={attr}>
                            <td className="px-3 py-2 border-b">{attr}</td>
                            <td className="px-3 py-2 border-b">
                              {info.selected_value}
                            </td>
                            <td className="px-3 py-2 border-b text-right">
                              {Number(info.probability).toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* ===== POSTERIOR ===== */}
            <div>
              <h3 className="font-semibold mb-2">Xác suất hậu nghiệm P(Y|X)</h3>

              <div className="bg-white rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Class</th>
                      <th className="px-3 py-2 text-right">Score</th>
                      <th className="px-3 py-2 text-right">P(Y|X)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.posterior_probabilities).map(([cls, prob]) => (
                      <tr
                        key={cls}
                        className={
                          cls === result.predicted_class
                            ? "bg-green-50 font-semibold"
                            : ""
                        }
                      >
                        <td className="px-3 py-2 border-b">{cls}</td>

                        <td className="px-3 py-2 border-b text-right text-gray-600">
                          {Number(result.posterior_scores[cls]).toFixed(6)}
                        </td>

                        <td
                          className={`px-3 py-2 border-b text-right ${
                            cls === result.predicted_class
                              ? "text-green-600"
                              : ""
                          }`}
                        >
                          {Number(prob).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== NOTE ===== */}
            {result.zero_probability_detected && (
              <div className="bg-yellow-100 text-yellow-800 p-3 rounded">
                ⚠ {result.note}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}