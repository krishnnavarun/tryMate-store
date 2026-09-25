import { Link } from 'react-router';
import ColorDots from './ColorDots.jsx';
import Price from './Price.jsx';

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
        <img
          src={product.images[0]}
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
