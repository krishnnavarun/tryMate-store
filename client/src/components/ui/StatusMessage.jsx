// A centered message for empty states and errors, with an optional action button.
export default function StatusMessage({ title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {message && <p className="mt-2 max-w-md text-sm text-gray-600">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
