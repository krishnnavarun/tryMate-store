import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useCart } from '../hooks/useCart.js';
import { formatPrice } from '../utils/format.js';

const MAX_QTY = 10;

export default function CartPage() {
  const { cart, loaded, refresh } = useCart();

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
            <Link to="/shop" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white">
              Start shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your cart</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-gray-200 border-y border-gray-200">
          {cart.items.map((item) => (
            <CartLine key={item._id} item={item} />
          ))}
        </ul>

        <aside className="h-fit rounded-2xl bg-cream p-6">
          <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>
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
            <span className="mt-6 block w-full cursor-not-allowed rounded-lg bg-gray-300 py-3 text-center text-sm font-semibold text-white">
              Checkout
            </span>
          ) : (
            <Link
              to="/checkout"
              className="mt-6 block w-full rounded-lg bg-brand py-3 text-center text-sm font-semibold text-white hover:bg-brand-light"
            >
              Checkout
            </Link>
          )}
          <Link to="/shop" className="mt-3 block text-center text-sm font-medium text-brand hover:underline">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

function CartLine({ item }) {
  const { updateQty, removeItem } = useCart();
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
    <li className={`flex gap-4 py-6 ${busy ? 'opacity-60' : ''}`}>
      <Link to={`/products/${item.product.slug}`} className="w-24 shrink-0 sm:w-28">
        <img src={item.product.image} alt={item.product.name} className="aspect-[3/4] w-full rounded-lg object-cover" />
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-between gap-4">
          <div>
            <Link to={`/products/${item.product.slug}`} className="font-medium text-gray-900 hover:text-brand-accent">
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
              className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
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
            onClick={() => run(() => removeItem(item._id))}
            className="text-sm font-medium text-gray-500 hover:text-red-600"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
