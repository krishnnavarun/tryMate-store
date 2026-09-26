import { Link } from 'react-router';
import { widthLabel } from '../../lib/fitting/fit.js';
import Price from '../products/Price.jsx';

// Details of the garment being worn in the mirror: colour, size, fit, add to cart.
export default function WornPanel({
  product,
  colorIndex,
  onColor,
  size,
  onSize,
  recommendation,
  scales,
  hasProfile,
  loggedIn,
  onAddToCart,
  adding,
  onTakeOff,
}) {
  const sizes = Object.keys(product.sizeChart ?? {});
  const inStock = (s) => (product.stock?.[s] ?? 0) > 0;
  const suiting = new Set(product.suitingColors ?? []);
  const recommended = recommendation.data?.recommendedSize;
  const sizeFit = size ? recommendation.data?.perSize?.[size] : null;

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200 p-5" aria-label="Garment you're wearing">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{product.brand}</p>
          <h2 className="text-lg font-semibold text-gray-900">{product.name}</h2>
          <Price price={product.price} discountPrice={product.discountPrice} />
        </div>
        <button type="button" onClick={onTakeOff} className="text-sm font-medium text-gray-500 hover:text-red-600">
          Take off
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-900">
          Color: <span className="font-normal text-gray-600">{product.colors[colorIndex].name}</span>
          {suiting.has(product.colors[colorIndex].name) && (
            <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Suits you</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {product.colors.map((c, i) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              aria-label={c.name}
              aria-pressed={i === colorIndex}
              onClick={() => onColor(i)}
              className={`relative h-8 w-8 rounded-full border border-gray-300 ring-offset-2 ${i === colorIndex ? 'ring-2 ring-brand' : ''}`}
              style={{ backgroundColor: c.hex }}
            >
              {suiting.has(c.name) && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-900">
          Size: <span className="font-normal text-gray-600">{size ?? 'Choose a size'}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <div key={s} className="relative pt-2.5">
              {s === recommended && (
                <span className="absolute -top-0.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white uppercase">
                  Best fit
                </span>
              )}
              <button
                type="button"
                disabled={!inStock(s)}
                aria-pressed={size === s}
                onClick={() => onSize(s)}
                className={`min-w-12 rounded-md border px-3 py-2 text-sm font-medium ${
                  size === s
                    ? 'border-brand bg-brand text-white'
                    : !inStock(s)
                      ? 'cursor-not-allowed border-gray-200 text-gray-300 line-through'
                      : 'border-gray-300 hover:border-gray-900'
                }`}
              >
                {s}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm">
          {!hasProfile ? (
            <p className="text-gray-600">
              The mirror shows your own proportions.{' '}
              <Link to={loggedIn ? '/fit-profile' : '/login?redirect=%2Ffit-profile'} className="font-semibold text-brand underline">
                Scan your body
              </Link>{' '}
              to see how each size really fits you.
            </p>
          ) : recommendation.loading ? (
            <p className="animate-pulse text-gray-500">Checking the fit…</p>
          ) : (
            <>
              {size && sizeFit && (
                <p className="text-gray-900">
                  <span className="font-semibold">Size {size}:</span> {sizeFit.note}
                </p>
              )}
              {size && scales.known && (
                <p className="mt-1 text-gray-600">
                  In the mirror: {widthLabel(scales.width)} ({Math.round((scales.width - 1) * 100) >= 0 ? '+' : ''}
                  {Math.round((scales.width - 1) * 100)}% width vs your chest)
                </p>
              )}
              {recommended && (
                <p className="mt-1 text-emerald-800">We recommend {recommended} for you.</p>
              )}
            </>
          )}
          <p className="mt-2 text-xs text-gray-400">
            The mirror is a live preview of colour, style and proportions. Fit notes come from your measurements.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={adding}
          className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60"
        >
          {adding ? 'Adding…' : 'Add to cart'}
        </button>
        <Link
          to={`/products/${product.slug}`}
          className="flex-1 rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium hover:bg-gray-50"
        >
          Product details
        </Link>
      </div>
    </section>
  );
}
