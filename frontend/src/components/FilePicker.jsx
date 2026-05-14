export default function FilePicker({
  id,
  fileName,
  onChange,
  accept,
  className = "",
}) {
  return (
    <div className={`flex items-center gap-3 rounded border p-2 ${className}`}>
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
      />
      <label
        htmlFor={id}
        className="cursor-pointer rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200"
      >
        Chọn tệp
      </label>
      <span className="min-w-0 truncate text-sm text-gray-600">
        {fileName || "Chưa chọn tệp"}
      </span>
    </div>
  );
}
