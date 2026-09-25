import { TYPE_LABELS, formatPrice } from '../../utils/format.js';

// Filter panel for the shop page. It doesn't own any state: the current values come
// from the URL (?type=polo&color=Navy...) and every change goes through onChange.
//
// Props:
//   options  – { types, colors, price: { min, max } } from the API
//   values   – current URL params { type, color, minPrice, maxPrice }
//   onChange – onChange({ color: 'Navy' }) / onChange({ color: null }) to clear
export default function ShopFilters({ options, values, onChange }) {
  const hasFilters = values.type || values.color || values.minPrice || values.maxPrice;

  return (
    <div className="space-y-8">
      <FilterSection title="Type">
        <div className="flex flex-wrap gap-2">
          <Pill active={!values.type} onClick={() => onChange({ type: null })}>
            All
          </Pill>
          {options.types.map((type) => (
            <Pill key={type} active={values.type === type} onClick={() => onChange({ type })}>
              {TYPE_LABELS[type] ?? type}
            </Pill>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Color">
        <div className="grid grid-cols-2 gap-1">
          {options.colors.map((color) => {
            const active = values.color?.toLowerCase() === color.name.toLowerCase();
            return (
              <button
                key={color.name}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ color: active ? null : color.name })}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
                  active ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="truncate">{color.name}</span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Price">
        {/* key: re-create the inputs when the URL values change (e.g. "Clear all") */}
        <PriceFilter
          key={`${values.minPrice ?? ''}-${values.maxPrice ?? ''}`}
          range={options.price}
          minPrice={values.minPrice}
          maxPrice={values.maxPrice}
          onApply={onChange}
        />
      </FilterSection>

      {hasFilters && (
        <button
          type="button"
          onClick={() => onChange({ type: null, color: null, minPrice: null, maxPrice: null })}
          className="text-sm font-medium text-brand-accent hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

function FilterSection({ title, children }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
      {children}
    </section>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active ? 'border-brand bg-brand text-white' : 'border-gray-300 text-gray-700 hover:border-gray-500'
      }`}
    >
      {children}
    </button>
  );
}

function PriceFilter({ range, minPrice, maxPrice, onApply }) {
  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onApply({ minPrice: form.get('minPrice') || null, maxPrice: form.get('maxPrice') || null });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          name="minPrice"
          type="number"
          min="0"
          inputMode="numeric"
          defaultValue={minPrice ?? ''}
          placeholder={`Min (${formatPrice(range.min)})`}
          aria-label="Minimum price"
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
        <span className="text-gray-400">–</span>
        <input
          name="maxPrice"
          type="number"
          min="0"
          inputMode="numeric"
          defaultValue={maxPrice ?? ''}
          placeholder={`Max (${formatPrice(range.max)})`}
          aria-label="Maximum price"
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-md border border-gray-300 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Apply
      </button>
    </form>
  );
}
