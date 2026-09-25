export default function Spinner({ className = '', label = 'Loading' }) {
  return (
    <div className={`flex justify-center ${className}`} role="status" aria-label={label}>
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand" />
    </div>
  );
}
