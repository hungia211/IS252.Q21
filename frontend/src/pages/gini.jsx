import { useState, useEffect, useRef } from "react";
import { parseRules } from "../components/parseRules";

/* ================= TREE ================= */
const AutoFitTree = ({ children }) => {
	const containerRef = useRef(null);
	const contentRef = useRef(null);
	const [scale, setScale] = useState(1);

	useEffect(() => {
		const updateScale = () => {
			if (!containerRef.current || !contentRef.current) return;

			const container = containerRef.current;
			const content = contentRef.current;

			const scaleX = container.offsetWidth / content.scrollWidth;
			const scaleY = container.offsetHeight / content.scrollHeight;

			const newScale = Math.min(scaleX, scaleY, 1);

			setScale(newScale);
		};

		updateScale();
		window.addEventListener("resize", updateScale);

		return () => window.removeEventListener("resize", updateScale);
	}, []);

	return (
		<div
			ref={containerRef}
			className="w-full h-full flex justify-center items-start overflow-hidden"
		>
			<div
				ref={contentRef}
				style={{
					transform: `scale(${scale})`,
					transformOrigin: "top center",
					width: "max-content",
				}}
			>
				{children}
			</div>
		</div>
	);
};

/* ================= TREE NODE ================= */
const TreeNode = ({ node }) => {
	if (!node) return null;

	// ===== LEAF =====
	if (node.type === "leaf") {
		return (
			<div className="bg-green-100 border border-green-300 px-4 py-2 rounded-xl shadow-sm text-center min-w-[110px] hover:shadow-md transition whitespace-nowrap">
				<div className="font-semibold text-green-700 text-sm">
					{node.label}
				</div>
				<div className="text-xs text-gray-500 mt-1">
					{node.samples} samples
				</div>
			</div>
		);
	}

	const children = Object.entries(node.children);

	return (
		<div className="flex flex-col items-center relative">

			{/* NODE */}
			<div className="bg-blue-100 border border-blue-300 px-5 py-2 rounded-xl shadow-sm text-center min-w-[130px] hover:shadow-md transition z-10 whitespace-nowrap">
				<div className="font-semibold text-blue-700 text-sm">
					{node.feature}
				</div>
				<div className="text-xs text-gray-500 mt-1">
					Gini: {node.score.toFixed(4)}
				</div>
			</div>

			{/* LINE DỌC */}
			<div className="w-px h-6 bg-gray-300"></div>

			{/* CHILDREN */}
			<div className="relative flex justify-center">

				{/* LINE NGANG */}
				{children.length > 1 && (
					<div className="absolute top-0 h-px bg-gray-300 w-full"></div>
				)}

				<div className="flex gap-4">
					{children.map(([value, child]) => (
						<div
							key={value}
							className="flex flex-col items-center relative"
						>
							{/* DOT */}
							<div className="w-2 h-2 bg-gray-400 rounded-full"></div>

							{/* LINE DỌC */}
							<div className="w-px h-6 bg-gray-300"></div>

							{/* LABEL */}
							<div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full mb-2 shadow-sm whitespace-nowrap">
								{value}
							</div>

							{/* CHILD */}
							<TreeNode node={child} />
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

/* ================= MAIN PAGE ================= */
export default function Gini() {
	const [file, setFile] = useState(null);
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);

	const handleFileChange = (e) => {
		setFile(e.target.files[0]);
		setResult(null);
	};

	const handleSubmit = async () => {
		if (!file) {
			alert("Vui lòng chọn file!");
			return;
		}

		const formData = new FormData();
		formData.append("file", file);
		formData.append("algorithm", "gini");

		try {
			setLoading(true);

			const res = await fetch(
				"http://localhost:8000/classification/decision-tree",
				{
					method: "POST",
					body: formData,
				}
			);

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
		<div className="p-6 bg-gray-100 min-h-screen overflow-hidden">

			{/* TITLE */}
			<div className="bg-white rounded-xl shadow p-4 mb-4">
				<h1 className="text-lg font-semibold">
					Cây quyết định (Gini Index)
				</h1>
			</div>

			<div className="bg-white rounded-2xl shadow-md p-4 grid grid-cols-5 gap-6">

				{/* LEFT */}
				<div className="col-span-2">
					<h2 className="text-lg font-semibold mb-4">
						Nhập dữ liệu
					</h2>

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
							className={`px-4 py-2 rounded text-white ${
								loading
									? "bg-gray-400"
									: "bg-blue-600 hover:bg-blue-700"
							}`}
						>
							{loading ? "Đang xử lý..." : "Tính toán"}
						</button>
					</div>
				</div>

				<div className="col-span-3 border-l pl-6 overflow-hidden">
					<h2 className="text-lg font-semibold mb-2">
						Kết quả
					</h2>

					{!result && !loading && (
						<p className="text-gray-500">Chưa có dữ liệu</p>
					)}

					{loading && (
						<p className="text-blue-500">
							Đang xử lý dữ liệu...
						</p>
					)}

					{/* RESULT */}
					{result && !result.error && (
						<div className="bg-gray-50 p-4 rounded-xl border space-y-1 overflow-hidden">

							{/* FEATURE SCORES */}
							<div>
								<h3 className="font-semibold mb-2">
									Gini Index của từng thuộc tính
								</h3>

								<ul className="list-disc ml-6 text-sm">
									{Object.entries(
										result.feature_scores || {}
									).map(([attr, val]) => (
										<li key={attr}>
											{attr}: {Number(val).toFixed(4)}
										</li>
									))}
								</ul>
							</div>

							{/* BEST */}
							{result.best_attribute && (
								<div>
									<h3 className="font-semibold mb-2">
										Thuộc tính được chọn
									</h3>
									<p className="text-sm">
										{result.root_explanation}
									</p>
								</div>
							)}

							{/* TREE */}
							{result.tree_structure && (
								<div className="border rounded p-4 bg-white ">
									<AutoFitTree>
										<TreeNode node={result.tree_structure} />
									</AutoFitTree>
								</div>
							)}

							{/* RULES */}
							{result.tree_representation && (
								<div>
									<h3 className="font-semibold mb-2">
										Luật IF-THEN
									</h3>

									<ul className="space-y-2 text-sm">
										{parseRules(
											result.tree_representation
										).map((rule, idx) => (
											<li
												key={idx}
												className="bg-white border rounded-lg px-3 py-2 shadow-sm"
											>
												{rule}
											</li>
										))}
									</ul>
								</div>
							)}
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