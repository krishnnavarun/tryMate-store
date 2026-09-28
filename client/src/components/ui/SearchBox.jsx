import { useEffect, useState } from 'react';

/**
 * A search field. Enter searches straight away; with `live`, typing also searches after a
 * short pause. The value follows `value` when it changes from outside (e.g. "Clear search").
 *
 *   <SearchBox value={q} onSearch={(text) => …} live />
 */
export default function SearchBox({ value = '', onSearch, live = false, autoFocus = false, placeholder = 'Search shirts, tees, polos, colours…', className = '' }) {
  const [text, setText] = useState(value);
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    // The search changed from outside: show it
    setShown(value);
    setText(value);
  }

  // Live search: wait until typing pauses
  useEffect(() => {
    if (!live || text.trim() === value.trim()) return;
    const id = setTimeout(() => onSearch(text.trim()), 350);
    return () => clearTimeout(id);
  }, [live, text, value, onSearch]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(text.trim());
      }}
      className={`relative ${className}`}
    >
      <svg className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path strokeLinecap="round" d="M16 16l4.5 4.5" />
      </svg>
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label="Search the collection"
        maxLength={80}
        autoFocus={autoFocus}
        className="block w-full rounded-full border border-smoke bg-coal py-3 pr-11 pl-11 text-sm text-alabaster transition-[border-color,box-shadow] duration-300 placeholder:text-gray-500 hover:border-gray-300 focus:border-alabaster focus:ring-4 focus:ring-alabaster/5 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText('');
            onSearch('');
          }}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-onyx hover:text-alabaster"
          aria-label="Clear search"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
            <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      )}
    </form>
  );
}
