import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { updateFitPreference } from '../api/fitProfile.js';
import { fetchProduct, fetchSizeRecommendation } from '../api/products.js';
import FitPreferenceToggle from '../components/fit/FitPreferenceToggle.jsx';
import Price from '../components/products/Price.jsx';
import SizeGuide from '../components/products/SizeGuide.jsx';
import TryOnModal from '../components/products/TryOnModal.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';

export default function ProductPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  // Re-fetch when the user or their profile changes: `suitingColors` depends on them
  const { data: product, loading, error, reload } = useApi(
    (signal) => fetchProduct(slug, { signal }),
    [slug, user?._id ?? null, user?.fitProfile?.updatedAt ?? null],
  );

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

// Size recommendation for the logged-in user (null when there's no user or no fit profile)
function useSizeRecommendation(product, user) {
  const eligible = Boolean(user?.fitProfile?.measurements);
  return useApi(
    (signal) => (eligible ? fetchSizeRecommendation(product._id, { signal }) : Promise.resolve(null)),
    [product._id, eligible, user?.fitPreference ?? null, user?.fitProfile?.updatedAt ?? null],
  );
}

function ProductDetails({ product }) {
  const [colorIndex, setColorIndex] = useState(0);
  const [chosenSize, setChosenSize] = useState(null);
  const [adding, setAdding] = useState(false);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [savingFit, setSavingFit] = useState(false);
  const { user, setUser } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const recommendation = useSizeRecommendation(product, user);

  const sizes = Object.keys(product.sizeChart ?? {});
  const inStock = (s) => (product.stock?.[s] ?? 0) > 0;
  const color = product.colors[colorIndex];
  // Images are stored one per color, in the same order as `colors`
  const image = product.images[colorIndex] ?? product.images[0];
  const suiting = new Set(product.suitingColors ?? []);

  const recommended = recommendation.data?.recommendedSize ?? null;
  // Until the shopper picks a size, pre-select the recommended one (if it's in stock)
  const size = chosenSize ?? (recommended && inStock(recommended) ? recommended : null);
  const sizeFit = size ? recommendation.data?.perSize?.[size] : null;

  function requireLogin(message, redirect = location.pathname) {
    toast(message, { icon: '🔒' });
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
  }

  async function handleAddToCart() {
    if (!size) return toast.error('Please choose a size first.');
    if (!user) return requireLogin('Log in to add items to your cart.');

    setAdding(true);
    try {
      await addItem({ productId: product._id, size, color: color.name, qty: 1 });
      toast.success((t) => (
        <span>
          Added to your cart.{' '}
          <Link to="/cart" onClick={() => toast.dismiss(t.id)} className="font-semibold underline">
            View cart
          </Link>
        </span>
      ));
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setAdding(false);
    }
  }

  async function handleFitPreference(fitPreference) {
    setSavingFit(true);
    try {
      const result = await updateFitPreference(fitPreference);
      setChosenSize(null); // let the new recommendation pre-select
      setUser({ ...user, fitPreference: result.fitPreference }); // triggers a new recommendation
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setSavingFit(false);
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
              {suiting.has(color.name) && <SuitsYouBadge className="ml-2" />}
            </p>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  title={suiting.has(c.name) ? `${c.name} (suits you)` : c.name}
                  aria-label={suiting.has(c.name) ? `${c.name}, suits you` : c.name}
                  aria-pressed={i === colorIndex}
                  onClick={() => setColorIndex(i)}
                  className={`relative h-9 w-9 rounded-full border border-gray-300 ring-offset-2 transition ${
                    i === colorIndex ? 'ring-2 ring-brand' : 'hover:ring-2 hover:ring-gray-300'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {suiting.has(c.name) && (
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                  )}
                </button>
              ))}
            </div>
            {suiting.size > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 align-middle" />
                Colors that suit your skin tone
              </p>
            )}
          </div>

          {/* Size selector + recommendation */}
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-900">
                Size: <span className="font-normal text-gray-600">{size ?? 'Choose a size'}</span>
              </p>
              {recommendation.data && (
                <FitPreferenceToggle value={user.fitPreference} onChange={handleFitPreference} disabled={savingFit} />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const soldOut = !inStock(s);
                const isRecommended = s === recommended;
                return (
                  <div key={s} className="relative pt-2.5">
                    {isRecommended && (
                      <span className="absolute -top-0.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white uppercase">
                        Best fit
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={soldOut}
                      aria-pressed={size === s}
                      onClick={() => setChosenSize(s)}
                      title={soldOut ? 'Sold out' : recommendation.data?.perSize?.[s]?.note}
                      className={`min-w-14 rounded-md border px-4 py-2.5 text-sm font-medium transition ${
                        size === s
                          ? 'border-brand bg-brand text-white'
                          : soldOut
                            ? 'cursor-not-allowed border-gray-200 text-gray-300 line-through'
                            : isRecommended
                              ? 'border-emerald-600 text-gray-900 hover:border-gray-900'
                              : 'border-gray-300 text-gray-900 hover:border-gray-900'
                      }`}
                    >
                      {s}
                    </button>
                  </div>
                );
              })}
            </div>

            <FitNote
              user={user}
              recommendation={recommendation}
              size={size}
              sizeFit={sizeFit}
              recommended={recommended}
              recommendedInStock={recommended ? inStock(recommended) : true}
              onLogin={() => requireLogin('Log in to get your size.', '/fit-profile')}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className="flex-1 rounded-lg bg-brand py-3.5 text-base font-semibold text-white transition hover:bg-brand-light disabled:cursor-wait disabled:opacity-70"
            >
              {adding ? 'Adding…' : 'Add to cart'}
            </button>
            <button
              type="button"
              onClick={() => (user ? setTryOnOpen(true) : requireLogin('Log in to try this on.'))}
              className="flex-1 rounded-lg border-2 border-brand py-3 text-base font-semibold text-brand transition hover:bg-brand hover:text-white"
            >
              Try it on
            </button>
          </div>

          <Link
            to={`/fitting-room?product=${product.slug}&color=${encodeURIComponent(color.name)}`}
            className="-mt-4 flex items-center justify-center gap-2 rounded-lg bg-cream py-2.5 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
          >
            <span aria-hidden="true">📷</span> Try it live in the fitting room
          </Link>

          {product.description && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">Description</h2>
              <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
            </div>
          )}

          <SizeGuide sizeChart={product.sizeChart} />
        </div>
      </div>

      {tryOnOpen && <TryOnModal product={product} color={color} onClose={() => setTryOnOpen(false)} />}
    </div>
  );
}

function SuitsYouBadge({ className = '' }) {
  return (
    <span className={`rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ${className}`}>
      Suits you
    </span>
  );
}

// The line under the size buttons: the fit note, a prompt to scan, or a loading/error state
function FitNote({ user, recommendation, size, sizeFit, recommended, recommendedInStock, onLogin }) {
  const box = 'mt-4 rounded-xl p-4 text-sm';

  if (!user || !user.fitProfile?.measurements) {
    return (
      <div className={`${box} flex flex-wrap items-center justify-between gap-3 bg-cream`}>
        <p className="text-gray-700">
          <span className="font-semibold text-gray-900">Not sure about your size?</span> Scan once and we'll recommend
          the right size on every product.
        </p>
        {user ? (
          <Link to="/fit-profile" className="rounded-md bg-brand px-3 py-1.5 font-semibold text-white">
            Find my size
          </Link>
        ) : (
          <button type="button" onClick={onLogin} className="rounded-md bg-brand px-3 py-1.5 font-semibold text-white">
            Find my size
          </button>
        )}
      </div>
    );
  }
  if (recommendation.loading) return <p className={`${box} animate-pulse bg-gray-50 text-gray-500`}>Finding your size…</p>;
  if (recommendation.error) {
    return (
      <p className={`${box} bg-gray-50 text-gray-600`}>
        {recommendation.error.userMessage}{' '}
        <button type="button" onClick={recommendation.reload} className="font-semibold text-brand underline">
          Try again
        </button>
      </p>
    );
  }
  if (!recommendation.data) return null;

  const bestScore = recommendation.data.perSize?.[recommended]?.score ?? 0;
  return (
    <div className={`${box} bg-emerald-50 text-emerald-900`}>
      <p>
        <span className="font-semibold">We recommend {recommended}</span> for your measurements
        {!recommendedInStock && <span className="text-emerald-800"> (sold out right now)</span>}.
      </p>
      {size && sizeFit && (
        <p className="mt-1">
          Size {size}: <span className="font-medium">{matchLabel(sizeFit.score)}</span>
          {sizeFit.note !== 'Good fit' && ` · ${sizeFit.note}`}
        </p>
      )}
      {bestScore < 0.3 && (
        <p className="mt-2 text-amber-800">
          None of the sizes is a close match for your measurements. Check the size guide below, or re-scan in fitted
          clothes for more accurate measurements.
        </p>
      )}
      <p className="mt-2 text-xs text-emerald-800/80">
        Based on your fit profile ({user.fitPreference} fit).{' '}
        <Link to="/fit-profile" className="underline">
          Update it
        </Link>
      </p>
    </div>
  );
}

// Scores are for ranking sizes; shoppers get words instead of a percentage
function matchLabel(score) {
  if (score >= 0.8) return 'Great match';
  if (score >= 0.5) return 'Good match';
  if (score >= 0.25) return 'Could work';
  return 'Not a close match';
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
