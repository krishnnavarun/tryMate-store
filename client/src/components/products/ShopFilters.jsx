import { useState } from 'react';
import { TYPE_LABELS, formatPrice } from '../../utils/format.js';

const COLOURS_SHOWN = 8; // the rest behind "Show all colours"

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
        <ColourList colors={options.colors} value={values.color} onChange={onChange} />
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
          className="link-underline text-[11px] font-semibold tracking-[0.16em] text-ember uppercase"
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
        active ? 'border-alabaster bg-alabaster text-noir' : 'border-smoke bg-coal text-gray-700 hover:border-alabaster'
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
          className="w-full rounded-full border border-smoke bg-coal px-3 py-2 text-sm focus:border-alabaster focus:outline-none"
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
          className="w-full rounded-full border border-smoke bg-coal px-3 py-2 text-sm focus:border-alabaster focus:outline-none"
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

// Colours with their full names, one per row: the first few, plus "Show all colours".
// The selected colour always stays visible.
function ColourList({ colors, value, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const selected = (c) => value?.toLowerCase() === c.name.toLowerCase();
  const shown = expanded ? colors : colors.filter((c, i) => i < COLOURS_SHOWN || selected(c));

  return (
    <div>
      <ul className="space-y-0.5">
        {shown.map((color) => {
          const active = selected(color);
          return (
            <li key={color.name}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ color: active ? null : color.name })}
                className={`flex w-full items-center gap-2.5 rounded-full px-2.5 py-1.5 text-left text-[13px] transition-colors duration-300 ${
                  active ? 'bg-alabaster text-noir' : 'text-gray-700 hover:bg-onyx'
                }`}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10 ring-inset"
                  style={{ backgroundColor: color.hex }}
                />
                {color.name}
              </button>
            </li>
          );
        })}
      </ul>
      {colors.length > COLOURS_SHOWN && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="link-underline mt-3 ml-2.5 text-[11px] font-semibold tracking-[0.14em] text-alabaster uppercase"
        >
          {expanded ? 'Show fewer' : `Show all ${colors.length} colours`}
        </button>
      )}
    </div>
  );
}
