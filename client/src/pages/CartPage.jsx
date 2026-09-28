import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import CheckoutSteps from '../components/orders/CheckoutSteps.jsx';
import ProductImage from '../components/products/ProductImage.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useCart } from '../hooks/useCart.js';
import { formatPrice } from '../utils/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const MAX_QTY = 10;

export default function CartPage() {
  const { cart, loaded, refresh } = useCart();
  usePageTitle('Your cart');

  // Always show fresh prices and stock when the cart page opens
  useEffect(() => {
    refresh().catch((err) => toast.error(err.userMessage));
  }, [refresh]);

  if (!loaded) return <Spinner className="py-24" />;

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <StatusMessage
          title="Your cart is empty"
          message="Find something you like, and we'll keep it here for you."
          action={
            <Link to="/shop" className="btn-primary btn-sm">
              Start shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <CheckoutSteps current={1} />
      <p className="eyebrow mt-8">Your selection</p>
      <h1 className="heading-display mt-3 text-5xl sm:text-6xl">Your cart</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_340px]">
        <ul className="divide-y divide-smoke border-y border-smoke">
          {cart.items.map((item) => (
            <CartLine key={item._id} item={item} />
          ))}
        </ul>

        <aside className="h-fit animate-rise rounded-[28px] bg-onyx p-7 lg:sticky lg:top-32" style={{ animationDelay: '150ms' }}>
          <h2 className="heading-display text-3xl">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Items ({cart.itemCount})</dt>
              <dd className="font-medium">{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Shipping</dt>
              <dd className="font-medium">Free</dd>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-3 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold">{formatPrice(cart.subtotal)}</dd>
            </div>
          </dl>
          {cart.hasStockIssues && (
            <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              Some items don't have enough stock. Lower the quantity or remove them to continue.
            </p>
          )}
          {cart.hasStockIssues ? (
            <span className="mt-7 block w-full cursor-not-allowed rounded-full bg-gray-300 py-3.5 text-center text-sm font-semibold text-noir">
              Checkout
            </span>
          ) : (
            <Link
              to="/checkout"
              className="btn-primary mt-7 w-full py-3.5"
            >
              Checkout
            </Link>
          )}
          <Link to="/shop" className="mt-4 block text-center text-[11px] font-semibold tracking-[0.16em] text-alabaster uppercase hover:text-ember">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

function CartLine({ item }) {
  const { updateQty, removeItem, addItem } = useCart();
  const [busy, setBusy] = useState(false);

  // Offer quantities up to what's in stock (and at least the current qty, so it stays selectable)
  const maxQty = Math.max(1, Math.min(MAX_QTY, Math.max(item.available, item.qty)));

  async function run(action) {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={`flex animate-rise gap-5 py-7 transition-opacity ${busy ? 'opacity-60' : ''}`}>
      <Link
        to={`/products/${item.product.slug}`}
        className="relative block aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl bg-onyx sm:w-28"
      >
        <ProductImage src={item.product.image} alt={item.product.name} name={item.product.name} className="absolute inset-0 h-full w-full" />
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-between gap-4">
          <div>
            <Link to={`/products/${item.product.slug}`} className="heading-display text-2xl leading-tight text-alabaster transition-colors hover:text-ember">
              {item.product.name}
            </Link>
            <p className="mt-1 text-sm text-gray-500">
              {item.color} · Size {item.size}
            </p>
            <p className="mt-1 text-sm text-gray-500">{formatPrice(item.unitPrice)} each</p>
          </div>
          <p className="font-semibold text-gray-900">{formatPrice(item.lineTotal)}</p>
        </div>

        {!item.inStock && (
          <p className="mt-2 text-sm font-medium text-red-600">
            {item.available === 0 ? 'Sold out in this size.' : `Only ${item.available} left.`}
          </p>
        )}

        <div className="mt-auto flex items-center gap-4 pt-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Qty
            <select
              value={item.qty}
              disabled={busy}
              onChange={(e) => run(() => updateQty(item._id, Number(e.target.value)))}
              className="rounded-full border border-smoke bg-coal px-3 py-1 text-sm text-alabaster focus:border-alabaster focus:outline-none"
            >
              {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await removeItem(item._id);
                // A way back from an accidental tap
                toast(
                  (t) => (
                    <span className="flex items-center gap-3">
                      Removed {item.product.name}.
                      <button
                        type="button"
                        onClick={() => {
                          toast.dismiss(t.id);
                          addItem({ productId: item.product._id, size: item.size, color: item.color, qty: item.qty }).catch(
                            (err) => toast.error(err.userMessage),
                          );
                        }}
                        className="font-semibold text-ember-light underline"
                      >
                        Undo
                      </button>
                    </span>
                  ),
                  { duration: 6000 },
                );
              })
            }
            className="text-sm font-medium text-gray-500 hover:text-red-600"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
