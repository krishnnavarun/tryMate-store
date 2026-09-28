import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router';
import { fetchProducts } from '../api/products.js';
import ProductGrid from '../components/products/ProductGrid.jsx';
import ShopFilters from '../components/products/ShopFilters.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import SearchBox from '../components/ui/SearchBox.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { TYPE_LABELS, formatPrice } from '../utils/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

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
  const title = params.q
    ? `Results for “${params.q}”`
    : suitsMeOn
      ? 'Colours that suit you'
      : params.type
        ? (TYPE_LABELS[params.type] ?? 'Shop')
        : 'Shop all';
  usePageTitle(title);
  const filterPanel = (
    <ShopFilters options={data?.filters ?? EMPTY_OPTIONS} values={params} onChange={updateParams} />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-smoke pb-8">
        <div>
          <p className="eyebrow">The collection</p>
          <h1 className="heading-display mt-3 text-5xl sm:text-6xl">{title}</h1>
          {data && (
            <p className="mt-2 text-sm text-gray-500" aria-live="polite">
              {data.total} {data.total === 1 ? 'piece' : 'pieces'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hasColors && (
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] text-emerald-800 uppercase transition-colors hover:border-emerald-400">
              <input
                type="checkbox"
                checked={suitsMeOn}
                onChange={(e) => updateParams({ suitsMe: e.target.checked ? 'true' : null })}
                className="h-4 w-4 accent-emerald-600"
              />
              Colours that suit you
            </label>
          )}
          <button
            type="button"
            className="rounded-full border border-smoke px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase lg:hidden"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            {filtersOpen ? 'Hide filters' : 'Filters'}
          </button>
          <label className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-gray-600 uppercase">
            <span className="hidden sm:inline">Sort</span>
            <select
              value={params.sort ?? 'newest'}
              onChange={(e) => updateParams({ sort: e.target.value === 'newest' ? null : e.target.value })}
              className="rounded-full border border-smoke bg-coal px-3 py-2 text-sm font-medium tracking-normal text-alabaster normal-case focus:border-alabaster focus:outline-none"
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

      {/* Search + what's currently filtered (each chip removes one filter) */}
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center">
        <SearchBox value={params.q ?? ''} onSearch={(q) => updateParams({ q: q || null })} live className="w-full lg:max-w-md" />
        <ActiveFilters params={params} suitsMeOn={suitsMeOn} onChange={updateParams} />
      </div>

      <div className="mt-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
        {/* Filters: always visible on desktop, toggled on mobile */}
        <aside className={`${filtersOpen ? 'mb-8 block animate-rise' : 'hidden'} h-fit lg:sticky lg:top-32 lg:block`}>{filterPanel}</aside>

        <section>
          {error ? (
            <StatusMessage
              title="Couldn't load products"
              message={error.userMessage}
              action={
                <button
                  type="button"
                  onClick={reload}
                  className="btn-primary btn-sm"
                >
                  Try again
                </button>
              }
            />
          ) : !loading && data?.items.length === 0 ? (
            <StatusMessage
              title={params.q ? `Nothing matches “${params.q}”` : 'No products match these filters'}
              message={
                params.q
                  ? 'Check the spelling, or try a colour or a type, like “navy”, “linen” or “polo”.'
                  : suitsMeOn
                    ? 'None of these products come in your suggested colours. Try removing other filters.'
                    : 'Try removing a filter or widening the price range.'
              }
              action={
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="btn-primary btn-sm"
                >
                  {params.q ? 'Clear search and filters' : 'Clear filters'}
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

const ALL_FILTERS = { q: null, type: null, color: null, minPrice: null, maxPrice: null, suitsMe: null };

function priceLabel(min, max) {
  if (min && max) return `${formatPrice(Number(min))} – ${formatPrice(Number(max))}`;
  return min ? `From ${formatPrice(Number(min))}` : `Up to ${formatPrice(Number(max))}`;
}

// The filters in use, as chips: click one to remove just that filter
function ActiveFilters({ params, suitsMeOn, onChange }) {
  const chips = [];
  if (params.q) chips.push({ key: 'q', label: `“${params.q}”`, clear: { q: null } });
  if (params.type) chips.push({ key: 'type', label: TYPE_LABELS[params.type] ?? params.type, clear: { type: null } });
  if (params.color) chips.push({ key: 'color', label: params.color, clear: { color: null } });
  if (params.minPrice || params.maxPrice) {
    chips.push({ key: 'price', label: priceLabel(params.minPrice, params.maxPrice), clear: { minPrice: null, maxPrice: null } });
  }
  if (suitsMeOn) chips.push({ key: 'suitsMe', label: 'Colours that suit you', clear: { suitsMe: null } });
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.clear)}
          aria-label={`Remove filter: ${chip.label}`}
          className="inline-flex animate-pop items-center gap-2 rounded-full bg-alabaster py-1.5 pr-2.5 pl-3.5 text-[13px] text-noir transition-colors hover:bg-white"
        >
          {chip.label}
          <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={() => onChange(ALL_FILTERS)}
          className="link-underline ml-1 text-[11px] font-semibold tracking-[0.14em] text-gray-600 uppercase hover:text-alabaster"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
