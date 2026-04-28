import { useState, useEffect, useRef } from "react";

export default function Kohonen() {
	const [rows, setRows] = useState(0);
	const [cols, setCols] = useState(0);
	const [file, setFile] = useState(null);
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);

	const canvasRef = useRef(null);

	const handleSubmit = async () => {
		if (!file) {
			alert("Chọn file!");
			return;
		}

		if (!rows || !cols) {
			alert("Nhập rows và cols!");
			return;
		}

		const formData = new FormData();
		formData.append("rows", Number(rows));
		formData.append("cols", Number(cols));
		formData.append("file", file);

		try {
			setLoading(true);

			const res = await fetch("http://localhost:8000/clustering/kohonen", {
				method: "POST",
				body: formData,
			});

			// ❗ bắt lỗi HTTP đúng cách
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.detail || "Lỗi server");
			}

			const data = await res.json();
			setResult(data);

		} catch (err) {
			console.error(err);
			setResult({ error: err.message });
		} finally {
			setLoading(false);
		}
	};

	// =========================
	// FORMAT DATA (map backend → UI)
	// =========================
	const formatted = result
		? (() => {
				const best = result.winning_info?.reduce((min, cur) =>
					cur.min_distance < min.min_distance ? cur : min
				);

				return {
					winner_vector: best?.winning_vector,
					winner_position: best?.winning_neuron,
					winner_distance: best?.min_distance,

					distance_list: result.distance_table?.map((item, index) => ({
						vector_index: index,
						min_distance: item.distance_to_centroid,
						winner: item.neuron_position,
					})),

					neurons: result.graph_data?.neurons || [],
				};
		})()
		: null;

	// =========================
	// DRAW GRAPH (Canvas)
	// =========================
	useEffect(() => {
		if (!formatted || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const padding = 60;
		const cellSize = 70;

		const rows = Math.max(...formatted.neurons.map(n => n.row)) + 1;
		const cols = Math.max(...formatted.neurons.map(n => n.col)) + 1;

		// =========================
		// VẼ GRID (đường nối)
		// =========================
		ctx.strokeStyle = "#ccc";
		ctx.lineWidth = 1;

		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const x = padding + c * cellSize;
				const y = padding + r * cellSize;

				// nối phải
				if (c < cols - 1) {
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(padding + (c + 1) * cellSize, y);
					ctx.stroke();
				}

				// nối xuống
				if (r < rows - 1) {
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(x, padding + (r + 1) * cellSize);
					ctx.stroke();
				}
			}
		}

		// =========================
		// VẼ NODE
		// =========================
		formatted.neurons.forEach((n) => {
			const x = padding + n.col * cellSize;
			const y = padding + n.row * cellSize;

			// node
			ctx.beginPath();
			ctx.arc(x, y, 12, 0, 2 * Math.PI);
			ctx.fillStyle = "#e5e7eb";
			ctx.fill();
			ctx.strokeStyle = "#555";
			ctx.stroke();

			// label (r,c)
			ctx.fillStyle = "#000";
			ctx.font = "10px Arial";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(`(${n.row},${n.col})`, x, y);
		});

		// =========================
		// WINNER
		// =========================
		if (formatted.winner_position) {
			const [r, c] = formatted.winner_position;
			const x = padding + c * cellSize;
			const y = padding + r * cellSize;

			ctx.beginPath();
			ctx.arc(x, y, 16, 0, 2 * Math.PI);
			ctx.fillStyle = "red";
			ctx.fill();

			ctx.fillStyle = "white";
			ctx.font = "bold 12px Arial";
			ctx.fillText("WIN", x, y);
		}

		// =========================
		// TITLE
		// =========================
		ctx.fillStyle = "#000";
		ctx.font = "16px Arial";
		ctx.fillText("Lưới Kohonen và Nơron Chiến Thắng", 150, 30);

	}, [formatted]);

	return (
		<div className="p-6 bg-gray-100 min-h-screen">
			<div className="bg-white rounded-2xl shadow-md p-6">
				<h1 className="text-2xl font-semibold mb-6">
					Kohonen Self-Organizing Map
				</h1>

				<div className="space-y-4">
					<div className="flex flex-col gap-4">
						<div>
							<label className="font-medium mr-6">Số dòng (nơron):</label>
							<input
								type="number"
								value={rows}
								onChange={(e) => setRows(Number(e.target.value))}
								className="border p-2 rounded w-1/3"
							/>

						</div>

						<div>
							<label className="font-medium mr-6">Số cột (nơron):</label>
							<input
								type="number"
								value={cols}
								onChange={(e) => setCols(Number(e.target.value))}
								className="border p-2 rounded w-1/3"
							/>
						</div>
					</div>

					<div className="flex items-center gap-4">
						<input
							type="file"
							onChange={(e) => setFile(e.target.files[0])}
							className="border p-2 rounded"
						/>
					</div>

					<div className="flex justify-center">
						<button
							onClick={handleSubmit}
							className="bg-[#1e293b] text-white px-10 py-2 rounded-lg hover:bg-[#334155]"
						>
							{loading ? "Đang chạy..." : "Chạy Thuật Toán"}
						</button>
					</div>
				</div>
			</div>

			{formatted && (
				<div className="mt-6 space-y-6">
					{/* WINNER */}
					<div className="bg-white p-6 rounded-2xl shadow">
						<h2 className="text-xl font-semibold mb-4">
							Nơron Chiến Thắng
						</h2>

						<p>
							<b>Vector:</b> [{formatted.winner_vector?.join(", ")}]
						</p>

						<p>
							<b>Vị trí:</b> ({formatted.winner_position?.[0]},{" "}
							{formatted.winner_position?.[1]})
						</p>

						<p>
							<b>Khoảng cách nhỏ nhất:</b>{" "}
							{Number(formatted.winner_distance).toFixed(6)}
						</p>
					</div>

					{/* GRAPH */}
					<div className="bg-white p-6 rounded-2xl shadow">
						<h2 className="text-xl font-semibold mb-4">
							Lưới Kohonen
						</h2>

						<canvas
							ref={canvasRef}
							width={600}
							height={400}
							className="mx-auto border"
						/>
					</div>

					{/* TABLE */}
					<div className="bg-white p-6 rounded-2xl shadow">
						<h2 className="text-xl font-semibold mb-4">
							Bảng Khoảng Cách
						</h2>

						<div className="overflow-auto">
							<table className="w-full border text-sm">
								<thead className="bg-gray-200">
									<tr>
										<th className="border px-3 py-2">Vector</th>
										<th className="border px-3 py-2">Khoảng cách</th>
										<th className="border px-3 py-2">Vị trí</th>
									</tr>
								</thead>

								<tbody>
									{formatted.distance_list?.map((item) => (
										<tr key={item.vector_index}>
											<td className="border px-3 py-1 text-center">
												{item.vector_index}
											</td>

											<td className="border px-3 py-1 text-center">
												{Number(item.min_distance).toFixed(6)}
											</td>

											<td className="border px-3 py-1 text-center">
												({item.winner[0]}, {item.winner[1]})
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
	);
}