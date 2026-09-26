import { useState } from 'react';
import { TYPE_LABELS, formatPrice } from '../../utils/format.js';

// The clothes rail of the fitting room.
//   Mouse / pen: drag a garment onto the mirror (onDragStart hands the drag to the page).
//   Touch: tap a garment to wear it (dragging inside a scrolling list is awkward on phones).
//   Keyboard: every card is a button.
export default function GarmentTray({ products, wornId, onWear, onDragStart, loading }) {
  const [type, setType] = useState('all');
  const types = [...new Set(products.map((p) => p.type))];
  const shown = type === 'all' ? products : products.filter((p) => p.type === type);

  return (
    <section aria-label="Clothes to try on">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {['all', ...types].map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={type === t}
            onClick={() => setType(t)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              type === t ? 'border-brand bg-brand text-white' : 'border-gray-300 text-gray-700 hover:border-gray-500'
            }`}
          >
            {t === 'all' ? 'All' : (TYPE_LABELS[t] ?? t)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : (
        <ul className="grid max-h-[28rem] grid-cols-3 gap-3 overflow-y-auto pr-1">
          {shown.map((product) => (
            <li key={product._id}>
              <button
                type="button"
                onPointerDown={(e) => {
                  if (e.pointerType === 'touch') return;
                  e.preventDefault(); // no native image drag / text selection
                  onDragStart(product, e);
                }}
                onClick={() => onWear(product)}
                aria-pressed={wornId === product._id}
                title={`Wear ${product.name}`}
                className={`group block w-full cursor-grab text-left active:cursor-grabbing ${
                  wornId === product._id ? 'rounded-lg ring-2 ring-brand ring-offset-2' : ''
                }`}
              >
                <img
                  src={product.images[0]}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  className="aspect-[3/4] w-full rounded-lg object-cover transition group-hover:opacity-90"
                />
                <span className="mt-1 block truncate text-xs font-medium text-gray-900">{product.name}</span>
                <span className="block text-xs text-gray-500">{formatPrice(product.discountPrice ?? product.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-gray-500">Drag a garment onto the mirror (or tap it) to try it on.</p>
    </section>
  );
}
