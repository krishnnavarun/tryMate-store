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

      <FilterSection title="Colour">
        <div className="grid grid-cols-2 gap-1">
          {options.colors.map((color) => {
            const active = values.color?.toLowerCase() === color.name.toLowerCase();
            return (
              <button
                key={color.name}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ color: active ? null : color.name })}
                className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 text-left text-[13px] transition-colors duration-300 ${
                  active ? 'bg-ink text-ivory' : 'text-gray-700 hover:bg-bone'
                }`}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10 ring-inset"
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
          className="link-underline text-[11px] font-semibold tracking-[0.16em] text-brass uppercase"
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
      <h3 className="mb-4 text-[11px] font-semibold tracking-[0.2em] text-gray-500 uppercase">{title}</h3>
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
      className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors duration-300 ${
        active ? 'border-ink bg-ink text-ivory' : 'border-sand bg-white text-gray-700 hover:border-ink'
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
          placeholder="Min"
          aria-label="Minimum price"
          className="w-full rounded-full border border-sand bg-white px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
        <span className="text-gray-400">–</span>
        <input
          name="maxPrice"
          type="number"
          min="0"
          inputMode="numeric"
          defaultValue={maxPrice ?? ''}
          placeholder="Max"
          aria-label="Maximum price"
          className="w-full rounded-full border border-sand bg-white px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
      </div>
      {range.max > 0 && (
        <p className="text-xs text-gray-500">
          From {formatPrice(range.min)} to {formatPrice(range.max)}
        </p>
      )}
      <button
        type="submit"
        className="btn-secondary btn-sm w-full"
      >
        Apply
      </button>
    </form>
  );
}
