import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { fetchProduct } from '../api/products.js';
import Price from '../components/products/Price.jsx';
import SizeGuide from '../components/products/SizeGuide.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';

export default function ProductPage() {
  const { slug } = useParams();
  const { data: product, loading, error, reload } = useApi((signal) => fetchProduct(slug, { signal }), [slug]);

  if (loading && !product) return <ProductPageSkeleton />;

  if (error) {
    const notFound = error.errorCode === 'NOT_FOUND' || error.errorCode === 'VALIDATION_ERROR';
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <StatusMessage
          title={notFound ? 'Product not found' : "Couldn't load this product"}
          message={notFound ? 'It may have been removed, or the link is wrong.' : error.userMessage}
          action={
            notFound ? (
              <Link to="/shop" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white">
                Back to the shop
              </Link>
            ) : (
              <button type="button" onClick={reload} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white">
                Try again
              </button>
            )
          }
        />
      </div>
    );
  }

  // key: reset the selected color/size when navigating to a different product
  return <ProductDetails key={product._id} product={product} />;
}

function ProductDetails({ product }) {
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState(null);
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const sizes = Object.keys(product.sizeChart ?? {});
  const color = product.colors[colorIndex];
  // Images are stored one per color, in the same order as `colors`
  const image = product.images[colorIndex] ?? product.images[0];

  async function handleAddToCart() {
    if (!size) {
      toast.error('Please choose a size first.');
      return;
    }
    if (!user) {
      toast('Log in to add items to your cart.', { icon: '🔒' });
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    setAdding(true);
    try {
      await addItem({ productId: product._id, size, color: color.name, qty: 1 });
      toast.success(
        (t) => (
          <span>
            Added to your cart.{' '}
            <Link to="/cart" onClick={() => toast.dismiss(t.id)} className="font-semibold underline">
              View cart
            </Link>
          </span>
        ),
      );
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/shop" className="hover:text-brand">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/shop?type=${product.type}`} className="hover:text-brand">
          {product.type === 'tshirt' ? 'T-shirts' : product.type === 'polo' ? 'Polos' : 'Shirts'}
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        {/* ---- Images ---- */}
        <div>
          <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100">
            <img src={image} alt={`${product.name} in ${color.name}`} className="h-full w-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-5 gap-3">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setColorIndex(Math.min(i, product.colors.length - 1))}
                  className={`aspect-[3/4] overflow-hidden rounded-lg border-2 ${
                    i === colorIndex ? 'border-brand' : 'border-transparent'
                  }`}
                  aria-label={`Show image ${i + 1}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---- Details ---- */}
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">{product.brand}</p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.name}</h1>
            <Price price={product.price} discountPrice={product.discountPrice} size="lg" />
          </div>

          {/* Color picker */}
          <div>
            <p className="mb-3 text-sm font-medium text-gray-900">
              Color: <span className="font-normal text-gray-600">{color.name}</span>
            </p>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={i === colorIndex}
                  onClick={() => setColorIndex(i)}
                  className={`h-9 w-9 rounded-full border border-gray-300 ring-offset-2 transition ${
                    i === colorIndex ? 'ring-2 ring-brand' : 'hover:ring-2 hover:ring-gray-300'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* Size selector. Phase 4 adds the "Recommended" badge + a fit note per size here. */}
          <div>
            <p className="mb-3 text-sm font-medium text-gray-900">
              Size: <span className="font-normal text-gray-600">{size ?? 'Choose a size'}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const soldOut = (product.stock?.[s] ?? 0) === 0;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={soldOut}
                    aria-pressed={size === s}
                    onClick={() => setSize(s)}
                    title={soldOut ? 'Sold out' : undefined}
                    className={`min-w-14 rounded-md border px-4 py-2.5 text-sm font-medium transition ${
                      size === s
                        ? 'border-brand bg-brand text-white'
                        : soldOut
                          ? 'cursor-not-allowed border-gray-200 text-gray-300 line-through'
                          : 'border-gray-300 text-gray-900 hover:border-gray-900'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            className="w-full rounded-lg bg-brand py-3.5 text-base font-semibold text-white transition hover:bg-brand-light disabled:cursor-wait disabled:opacity-70"
          >
            {adding ? 'Adding…' : 'Add to cart'}
          </button>

          {product.description && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">Description</h2>
              <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
            </div>
          )}

          <SizeGuide sizeChart={product.sizeChart} />
        </div>
      </div>
    </div>
  );
}

function ProductPageSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl animate-pulse gap-8 px-4 py-14 sm:px-6 md:grid-cols-2 lg:gap-14">
      <div className="aspect-[3/4] rounded-2xl bg-gray-200" />
      <div className="space-y-4">
        <div className="h-4 w-1/4 rounded bg-gray-200" />
        <div className="h-8 w-2/3 rounded bg-gray-200" />
        <div className="h-6 w-1/3 rounded bg-gray-200" />
        <div className="h-12 w-full rounded bg-gray-200" />
      </div>
    </div>
  );
}
