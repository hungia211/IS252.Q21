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
		formData.append("minSupport", minSupport);
		formData.append("minConfidence", minConfidence);

		try {
		setLoading(true);

		const res = await fetch("http://localhost:5000/apriori", {
			method: "POST",
			body: formData,
		});

		const data = await res.json();
		setResult(data);
		} catch (err) {
		console.error(err);
		alert("Lỗi xử lý!");
		} finally {
		setLoading(false);
		}
	};

	return (
	<div className="p-6 bg-gray-100 min-h-screen">

		{/* Title */}
		<div className="bg-white rounded-xl shadow p-4 mb-4">
			<h1 className="text-lg font-semibold">Tập Phổ Biến</h1>
		</div>

		<div className="bg-white rounded-xl shadow p-6 flex grid grid-cols-5">

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
					Nhập giá trị Min-Support
				</label>
				<input
					type="number"
					step="0.1"
					value={minSupport}
					onChange={(e) => setMinSupport(e.target.value)}
					className="border rounded p-2 w-full"
				/>
				</div>

				{/* Min Confidence */}
				<div className="mb-4">
				<label className="block text-sm mb-1">
					Nhập giá trị Min-Confidence
				</label>
				<input
					type="number"
					step="0.1"
					value={minConfidence}
					onChange={(e) => setMinConfidence(e.target.value)}
					className="border rounded p-2 w-full"
				/>
				</div>

				<button
				onClick={handleSubmit}
				className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-black"
				>
				{loading ? "Đang tính..." : "Tính toán"}
				</button>
			</div>

			{/* ===== RIGHT ===== */}
			<div className="pl-6">
				<h2 className="font-semibold mb-4">Kết quả</h2>

				{!result && !loading && (
				<p className="text-gray-400">Chưa có dữ liệu</p>
				)}

				{loading && (
				<p className="text-blue-500">Đang xử lý...</p>
				)}

				{result && !result.error && (
					<div className="bg-gray-50 p-4 rounded-xl border space-y-6 max-h-[600px] overflow-auto">

						{/* ===== TẬP PHỔ BIẾN ===== */}
						<div>
						<h3 className="font-semibold mb-2">
							Tập phổ biến
						</h3>

						<div className="bg-white rounded border p-3 max-h-[200px] overflow-auto space-y-1 text-sm">
							{result.frequent_itemsets?.map((item, i) => (
							<div
								key={i}
								className="flex justify-between border-b pb-1"
							>
								<span>
								{item.itemset.join(", ")}
								</span>
								<span className="text-blue-600 font-semibold">
								{Number(item.support).toFixed(4)}
								</span>
							</div>
							))}
						</div>
						</div>

						{/* ===== TẬP TỐI ĐẠI ===== */}
						<div>
						<h3 className="font-semibold mb-2">
							Tập phổ biến tối đại
						</h3>

						<div className="bg-white rounded border p-3 flex flex-wrap gap-2 text-sm">
							{result.maximal_itemsets?.map((item, i) => (
							<span
								key={i}
								className="bg-green-100 text-green-700 px-3 py-1 rounded-lg"
							>
								{item.join(", ")}
							</span>
							))}
						</div>
						</div>

						{/* ===== LUẬT KẾT HỢP ===== */}
						<div>
						<h3 className="font-semibold mb-2">
							Luật kết hợp
						</h3>

						<div className="bg-white rounded border p-3 max-h-[250px] overflow-auto space-y-2 text-sm">
							{result.association_rules?.map((rule, i) => (
							<div
								key={i}
								className="flex justify-between border-b pb-1"
							>
								<span>
								<span className="font-medium">
									{rule.antecedent.join(", ")}
								</span>
								{" → "}
								<span className="font-medium">
									{rule.consequence.join(", ")}
								</span>
								</span>

								<span className="text-purple-600 font-semibold">
								{Number(rule.confidence).toFixed(4)}
								</span>
							</div>
							))}
						</div>
						</div>

					</div>
				)}
			</div>

		</div>
	</div>
	);
}