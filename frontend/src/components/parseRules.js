export const parseRules = (text) => {
	if (!text) return [];

	const lines = text.split("\n");
	const rules = [];
	const path = [];

	for (let line of lines) {
		const clean = line.trim();

		// reset khi gặp node mới
		if (clean.includes("[") && clean.includes("]")) {
			path.length = 0;
		}

		// condition (feature = value)
		if (clean.includes("=") && !clean.includes("Predict")) {
			const match = clean.match(/([A-Za-z0-9_]+)\s*=\s*(.+)/);
			if (match) {
				path.push(`${match[1]} = ${match[2]}`);
			}
		}

		// leaf (Predict = label)
		if (clean.includes("Predict")) {
			const match = clean.match(/Predict\s*=\s*(.+)/);
			if (match) {
				rules.push(`${path.join(" AND ")} THEN ${match[1]}`);
			}
		}
	}

	return rules;
};