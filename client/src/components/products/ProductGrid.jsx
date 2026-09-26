import { Reveal } from '../ui/Motion.jsx';
import ProductCard, { ProductCardSkeleton } from './ProductCard.jsx';

export default function ProductGrid({ products, loading, skeletonCount = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => <ProductCardSkeleton key={i} />)
        : products.map((product, i) => (
            // A gentle left-to-right wave as each row scrolls into view
            <Reveal key={product._id} delay={(i % 4) * 80}>
              <ProductCard product={product} />
            </Reveal>
          ))}
    </div>
  );
}
