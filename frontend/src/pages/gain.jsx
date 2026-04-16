import { useState } from "react";

export default function Gini() {
	const [file, setFile] = useState(null);
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);

	// chọn file
	const handleFileChange = (e) => {
		setFile(e.target.files[0]);
		setResult(null);
	};

	// submit
	const handleSubmit = async () => {
		if (!file) {
		alert("Vui lòng chọn file!");
		return;
		}

		const formData = new FormData();
		formData.append("file", file);

		try {
		setLoading(true);

		const res = await fetch("http://localhost:8000/gini", {
			method: "POST",
			body: formData,
		});

		const data = await res.json();
		setResult(data);
		} catch (err) {
		console.error(err);
		setResult({ error: "Lỗi khi gọi API" });
		} finally {
		setLoading(false);
		}
	};

	return (
		<div className="p-6 bg-gray-100 min-h-screen">

			{/* TITLE */}
			<div className="bg-white rounded-xl shadow p-4 mb-4">
				<h1 className="text-lg font-semibold">
				Cây quyết định (Gain)
				</h1>
			</div>

			<div className="bg-white rounded-2xl shadow-md p-4 grid grid-cols-5 gap-6">

				<div className="col-span-2">
					<h2 className="text-lg font-semibold mb-4">Nhập dữ liệu</h2>

					<label className="block text-sm mb-2">Upload File</label>
					<input
						type="file"
						accept=".xlsx, .xls, .csv"
						onChange={handleFileChange}
						className="border rounded p-2 w-full"
					/>

					{file && (
						<p className="text-sm mt-2 text-gray-500">
						{file.name}
						</p>
					)}

					<div className="mt-4">
						<button
						onClick={handleSubmit}
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

				<div className="col-span-3 border-l pl-6">
					<h2 className="text-lg font-semibold mb-4">Kết quả</h2>

					{!result && !loading && (
						<p className="text-gray-500">Chưa có dữ liệu</p>
					)}

					{loading && (
						<p className="text-blue-500">Đang xử lý dữ liệu...</p>
					)}

					{/* ===== RESULT ===== */}
					{result && !result.error && (
						<div className="bg-gray-50 p-4 rounded-xl border space-y-4 max-h-[500px] overflow-auto">

						{/* Gain VALUES */}
						<div>
							<h3 className="font-semibold mb-2">
							Chỉ số Gain của từng thuộc tính
							</h3>
							<ul className="list-disc ml-6 text-sm">
							{Object.entries(result.gain_values || {}).map(
								([attr, val]) => (
								<li key={attr}>
									{attr}: {Number(val).toFixed(4)}
								</li>
								)
							)}
							</ul>
						</div>

						{/* TREE IMAGE */}
						{result.image_url && (
							<div>
							<h3 className="font-semibold mb-2">
								Cây quyết định
							</h3>
							<img
								src={`http://localhost:8000${result.image_url}`}
								alt="decision tree"
								className="rounded-lg border shadow max-w-full"
							/>
							</div>
						)}

						{/* RULES */}
						<div>
							<h3 className="font-semibold mb-2">
							Quy tắc quyết định
							</h3>
							<div className="bg-white p-3 rounded border text-sm whitespace-pre-line">
							{result.rules}
							</div>
						</div>

					</div>
				)}

				{/* ERROR */}
				{result?.error && (
					<p className="text-red-500">{result.error}</p>
				)}
				</div>

			</div>
		</div>
	);
	}