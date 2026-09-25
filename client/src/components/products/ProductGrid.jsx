import ProductCard, { ProductCardSkeleton } from './ProductCard.jsx';

export default function ProductGrid({ products, loading, skeletonCount = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => <ProductCardSkeleton key={i} />)
        : products.map((product) => <ProductCard key={product._id} product={product} />)}
    </div>
  );
}
