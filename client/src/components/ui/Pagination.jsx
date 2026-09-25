export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const button = 'rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40';

  return (
    <nav className="flex items-center justify-center gap-3" aria-label="Pagination">
      <button type="button" className={button} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span className="text-sm text-gray-600">
        Page {page} of {pages}
      </span>
      <button type="button" className={button} disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}
