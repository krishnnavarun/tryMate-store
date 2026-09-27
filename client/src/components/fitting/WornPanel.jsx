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
    <section className="animate-rise space-y-6 rounded-[28px] border border-sand bg-white p-6" aria-label="Garment you're wearing">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{product.brand}</p>
          <h2 className="heading-display mt-1 mb-1 text-3xl leading-tight">{product.name}</h2>
          <Price price={product.price} discountPrice={product.discountPrice} />
        </div>
        <button
          type="button"
          onClick={onTakeOff}
          className="link-underline shrink-0 text-[11px] font-semibold tracking-[0.14em] text-gray-500 uppercase hover:text-red-600"
        >
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
              className={`relative h-9 w-9 rounded-full ring-offset-[3px] ring-offset-white transition duration-300 ${i === colorIndex ? 'ring-1 ring-ink' : 'hover:scale-110'}`}
              style={{ backgroundColor: c.hex }}
            >
              {suiting.has(c.name) && (
                <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-600" />
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
                <span className="absolute -top-0.5 left-1/2 z-10 -translate-x-1/2 animate-pop rounded-full bg-emerald-700 px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] whitespace-nowrap text-ivory uppercase">
                  Best fit
                </span>
              )}
              <button
                type="button"
                disabled={!inStock(s)}
                aria-pressed={size === s}
                onClick={() => onSize(s)}
                className={`h-11 min-w-14 rounded-xl border px-3 text-sm font-semibold transition duration-300 ${
                  size === s
                    ? 'border-ink bg-ink text-ivory'
                    : !inStock(s)
                      ? 'cursor-not-allowed border-sand text-gray-300 line-through'
                      : 'border-sand bg-white hover:border-ink'
                }`}
              >
                {s}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-ivory p-4 text-sm ring-1 ring-sand/70">
          {!hasProfile ? (
            <p className="text-gray-600">
              The mirror shows your own proportions.{' '}
              <Link to={loggedIn ? '/fit-profile' : '/login?redirect=%2Ffit-profile'} className="font-semibold text-ink underline">
                Scan your body
              </Link>{' '}
              to see how each size really fits you.
            </p>
          ) : recommendation.loading ? (
            <p className="animate-breathe text-gray-500">Checking the fit…</p>
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
          <p className="mt-2 text-xs text-gray-500">
            The mirror is a live preview of colour, style and proportions. Fit notes come from your measurements.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={adding}
          className="btn-primary flex-1"
        >
          {adding ? 'Adding…' : 'Add to cart'}
        </button>
        <Link
          to={`/products/${product.slug}`}
          className="btn-secondary flex-1"
        >
          Product details
        </Link>
      </div>
    </section>
  );
}
