import { useState } from "react";

export default function Preprocess() {
	const [k, setK] = useState(0.0);
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
		formData.append("k", k);

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
				<h1 className="text-lg font-semibold">K-means</h1>
			</div>

			<div className="bg-white rounded-2xl shadow-md p-4 space-y-6">
				{/* INPUT */}
				<div>
					<h2 className="text-lg font-semibold mb-4">Nhập Dữ Liệu</h2>

					<div className="flex gap-4">
						<div className="w-1/2">
							<label className="block text-m mb-2">Số cụm (K)</label>
							<input
								type="number"
								min="1"
								value={k}
								onChange={(e) => setK(e.target.value)}
								className="border rounded p-2 w-full"
							/>
						</div>

						{/* File */}
						<div className="w-1/2">
							<label className="block text-m mb-2">Upload File</label>
							<input
								type="file"
								onChange={handleFileChange}
								className="border rounded p-2 w-full"
							/>

							{file && (
								<p className="text-sm mt-1 text-gray-500 truncate">
									{file.name}
								</p>
							)}
						</div>

					</div>

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

				{/* RESULT */}
				<div className="border-t pt-6">
					<h2 className="text-lg font-semibold mb-4">Kết quả</h2>

					{result && !result.error && (
						<div className="bg-gray-50 p-4 rounded-xl border space-y-6 max-h-[650px] overflow-auto">

							{/* ===== BIỂU ĐỒ ===== */}
							{result.graphic && (
							<div>
								<h3 className="font-semibold mb-2">
								K-Means Clustering - Kết quả cuối
								</h3>
								<div className="bg-white p-3 rounded border">
								<img
									src={`data:image/png;base64,${result.graphic}`}
									alt="kmeans chart"
									className="mx-auto"
								/>
								</div>
							</div>
							)}

							{/* ===== THÔNG TIN CỤM ===== */}
							<div>
							<h3 className="font-semibold mb-2">Thông tin từng cụm</h3>

							{result.final_clusters?.map((cluster) => (
								<div
								key={cluster.cluster_id}
								className="mb-4 bg-white p-3 rounded border"
								>
								<p className="font-semibold mb-1">
									Cụm {cluster.cluster_id}
								</p>

								<p className="text-sm">
									<b>Trọng tâm:</b>{" "}
									[{cluster.centroid.map((c) => c.toFixed(4)).join(", ")}]
								</p>

								<div className="mt-2">
									<p className="text-sm font-medium">Điểm thuộc cụm:</p>
									<div className="text-sm ml-4 space-y-1 max-h-[120px] overflow-auto">
									{cluster.points.map((p, idx) => (
										<div key={idx}>
										[{p.join(", ")}]
										</div>
									))}
									</div>
								</div>
								</div>
							))}
							</div>

							{/* ===== ITERATIONS ===== */}
							<div>
							<h3 className="font-semibold mb-2">
								Chi tiết từng lần lặp
							</h3>

							{result.iterations?.map((it) => (
								<div
								key={it.iteration}
								className="mb-4 bg-white p-3 rounded border"
								>
								<p className="font-semibold mb-2">
									Lần lặp {it.iteration}
								</p>

								{/* CENTROIDS */}
								<div className="text-sm mb-2">
									<b>Trọng tâm cụm:</b>
									<ul className="ml-6 list-disc">
									{it.centroids.map((c, idx) => (
										<li key={idx}>
										[{c.map((x) => x.toFixed(4)).join(", ")}]
										</li>
									))}
									</ul>
								</div>

								{/* U MATRIX */}
								<div className="text-sm mb-2">
									<b>Ma trận phân hoạch U:</b>
									<div className="overflow-auto">
									<table className="table-auto border mt-2 text-xs">
										<thead>
										<tr>
											<th className="border px-2 py-1">Cụm/Điểm</th>
											{it.U[0].map((_, idx) => (
											<th key={idx} className="border px-2 py-1">
												Điểm {idx + 1}
											</th>
											))}
										</tr>
										</thead>
										<tbody>
										{it.U.map((row, i) => (
											<tr key={i}>
											<td className="border px-2 py-1">
												C{i + 1}
											</td>
											{row.map((val, j) => (
												<td key={j} className="border px-2 py-1 text-center">
												{val}
												</td>
											))}
											</tr>
										))}
										</tbody>
									</table>
									</div>
								</div>

								{/* DIFF */}
								<p className="text-sm">
									<b>Sai số (|Uₙ - Uₙ₋₁|):</b>{" "}
									{Number(it.diff).toFixed(6)}
								</p>
								</div>
							))}
							</div>
						</div>
						)}
				</div>
			</div>
		</div>
	);
}
