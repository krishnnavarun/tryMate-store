export default function Spinner({ className = '', label = 'Loading' }) {
  return (
    <div className={`flex justify-center ${className}`} role="status" aria-label={label}>
      <span className="h-9 w-9 animate-spin rounded-full border border-smoke border-t-ember" />
    </div>
  );
}
