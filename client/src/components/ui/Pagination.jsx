export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const button =
    'rounded-full border border-smoke px-5 py-2 text-[11px] font-semibold tracking-[0.16em] uppercase transition-colors hover:border-alabaster disabled:pointer-events-none disabled:opacity-35';

  return (
    <nav className="flex items-center justify-center gap-4" aria-label="Pagination">
      <button type="button" className={button} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span className="heading-display text-lg text-gray-600 tabular-nums">
        {page} <span className="text-gray-400">/</span> {pages}
      </span>
      <button type="button" className={button} disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}
