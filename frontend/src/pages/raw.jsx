import { useState } from "react";
import * as XLSX from "xlsx";

export default function RoughSetPage() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState("");
  const [result, setResult] = useState(null);
  const [tableData, setTableData] = useState([]);

  // input
  const [targetX, setTargetX] = useState("");
  const [attributes, setAttributes] = useState("");
  const [attrA, setAttrA] = useState("");
  const [attrB, setAttrB] = useState("");

  // ================= UPLOAD =================
  const handleUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);
    setFileName(f.name);

    const reader = new FileReader();
    reader.readAsArrayBuffer(f);

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      setTableData(jsonData.slice(0, 10));
    };
  };

  // ================= CALL API =================
  const handleCalculate = async () => {
  if (!file) {
    alert("Vui lòng upload file trước!");
    return;
  }

  const formData = new FormData();
  formData.append("file", file); // ✅ đúng key

  let url = "";

  // ===== APPROX =====
  if (mode === "approx") {
    if (!targetX || !attributes) {
      alert("Nhập X và thuộc tính!");
      return;
    }

    formData.append("x_objects", targetX.trim());     // ✅ FIX
    formData.append("b_attributes", attributes.trim()); // ✅ FIX

    url = "http://localhost:8000/rough-set/approximation";
  }

  // ===== DEPENDENCY =====
  if (mode === "dependency") {
    if (!attrA || !attrB) {
      alert("Nhập decision và condition!");
      return;
    }

    formData.append("decision_attr", attrA.trim());      // ✅ FIX
    formData.append("condition_attrs", attrB.trim());    // ✅ FIX

    url = "http://localhost:8000/rough-set/dependency";
  }

  // ===== REDUCT =====
  if (mode === "rough") {
    url = "http://localhost:8000/rough-set/reduct";
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setResult({
      type: mode,
      data,
    });

  } catch (err) {
    console.error(err);
    alert("Lỗi gọi API!");
  }
};

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Tính tập thô</h1>

      {/* UPLOAD */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="flex items-center gap-4">
          <label className="font-semibold">Upload File:</label>
          <input type="file" onChange={handleUpload} />
        </div>

        {fileName && (
          <p className="mt-2 text-sm text-gray-600">
            Tên file: {fileName}
          </p>
        )}

        {/* TABLE */}
        {tableData.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold mb-2">Dữ liệu (10 dòng đầu)</p>

            <table className="border w-full text-center text-sm">
              <tbody>
                {tableData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex === 0 ? "bg-gray-200 font-bold" : ""}
                  >
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="border p-1">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => {
            setMode("approx");
            setResult(null);
          }}
          className={`px-4 py-2 rounded ${
            mode === "approx"
              ? "bg-blue-700 text-white"
              : "bg-blue-500 text-white"
          }`}
        >
          Tính xấp xỉ
        </button>

        <button
          onClick={() => {
            setMode("dependency");
            setResult(null);
          }}
          className={`px-4 py-2 rounded ${
            mode === "dependency"
              ? "bg-green-700 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          Khảo sát sự phụ thuộc
        </button>

        <button
          onClick={() => {
            setMode("rough");
            setResult(null);
          }}
          className={`px-4 py-2 rounded ${
            mode === "rough"
              ? "bg-purple-700 text-white"
              : "bg-purple-500 text-white"
          }`}
        >
          Tính tập thô
        </button>
      </div>

      {/* FORM */}
      {mode && (
        <div className="bg-white p-4 rounded shadow mb-4">
          {mode === "approx" && (
            <>
              <h2 className="font-bold mb-3">Tính xấp xỉ</h2>
              <input
                className="border p-2 w-full mb-2"
                placeholder="Nhập tập X (vd: o1,o2)"
                value={targetX}
                onChange={(e) => setTargetX(e.target.value)}
              />
              <input
                className="border p-2 w-full mb-2"
                placeholder="Nhập thuộc tính (vd: troi,gio)"
                value={attributes}
                onChange={(e) => setAttributes(e.target.value)}
              />
            </>
          )}

          {mode === "dependency" && (
            <>
              <h2 className="font-bold mb-3">Khảo sát phụ thuộc</h2>
              <input
                className="border p-2 w-full mb-2"
                placeholder="Tập A"
                value={attrA}
                onChange={(e) => setAttrA(e.target.value)}
              />
              <input
                className="border p-2 w-full mb-2"
                placeholder="Tập B"
                value={attrB}
                onChange={(e) => setAttrB(e.target.value)}
              />
            </>
          )}

          {mode === "rough" && (
            <h2 className="font-bold">Tính tập thô</h2>
          )}

          <button
            onClick={handleCalculate}
            className="bg-black text-white px-4 py-2 rounded mt-2"
          >
            Tính toán
          </button>
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-3">Kết quả</h2>

          {/* ===== APPROX ===== */}
          {result.type === "approx" && (
            <>
              <p><b>Tập X:</b> {targetX}</p>
              <p><b>Thuộc tính:</b> {attributes}</p>

              <p className="mt-2 font-semibold">Lớp tương đương:</p>
              {result.data.equivalence_classes?.map((cls, i) => (
                <p key={i}>
                  {Object.entries(cls.attr_values)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(", ")}
                  {" → "}
                  {cls.objects.join(", ")}
                </p>
              ))}

              <p>
                <b>Xấp xỉ dưới:</b>{" "}
                {result.data.lower_approximation?.join(", ")}
              </p>

              <p>
                <b>Xấp xỉ trên:</b>{" "}
                {result.data.upper_approximation?.join(", ")}
              </p>

              <p><b>Độ chính xác:</b> {result.data.accuracy}</p>
            </>
          )}

          {/* ===== DEPENDENCY ===== */}
          {result.type === "dependency" && (
            <>
              <p><b>Tập A:</b> {attrA}</p>
              <p><b>Tập B:</b> {attrB}</p>

              <p className="mt-2 font-semibold">Lớp quyết định:</p>
              {Object.entries(result.data.decision_equivalence_classes || {}).map(
                ([k, v]) => (
                  <p key={k}>{k}: {v.join(", ")}</p>
                )
              )}

              <p className="mt-2 font-semibold">Lớp điều kiện:</p>
              {result.data.condition_equivalence_classes?.map((cls, i) => (
                <p key={i}>
                  {Object.entries(cls.attr_values)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(", ")}
                  {" → "}
                  {cls.objects.join(", ")}
                </p>
              ))}

              <p className="mt-2">
                <b>Positive region:</b>{" "}
                {result.data.positive_region?.join(", ")}
              </p>

              <p>
                <b>Độ phụ thuộc k:</b> {result.data.dependency_degree}
              </p>
            </>
          )}

          {/* ===== ROUGH ===== */}
          {result.type === "rough" && (
            <>
              <p><b>Dependency:</b> {result.data.dependency_degree}</p>

              <p className="font-semibold mt-2">Tập rút gọn:</p>
              {result.data.reducts?.map((r, i) => (
                <p key={i}>{r.join(", ")}</p>
              ))}

              <p className="mt-2 font-semibold">Luật phân lớp:</p>
              {result.data.top_3_exact_rules?.map((rule, i) => (
                <p key={i}>
                  IF{" "}
                  {Object.entries(rule.conditions)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(" AND ")}{" "}
                  → {rule.decision} (support: {rule.support})
                </p>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}