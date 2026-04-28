const TreeNode = ({ node }) => {
  // ===== LEAF =====
  if (node.type === "leaf") {
    return (
      <div className="ml-6 border-l pl-4">
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded inline-block">
          Predict: {node.label}
        </div>
      </div>
    );
  }

  // ===== NODE =====
  return (
    <div className="ml-4">
      <div className="bg-blue-100 px-3 py-1 rounded inline-block font-semibold">
        {node.feature}
      </div>

      <div className="ml-6 mt-2 space-y-2 border-l pl-4">
        {Object.entries(node.children).map(([value, child]) => (
          <div key={value}>
            <div className="text-sm text-gray-600 mb-1">
              {node.feature} = <b>{value}</b>
            </div>

            <TreeNode node={child} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TreeNode;