import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router';
import { fetchProducts } from '../api/products.js';
import ProductGrid from '../components/products/ProductGrid.jsx';
import ShopFilters from '../components/products/ShopFilters.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { TYPE_LABELS } from '../utils/format.js';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
];

const EMPTY_OPTIONS = { types: [], colors: [], price: { min: 0, max: 0 } };

export default function ShopPage() {
  // The URL is the single source of truth for filters, sort and page,
  // so filtered views can be shared, bookmarked, and survive a refresh/back button.
  const [searchParams, setSearchParams] = useSearchParams();
  const params = Object.fromEntries(searchParams);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { user, status } = useAuth();
  const hasColors = Boolean(user?.fitProfile?.colorSuggestions?.length);
  // Only ask for suitsMe when it can work (logged in, with suggested colours)
  const query = { ...params, limit: PAGE_SIZE };
  if (!hasColors) delete query.suitsMe;

  const { data, loading, error, reload } = useApi(
    // Wait for the login check, so "Suits you" tags appear on the first load
    (signal) => (status === 'loading' ? new Promise(() => {}) : fetchProducts(query, { signal })),
    [searchParams.toString(), status, user?._id ?? null, user?.fitProfile?.updatedAt ?? null],
  );

  useEffect(() => {
    if (error) toast.error(error.userMessage);
  }, [error]);

  // Merge changes into the URL. null/'' removes a param.
  // Any filter change goes back to page 1 (unless the change IS the page).
  function updateParams(changes) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value == null || value === '') next.delete(key);
      else next.set(key, value);
    }
    if (!('page' in changes)) next.delete('page');
    setSearchParams(next);
  }

  const suitsMeOn = hasColors && params.suitsMe === 'true';
  const title = suitsMeOn ? 'Colors that suit you' : params.type ? (TYPE_LABELS[params.type] ?? 'Shop') : 'Shop all';
  const filterPanel = (
    <ShopFilters options={data?.filters ?? EMPTY_OPTIONS} values={params} onChange={updateParams} />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
          {data && <p className="mt-1 text-sm text-gray-500">{data.total} products</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hasColors && (
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              <input
                type="checkbox"
                checked={suitsMeOn}
                onChange={(e) => updateParams({ suitsMe: e.target.checked ? 'true' : null })}
                className="h-4 w-4 accent-emerald-600"
              />
              Colors that suit you
            </label>
          )}
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium lg:hidden"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            {filtersOpen ? 'Hide filters' : 'Filters'}
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="hidden sm:inline">Sort by</span>
            <select
              value={params.sort ?? 'newest'}
              onChange={(e) => updateParams({ sort: e.target.value === 'newest' ? null : e.target.value })}
              className="rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-900"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        {/* Filters: always visible on desktop, toggled on mobile */}
        <aside className={`${filtersOpen ? 'mb-8 block' : 'hidden'} lg:block`}>{filterPanel}</aside>

        <section>
          {error ? (
            <StatusMessage
              title="Couldn't load products"
              message={error.userMessage}
              action={
                <button
                  type="button"
                  onClick={reload}
                  className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white"
                >
                  Try again
                </button>
              }
            />
          ) : !loading && data?.items.length === 0 ? (
            <StatusMessage
              title="No products match these filters"
              message={
                suitsMeOn
                  ? 'None of these products come in your suggested colors. Try removing other filters.'
                  : 'Try removing a filter or widening the price range.'
              }
              action={
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white"
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <>
              <ProductGrid products={data?.items ?? []} loading={loading} />
              <div className="mt-12">
                <Pagination
                  page={data?.page ?? 1}
                  pages={data?.pages ?? 1}
                  onPageChange={(page) => updateParams({ page: page === 1 ? null : page })}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
