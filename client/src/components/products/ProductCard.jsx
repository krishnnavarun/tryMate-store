import { Link } from 'react-router';
import ColorDots from './ColorDots.jsx';
import Price from './Price.jsx';

export default function ProductCard({ product }) {
  // Show the colour that suits the shopper when there is one (images are one per colour)
  const suitingIndex = product.suitsYou ? product.colors.findIndex((c) => c.name === product.suitsYou.color) : -1;
  const image = product.images[suitingIndex] ?? product.images[0];

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
        {product.suitsYou && (
          <span
            title={`${product.suitsYou.color} suits your skin tone`}
            className="absolute top-2 left-2 z-10 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm"
          >
            ✓ Suits you
          </span>
        )}
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{product.brand}</p>
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-brand-accent">{product.name}</h3>
        <Price price={product.price} discountPrice={product.discountPrice} />
        <ColorDots colors={product.colors} />
      </div>
    </Link>
  );
}

// Grey placeholder shown while products load
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] rounded-xl bg-gray-200" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-1/3 rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-200" />
        <div className="h-4 w-1/4 rounded bg-gray-200" />
      </div>
    </div>
  );
}
