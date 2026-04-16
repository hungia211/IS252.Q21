import { useState } from "react";

export default function Kohonen() {
	const [rows, setRows] = useState(0);
	const [cols, setCols] = useState(0);
	const [file, setFile] = useState(null);
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (!file) {
			alert("Chọn file!");
			return;
		}

		const formData = new FormData();
		formData.append("rows", rows);
		formData.append("cols", cols);
		formData.append("file", file);

		try {
			setLoading(true);

			const res = await fetch("http://localhost:8000/kohonen", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();
			setResult(data);
		} catch (err) {
			console.error(err);
			setResult({ error: "Lỗi server" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-6 bg-gray-100 min-h-screen">
			<div className="bg-white rounded-2xl shadow-md p-6">
				{/* TITLE */}
				<h1 className="text-2xl font-semibold mb-6">
					Kohonen Self-Organizing Map
				</h1>

				{/* INPUT */}
				<div className="space-y-4">

					<div className="flex flex-col gap-4">
						<div>
							<label className="font-medium mr-6">Số dòng (nơron):</label>
							<input
								type="number"
								value={rows}
								onChange={(e) => setRows(e.target.value)}
								placeholder="Số dòng (nơron)"
								className="border p-2 rounded w-1/3"
							/>
						</div>
						
						<div> 
							<label className="font-medium mr-6">Số cột (nơron):</label>
							<input
								type="number"
								value={cols}
								onChange={(e) => setCols(e.target.value)}
								placeholder="Số cột (nơron)"
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

					{/* button */}
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

			{/* RESULT */}
			{result && !result.error && (
				<div className="mt-6 space-y-6">

					{/* WINNER */}
					<div className="bg-white p-6 rounded-2xl shadow">
						<h2 className="text-xl font-semibold mb-4">
							Nơron Chiến Thắng
						</h2>

						<p>
							<b>Vector:</b>{" "}
							[{result.winner_vector?.join(", ")}]
						</p>

						<p>
							<b>Vị trí:</b>{" "}
							({result.winner_position?.[0]}, {result.winner_position?.[1]})
						</p>

						<p>
							<b>Khoảng cách nhỏ nhất:</b>{" "}
							{Number(result.winner_distance).toFixed(6)}
						</p>
					</div>

					{/* GRAPH */}
					{result.graphic && (
						<div className="bg-white p-6 rounded-2xl shadow">
							<h2 className="text-xl font-semibold mb-4">
								Lưới Kohonen
							</h2>

							<img
								src={`data:image/png;base64,${result.graphic}`}
								className="mx-auto"
								alt="graph"
							/>
						</div>
					)}

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
									{result.distance_list?.map((item) => (
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