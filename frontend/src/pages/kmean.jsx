import { useState } from "react";
import {
	ScatterChart,
	Scatter,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend
} from "recharts";

export default function Preprocess() {
	const [k, setK] = useState(2);
	const [file, setFile] = useState(null);
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);

	// ===== HANDLE FILE =====
	const handleFileChange = (e) => {
		const selectedFile = e.target.files[0];
		if (!selectedFile) return;

		const fileName = selectedFile.name.toLowerCase();

		if (
			!fileName.endsWith(".csv") &&
			!fileName.endsWith(".xlsx") &&
			!fileName.endsWith(".xls")
		) {
			alert("Chỉ hỗ trợ file CSV hoặc Excel (.xlsx, .xls)");
			return;
		}

		setFile(selectedFile);
	};

	// ===== HANDLE UPLOAD =====
	const handleUpload = async () => {
		if (!file) {
			alert("Vui lòng chọn file!");
			return;
		}

		if (k < 1) {
			alert("K phải >= 1");
			return;
		}

		const formData = new FormData();
		formData.append("file", file);
		formData.append("k", k);

		try {
			setLoading(true);

			const response = await fetch("http://localhost:8000/clustering/k-means", {
				method: "POST",
				body: formData,
			});

			// ===== HANDLE ERROR =====
			if (!response.ok) {
				const errText = await response.text();
				console.error("Backend error:", errText);
				alert("Lỗi backend: " + errText);
				return;
			}

			const raw = await response.json();

			// ===== TRANSFORM DATA =====
			const transformed = {
				graphic: null, // backend chưa trả chart
				final_clusters: raw.cluster_info,

				iterations: raw.iterations.map((it) => {
					const labels = it.partition_matrix;

					// convert labels -> U matrix
					const U = Array.from({ length: k }, (_, clusterIdx) =>
						labels.map((label) => (label === clusterIdx ? 1 : 0))
					);

					return {
						iteration: it.iteration,
						centroids: it.centroids,
						U: U,
						diff: it.error,
					};
				}),
			};

			setResult(transformed);
		} catch (error) {
			console.error("Lỗi:", error);
			setResult({ error: "Có lỗi xảy ra khi xử lý" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-6 bg-gray-100 min-h-screen">
			{/* ===== TITLE ===== */}
			<div className="bg-white rounded-xl shadow p-4 mb-4">
				<h1 className="text-lg font-semibold">K-means</h1>
			</div>

			<div className="bg-white rounded-2xl shadow-md p-4 space-y-6">

				{/* ===== INPUT ===== */}
				<div>
					<h2 className="text-lg font-semibold mb-4">Nhập Dữ Liệu</h2>

					<div className="flex gap-4">
						<div className="w-1/2">
							<label className="block text-m mb-2">Số cụm (K)</label>
							<input
								type="number"
								min="1"
								value={k}
								onChange={(e) => setK(Number(e.target.value))}
								className="border rounded p-2 w-full"
							/>
						</div>

						<div className="w-1/2">
							<label className="block text-m mb-2">Upload File</label>
							<input
								type="file"
								accept=".csv, .xlsx, .xls"
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

				{/* ===== RESULT ===== */}
				<div className="border-t pt-6">
					<h2 className="text-lg font-semibold mb-4">Kết quả</h2>

					{result && !result.error && (
						<div className="bg-gray-50 p-4 rounded-xl border space-y-6 max-h-[650px] overflow-auto">

							{/* ===== BIỂU ĐỒ ===== */}
							{result.final_clusters && (
								<div>
									<h3 className="font-semibold mb-2">
										Biểu đồ K-Means
									</h3>

									<div className="bg-white p-4 rounded border flex justify-center">
										<ScatterChart width={500} height={400}>
											<CartesianGrid />

											<XAxis type="number" dataKey="x" name="X" />
											<YAxis type="number" dataKey="y" name="Y" />

											<Tooltip cursor={{ strokeDasharray: "3 3" }} />
											<Legend />

											{/* ===== POINTS====*/}
											{result.final_clusters.map((cluster, idx) => {
												const data = cluster.points.map((p) => ({
													x: p[0],
													y: p[1],
												}));

												const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

												return (
													<Scatter
														key={idx}
														name={`Cluster ${cluster.cluster_id}`}
														data={data}
														fill={colors[idx % colors.length]}
														shape={(props) => {
															const { cx, cy, fill } = props;
															return <circle cx={cx} cy={cy} r={3} fill={fill} />; 
														}}
													/>
												);
											})}

											{/* ===== CENTROIDS ===== */}
											{result.final_clusters.map((cluster, idx) => (
												<Scatter
													key={`centroid-${idx}`}
													name={`Centroid ${cluster.cluster_id}`}
													data={[
														{
															x: cluster.centroid[0],
															y: cluster.centroid[1],
														},
													]}
													shape={(props) => {
														const { cx, cy } = props;

														return (
															<g>
																<line
																	x1={cx - 5}
																	y1={cy - 5}
																	x2={cx + 5}
																	y2={cy + 5}
																	stroke="red"
																	strokeWidth={2} 
																/>
																<line
																	x1={cx - 5}
																	y1={cy + 5}
																	x2={cx + 5}
																	y2={cy - 5}
																	stroke="red"
																	strokeWidth={2}
																/>
															</g>
														);
													}}
												/>
											))}
										</ScatterChart>
									</div>
								</div>
							)}
							
							{/* ===== CLUSTERS ===== */}
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
											[
											{cluster.centroid
												.map((c) => Number(c).toFixed(4))
												.join(", ")}
											]
										</p>

										<div className="mt-2">
											<p className="text-sm font-medium">
												Điểm thuộc cụm:
											</p>
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
														[
														{c
															.map((x) => Number(x).toFixed(4))
															.join(", ")}
														]
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
															<th className="border px-2 py-1">
																Cụm/Điểm
															</th>
															{it.U?.[0]?.map((_, idx) => (
																<th
																	key={idx}
																	className="border px-2 py-1"
																>
																	Điểm {idx + 1}
																</th>
															))}
														</tr>
													</thead>
													<tbody>
														{it.U?.map((row, i) => (
															<tr key={i}>
																<td className="border px-2 py-1">
																	C{i + 1}
																</td>
																{row.map((val, j) => (
																	<td
																		key={j}
																		className="border px-2 py-1 text-center"
																	>
																		{val}
																	</td>
																))}
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</div>

										{/* ERROR */}
										<p className="text-sm">
											<b>Sai số:</b>{" "}
											{Number(it.diff).toFixed(6)}
										</p>
									</div>
								))}
							</div>
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