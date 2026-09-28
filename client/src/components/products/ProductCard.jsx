import { Link } from 'react-router';
import ColorDots from './ColorDots.jsx';
import Price from './Price.jsx';
import ProductImage from './ProductImage.jsx';

export default function ProductCard({ product }) {
  // Show the colour that suits the shopper when there is one (images are one per colour)
  const suitingIndex = product.suitsYou ? product.colors.findIndex((c) => c.name === product.suitsYou.color) : -1;
  const first = suitingIndex >= 0 ? suitingIndex : 0;
  // On hover, cross-fade to another colour of the same product
  const second = product.images.length > 1 ? (first === 0 ? 1 : 0) : null;
  const imageClass = 'absolute inset-0 h-full w-full transition-[opacity,transform] duration-[1400ms] ease-out-expo';

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-onyx">
        <ProductImage
          src={product.images[first]}
          alt={`${product.name} in ${product.colors[first]?.name ?? ''}`}
          name={product.name}
          type={product.type}
          hex={product.colors[first]?.hex}
          className={`${imageClass} group-hover:scale-[1.05]`}
        />
        {second !== null && (
          <ProductImage
            src={product.images[second]}
            alt=""
            name={product.name}
            type={product.type}
            hex={product.colors[second]?.hex}
            className={`${imageClass} opacity-0 group-hover:scale-[1.05] group-hover:opacity-100`}
          />
        )}

        {product.suitsYou && (
          <span
            title={`${product.suitsYou.color} suits your skin tone`}
            className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-noir/90 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-emerald-700 shadow-sm backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Suits you
          </span>
        )}

        <span className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-3 rounded-full bg-noir/90 py-2.5 text-center text-[11px] font-semibold tracking-[0.2em] text-alabaster uppercase opacity-0 backdrop-blur transition duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
          View details
        </span>
      </div>

      <div className="mt-4 space-y-1.5">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-gray-500 uppercase">{product.brand}</p>
        <h3 className="text-[15px] font-medium text-alabaster transition-colors group-hover:text-ember">{product.name}</h3>
        <div className="flex items-center justify-between gap-3">
          <Price price={product.price} discountPrice={product.discountPrice} />
          <ColorDots colors={product.colors} />
        </div>
      </div>
    </Link>
  );
}

// Placeholder shown while products load
export function ProductCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[3/4] rounded-2xl" />
      <div className="mt-4 space-y-2">
        <div className="skeleton h-2.5 w-1/4 rounded-full" />
        <div className="skeleton h-4 w-2/3 rounded-full" />
        <div className="skeleton h-4 w-1/3 rounded-full" />
      </div>
    </div>
  );
}
