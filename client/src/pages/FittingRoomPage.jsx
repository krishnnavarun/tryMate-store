import { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { fetchProduct, fetchProducts, fetchSizeRecommendation } from '../api/products.js';
import GarmentTray from '../components/fitting/GarmentTray.jsx';
import LiveMirror from '../components/fitting/LiveMirror.jsx';
import WornPanel from '../components/fitting/WornPanel.jsx';
import TryOnModal from '../components/products/TryOnModal.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import { fitScales } from '../lib/fitting/fit.js';

const DRAG_THRESHOLD_PX = 6;

// /fitting-room?product=<slug>&color=<name>
// A live camera mirror: drag clothes onto yourself, change colour and size, see the fit.
export default function FittingRoomPage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const mirrorRef = useRef(null);
  const dragRef = useRef(null);

  const measurements = user?.fitProfile?.measurements ?? null;
  const hasProfile = Boolean(measurements);
  const products = useApi((signal) => fetchProducts({ limit: 48, sort: 'name' }, { signal }), [user?._id ?? null]);

  // What's being worn: { product (full), colorIndex, chosenSize }. `undefined` = the shopper
  // hasn't changed anything yet, so the garment from the link (?product=) is shown.
  const [wornState, setWorn] = useState(undefined);
  const [drag, setDrag] = useState(null); // { product, x, y, over } while dragging
  const [adding, setAdding] = useState(false);
  const [tryOnPhoto, setTryOnPhoto] = useState(null);

  // ---- wearing a garment -------------------------------------------------------------------
  async function wear(card, colorName) {
    try {
      // The tray only has card fields; the fit needs the size chart and stock
      const product = await fetchProduct(card.slug);
      const byName = product.colors.findIndex((c) => c.name === colorName);
      const suiting = product.colors.findIndex((c) => product.suitingColors?.includes(c.name));
      setWorn({ product, colorIndex: byName >= 0 ? byName : Math.max(0, suiting), chosenSize: null });
    } catch (err) {
      toast.error(err.userMessage ?? 'Could not load that garment.');
    }
  }

  // Coming from a product page (?product=<slug>&color=<name>): that garment is on from the start
  const initialSlug = searchParams.get('product');
  const initialColor = searchParams.get('color');
  const initial = useApi(
    (signal) => (initialSlug ? fetchProduct(initialSlug, { signal }) : Promise.resolve(null)),
    [initialSlug],
  );
  const initialWorn = useMemo(() => {
    if (!initial.data) return null;
    const index = initial.data.colors.findIndex((c) => c.name === initialColor);
    return { product: initial.data, colorIndex: Math.max(0, index), chosenSize: null };
  }, [initial.data, initialColor]);
  const worn = wornState === undefined ? initialWorn : wornState;

  // ---- size + fit -------------------------------------------------------------------------------
  const recommendation = useApi(
    (signal) => (worn && hasProfile ? fetchSizeRecommendation(worn.product._id, { signal }) : Promise.resolve(null)),
    [worn?.product._id ?? null, hasProfile, user?.fitPreference ?? null, user?.fitProfile?.updatedAt ?? null],
  );

  const product = worn?.product;
  const inStock = (s) => (product?.stock?.[s] ?? 0) > 0;
  const recommended = recommendation.data?.recommendedSize;
  const firstInStock = product ? Object.keys(product.sizeChart ?? {}).find(inStock) : null;
  const size = worn?.chosenSize ?? (recommended && inStock(recommended) ? recommended : firstInStock) ?? null;
  const color = product?.colors[worn.colorIndex];

  const scales = useMemo(
    () => (measurements && product && size ? fitScales(product.sizeChart[size], measurements) : { width: 1, length: 1, known: false }),
    [measurements, product, size],
  );
  const garment = useMemo(
    () =>
      product
        ? {
            type: product.type,
            hex: color.hex,
            // Shirts have long sleeves, and so does anything called "long sleeve" (e.g. a henley tee)
            longSleeves: product.type === 'shirt' || /long[\s-]?sleeve/i.test(product.name),
            overlayImageUrl: product.overlayImageUrl,
          }
        : null,
    [product, color],
  );

  // ---- drag and drop (mouse / pen) ----------------------------------------------------------------
  function isOverMirror(x, y) {
    const box = mirrorRef.current?.element?.getBoundingClientRect();
    return Boolean(box) && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  }

  function startDrag(card, event) {
    const info = { x0: event.clientX, y0: event.clientY, active: false, suppressClick: false };
    dragRef.current = info;
    const move = (e) => {
      if (!info.active && Math.hypot(e.clientX - info.x0, e.clientY - info.y0) < DRAG_THRESHOLD_PX) return;
      info.active = true;
      setDrag({ product: card, x: e.clientX, y: e.clientY, over: isOverMirror(e.clientX, e.clientY) });
    };
    const up = (e) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (info.active) {
        info.suppressClick = true; // this was a drag, not a click
        if (isOverMirror(e.clientX, e.clientY)) wear(card);
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  function handleTrayClick(card) {
    if (dragRef.current?.suppressClick) {
      dragRef.current = null;
      return;
    }
    wear(card);
  }

  // ---- actions ------------------------------------------------------------------------------------------
  function requireLogin(message) {
    toast(message, { icon: '🔒' });
    navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
  }

  async function handleAddToCart() {
    if (!user) return requireLogin('Log in to add items to your cart.');
    if (!size) return toast.error('This garment is sold out.');
    setAdding(true);
    try {
      await addItem({ productId: product._id, size, color: color.name, qty: 1 });
      toast.success(`Added ${product.name} (${color.name}, ${size}) to your cart.`);
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setAdding(false);
    }
  }

  async function handleMakeRealistic() {
    if (!user) return requireLogin('Log in to create a realistic try-on.');
    try {
      setTryOnPhoto(await mirrorRef.current.capture());
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Live fitting room</h1>
        <p className="mt-2 max-w-3xl text-gray-600">
          Drag clothes onto yourself in the live camera, switch colours and sizes, and see how they fit your
          measurements. The camera runs only on your device; nothing is recorded or uploaded.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <LiveMirror ref={mirrorRef} garment={garment} scales={scales} highlight={Boolean(drag)}>
            {garment && (
              <>
                <button
                  type="button"
                  onClick={handleMakeRealistic}
                  className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-light"
                  title="Takes a snapshot and creates a photo-realistic try-on with AI"
                >
                  ✨ Make it realistic
                </button>
                <button
                  type="button"
                  onClick={() => setWorn(null)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Take off
                </button>
              </>
            )}
          </LiveMirror>
          <p className="mt-3 text-xs text-gray-500">
            Tips: good light, plain background, stand 1.5–2 m away with your shoulders and hips in view. "Make it
            realistic" sends one snapshot to our AI try-on (it is not stored).
          </p>
        </div>

        <div className="space-y-6">
          {product ? (
            <WornPanel
              product={product}
              colorIndex={worn.colorIndex}
              onColor={(colorIndex) => setWorn({ ...worn, colorIndex })}
              size={size}
              onSize={(chosenSize) => setWorn({ ...worn, chosenSize })}
              recommendation={recommendation}
              scales={scales}
              hasProfile={hasProfile}
              loggedIn={Boolean(user)}
              onAddToCart={handleAddToCart}
              adding={adding}
              onTakeOff={() => setWorn(null)}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 p-5 text-sm text-gray-600">
              Nothing on yet. Drag a garment from below onto the mirror.
              {!hasProfile && (
                <>
                  {' '}
                  <Link to="/fit-profile" className="font-semibold text-brand underline">
                    Scan your body
                  </Link>{' '}
                  first to see real size differences.
                </>
              )}
            </div>
          )}

          <GarmentTray
            products={products.data?.items ?? []}
            loading={products.loading && !products.data}
            wornId={product?._id}
            onWear={handleTrayClick}
            onDragStart={startDrag}
          />
        </div>
      </div>

      {/* The garment following the pointer while dragging */}
      {drag && (
        <div
          className="pointer-events-none fixed z-50 w-24 -translate-x-1/2 -translate-y-1/2 rotate-3 opacity-90 shadow-2xl"
          style={{ left: drag.x, top: drag.y }}
        >
          <img src={drag.product.images[0]} alt="" className="aspect-[3/4] w-full rounded-lg object-cover" />
          {drag.over && (
            <span className="absolute inset-x-0 -bottom-6 text-center text-xs font-semibold text-emerald-700">Release to wear</span>
          )}
        </div>
      )}

      {tryOnPhoto && product && (
        <TryOnModal product={product} color={color} initialPhoto={tryOnPhoto} onClose={() => setTryOnPhoto(null)} />
      )}
    </div>
  );
}
