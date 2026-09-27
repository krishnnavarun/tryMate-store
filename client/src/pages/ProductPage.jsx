import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { updateFitPreference } from '../api/fitProfile.js';
import { fetchProduct, fetchProducts, fetchSizeRecommendation } from '../api/products.js';
import FitPreferenceToggle from '../components/fit/FitPreferenceToggle.jsx';
import FitBreakdown from '../components/products/FitBreakdown.jsx';
import Price from '../components/products/Price.jsx';
import ProductGrid from '../components/products/ProductGrid.jsx';
import ProductImage from '../components/products/ProductImage.jsx';
import SizeGuide from '../components/products/SizeGuide.jsx';
import TryOnModal from '../components/products/TryOnModal.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import { TYPE_LABELS } from '../utils/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function ProductPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  // Re-fetch when the user or their profile changes: `suitingColors` depends on them
  const { data: product, loading, error, reload } = useApi(
    (signal) => fetchProduct(slug, { signal }),
    [slug, user?._id ?? null, user?.fitProfile?.updatedAt ?? null],
  );
  usePageTitle(product?.name ?? (error ? 'Product not found' : null));

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
              <Link to="/shop" className="btn-primary btn-sm">
                Back to the shop
              </Link>
            ) : (
              <button type="button" onClick={reload} className="btn-primary btn-sm">
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
  const [needSize, setNeedSize] = useState(false); // "Add to cart" was pressed without a size
  const sizesRef = useRef(null);
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
  const imageIndex = product.images[colorIndex] ? colorIndex : 0;
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
    if (!size) {
      // Point at the size picker instead of only showing a toast
      setNeedSize(true);
      sizesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      sizesRef.current?.querySelector('button:not([disabled])')?.focus({ preventScroll: true });
      return;
    }
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
      <nav className="mb-8 flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-gray-500 uppercase">
        <Link to="/shop" className="link-underline hover:text-ink">
          Shop
        </Link>
        <span className="text-gray-300">/</span>
        <Link to={`/shop?type=${product.type}`} className="link-underline hover:text-ink">
          {TYPE_LABELS[product.type] ?? 'Shirts'}
        </Link>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
        {/* ---- Images (stays in view while the details scroll) ---- */}
        <div className="h-fit md:sticky md:top-32">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[28px] bg-bone">
            {/* key: switching colour cross-fades to the new image */}
            <ProductImage
              key={imageIndex}
              src={product.images[imageIndex]}
              alt={`${product.name} in ${color.name}`}
              name={product.name}
              type={product.type}
              hex={color.hex}
              loading="eager"
              className="absolute inset-0 h-full w-full animate-fade"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-5 gap-3">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setColorIndex(Math.min(i, product.colors.length - 1))}
                  className={`relative aspect-[3/4] overflow-hidden rounded-xl ring-offset-2 ring-offset-ivory transition ${
                    i === imageIndex ? 'ring-1 ring-ink' : 'opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`Show ${product.colors[i]?.name ?? `image ${i + 1}`}`}
                >
                  <ProductImage
                    src={src}
                    alt=""
                    name={product.name}
                    type={product.type}
                    hex={product.colors[i]?.hex}
                    className="absolute inset-0 h-full w-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---- Details ---- */}
        <div className="animate-rise space-y-10" style={{ animationDelay: '120ms' }}>
          <div className="space-y-4">
            <p className="eyebrow">{product.brand}</p>
            <h1 className="heading-display text-5xl leading-[1.05] sm:text-6xl">{product.name}</h1>
            <Price price={product.price} discountPrice={product.discountPrice} size="lg" />
            {product.description && <p className="max-w-prose leading-relaxed text-gray-600">{product.description}</p>}
          </div>

          {/* Color picker */}
          <div>
            <p className="mb-4 text-[11px] font-semibold tracking-[0.16em] text-gray-600 uppercase">
              Colour <span className="ml-1 tracking-normal text-ink normal-case">{color.name}</span>
              {suiting.has(color.name) && <SuitsYouBadge className="ml-3" />}
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
                  className={`relative h-10 w-10 rounded-full ring-offset-[3px] ring-offset-ivory transition duration-300 ${
                    i === colorIndex ? 'ring-1 ring-ink' : 'hover:scale-110'
                  }`}
                >
                  <span className="absolute inset-0 rounded-full ring-1 ring-black/10 ring-inset" style={{ backgroundColor: c.hex }} />
                  {suiting.has(c.name) && (
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ivory bg-emerald-600" />
                  )}
                </button>
              ))}
            </div>
            {suiting.size > 0 && (
              <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
                Colours that suit your skin tone
              </p>
            )}
          </div>

          {/* Size selector + recommendation */}
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-gray-600 uppercase">
                Size <span className="ml-1 tracking-normal text-ink normal-case">{size ?? 'Choose a size'}</span>
              </p>
              {recommendation.data && (
                <FitPreferenceToggle value={user.fitPreference} onChange={handleFitPreference} disabled={savingFit} />
              )}
            </div>
            <div
              ref={sizesRef}
              role="group"
              aria-label="Sizes"
              className={`-m-2 flex flex-wrap gap-2.5 rounded-2xl p-2 transition-shadow duration-500 ${needSize && !size ? 'ring-2 ring-red-300' : ''}`}
            >
              {sizes.map((s) => {
                const soldOut = !inStock(s);
                const isRecommended = s === recommended;
                return (
                  <div key={s} className="relative pt-3">
                    {isRecommended && (
                      <span className="absolute top-0 left-1/2 z-10 -translate-x-1/2 animate-pop rounded-full bg-emerald-700 px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] whitespace-nowrap text-ivory uppercase">
                        Best fit
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={soldOut}
                      aria-pressed={size === s}
                      onClick={() => {
                        setChosenSize(s);
                        setNeedSize(false);
                      }}
                      aria-label={soldOut ? `${s}, sold out` : isRecommended ? `${s}, best fit for you` : s}
                      title={soldOut ? 'Sold out' : recommendation.data?.perSize?.[s]?.note}
                      className={`h-12 min-w-16 rounded-xl border px-4 text-sm font-semibold transition duration-300 ${
                        size === s
                          ? 'border-ink bg-ink text-ivory'
                          : soldOut
                            ? 'cursor-not-allowed border-sand text-gray-300 line-through'
                            : isRecommended
                              ? 'border-emerald-600 bg-white text-ink hover:border-ink'
                              : 'border-sand bg-white text-ink hover:border-ink'
                      }`}
                    >
                      {s}
                    </button>
                  </div>
                );
              })}
            </div>
            {needSize && !size && (
              <p role="alert" className="mt-3 animate-rise text-sm font-medium text-red-700">
                Choose your size to add it to your cart.
              </p>
            )}
            {size && inStock(size) && product.stock[size] <= 3 && (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600" aria-hidden="true" />
                Only {product.stock[size]} left in size {size}
              </p>
            )}

            <FitNote
              user={user}
              recommendation={recommendation}
              size={size}
              sizeFit={sizeFit}
              recommended={recommended}
              recommendedInStock={recommended ? inStock(recommended) : true}
              onLogin={() => requireLogin('Log in to get your size.', '/fit-profile')}
              onChooseSize={(s) => {
                setChosenSize(s);
                setNeedSize(false);
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={handleAddToCart} disabled={adding} className="btn-primary flex-1 py-4">
                {adding ? 'Adding…' : 'Add to cart'}
              </button>
              <button
                type="button"
                onClick={() => (user ? setTryOnOpen(true) : requireLogin('Log in to try this on.'))}
                className="btn-secondary flex-1 py-4"
              >
                Try it on
              </button>
            </div>
            <Link
              to={`/fitting-room?product=${product.slug}&color=${encodeURIComponent(color.name)}`}
              className="group flex items-center justify-center gap-2.5 rounded-full bg-bone py-3.5 text-[12px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:bg-sand"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.5-2.5v9L15 14M4 7h11v10H4z" />
              </svg>
              Try it live in the fitting room
              <span aria-hidden="true" className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>

          <SizeGuide sizeChart={product.sizeChart} />
        </div>
      </div>

      <RelatedProducts product={product} />

      {tryOnOpen && <TryOnModal product={product} color={color} onClose={() => setTryOnOpen(false)} />}
    </div>
  );
}

function SuitsYouBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-emerald-800 normal-case ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Suits you
    </span>
  );
}

// The line under the size buttons: the fit note, a prompt to scan, or a loading/error state
function FitNote({ user, recommendation, size, sizeFit, recommended, recommendedInStock, onLogin, onChooseSize }) {
  const box = 'mt-5 rounded-2xl p-5 text-sm animate-rise';

  if (!user || !user.fitProfile?.measurements) {
    return (
      <div className={`${box} flex flex-wrap items-center justify-between gap-4 bg-bone`}>
        <p className="max-w-xs text-gray-700">
          <span className="font-display text-lg text-ink">Not sure about your size?</span>
          <br />
          Scan once and we&rsquo;ll recommend the right size on every piece.
        </p>
        {user ? (
          <Link to="/fit-profile" className="btn-primary btn-sm">
            Find my size
          </Link>
        ) : (
          <button type="button" onClick={onLogin} className="btn-primary btn-sm">
            Find my size
          </button>
        )}
      </div>
    );
  }
  if (recommendation.loading) return <p className={`${box} skeleton text-gray-500`}>Finding your size…</p>;
  if (recommendation.error) {
    return (
      <p className={`${box} bg-bone text-gray-600`}>
        {recommendation.error.userMessage}{' '}
        <button type="button" onClick={recommendation.reload} className="font-semibold text-ink underline">
          Try again
        </button>
      </p>
    );
  }
  if (!recommendation.data) return null;

  const bestScore = recommendation.data.perSize?.[recommended]?.score ?? 0;
  const { alternativeSize, alternativeNote } = recommendation.data;
  const shownSize = size ?? recommended; // the breakdown follows the size you're looking at
  const confidence = user.fitProfile.confidence ?? 1;
  return (
    <div className={`${box} border border-emerald-200 bg-emerald-50/70 text-emerald-900`}>
      <p>
        <span className="font-display text-lg text-emerald-900">We recommend {recommended}</span> for your measurements
        {!recommendedInStock && <span className="text-emerald-800"> (sold out right now)</span>}.
      </p>
      {alternativeNote && (
        <p className="mt-1">
          {alternativeNote}{' '}
          <button
            type="button"
            onClick={() => onChooseSize(shownSize === alternativeSize ? recommended : alternativeSize)}
            className="font-semibold underline"
          >
            Show size {shownSize === alternativeSize ? recommended : alternativeSize}
          </button>
        </p>
      )}
      {size && sizeFit && (
        <p className="mt-1">
          Size {size}: <span className="font-semibold">{matchLabel(sizeFit.score)}</span>
          {sizeFit.note !== 'Good fit' && ` · ${sizeFit.note}`}
        </p>
      )}
      {bestScore < 0.3 && (
        <p className="mt-2 text-amber-800">
          None of the sizes is a close match for your measurements. Check the size guide below, or re-scan in fitted
          clothes for more accurate measurements.
        </p>
      )}
      <FitBreakdown size={shownSize} fields={recommendation.data.perSize?.[shownSize]?.fields} />
      {confidence < 0.65 && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          Your scan&rsquo;s confidence is {Math.round(confidence * 100)}%, so treat this as a guide.{' '}
          <Link to="/fit-profile" className="font-semibold underline">
            Re-scan
          </Link>{' '}
          in fitted clothes and good light for a more precise answer.
        </p>
      )}
      <p className="mt-4 text-xs text-emerald-800/80">
        Based on your fit profile ({user.fitPreference} fit).{' '}
        <Link to="/fit-profile" className="underline">
          Update it
        </Link>
      </p>
    </div>
  );
}

// A few other pieces of the same type, to keep browsing without going back to the shop
function RelatedProducts({ product }) {
  const { data, loading } = useApi(
    (signal) => fetchProducts({ type: product.type, limit: 5, sort: 'newest' }, { signal }),
    [product._id],
  );
  const items = (data?.items ?? []).filter((p) => p._id !== product._id).slice(0, 4);
  if (!loading && items.length === 0) return null;

  return (
    <section className="mt-24 border-t border-sand pt-16" aria-labelledby="related-heading">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Keep browsing</p>
          <h2 id="related-heading" className="heading-display mt-3 text-4xl">
            You may also like
          </h2>
        </div>
        <Link
          to={`/shop?type=${product.type}`}
          className="link-underline pb-1 text-[12px] font-semibold tracking-[0.18em] text-ink uppercase"
        >
          See all {TYPE_LABELS[product.type] ?? 'pieces'}
        </Link>
      </div>
      <ProductGrid products={items} loading={loading} skeletonCount={4} />
    </section>
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
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:gap-16">
      <div className="skeleton aspect-[3/4] rounded-[28px]" />
      <div className="space-y-5 pt-6">
        <div className="skeleton h-3 w-1/5 rounded-full" />
        <div className="skeleton h-12 w-3/4 rounded-full" />
        <div className="skeleton h-6 w-1/4 rounded-full" />
        <div className="skeleton h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}
