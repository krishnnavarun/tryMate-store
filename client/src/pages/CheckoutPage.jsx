import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate } from 'react-router';
import { createOrder, fetchOrders } from '../api/orders.js';
import CheckoutSteps from '../components/orders/CheckoutSteps.jsx';
import FormField, { SubmitButton } from '../components/ui/FormField.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useApi } from '../hooks/useApi.js';
import { useCart } from '../hooks/useCart.js';
import { formatPrice } from '../utils/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const ADDRESS_FIELDS = ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country'];

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, loaded, refresh } = useCart();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  usePageTitle('Checkout');
  // The address from the last order, to save typing it again
  const orders = useApi((signal) => fetchOrders({ signal }), []);
  const [useSaved, setUseSaved] = useState(true);
  const saved = useSaved ? (orders.data?.[0]?.shippingAddress ?? null) : null;

  // Fresh prices and stock before the customer confirms
  useEffect(() => {
    refresh().catch((err) => toast.error(err.userMessage));
  }, [refresh]);

  if (!loaded || orders.loading) return <Spinner className="py-24" />;
  // Nothing to check out (unless we just placed the order and are navigating away)
  if (cart.items.length === 0 && !placing) return <Navigate to="/cart" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const shippingAddress = Object.fromEntries(
      ADDRESS_FIELDS.map((field) => [field, String(form.get(field) ?? '').trim()]),
    );
    if (!shippingAddress.line2) delete shippingAddress.line2;

    setPlacing(true);
    try {
      const order = await createOrder(shippingAddress);
      navigate(`/orders/${order._id}`, { replace: true, state: { justPlaced: true } });
      await refresh(); // the server emptied the cart
    } catch (err) {
      toast.error(err.userMessage);
      setPlacing(false);
      // Stock may have changed: reload the cart so the numbers are current
      if (err.errorCode === 'OUT_OF_STOCK') refresh().catch(() => {});
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <CheckoutSteps current={2} />
      <p className="eyebrow mt-8">Almost yours</p>
      <h1 className="heading-display mt-3 text-5xl sm:text-6xl">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="heading-display text-3xl">Shipping address</h2>
          {saved && (
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
              We&rsquo;ve filled in the address from your last order.
              <button
                type="button"
                onClick={() => setUseSaved(false)}
                className="link-underline text-[11px] font-semibold tracking-[0.14em] text-alabaster uppercase"
              >
                Start with an empty form
              </button>
            </p>
          )}
          {/* key: switching between the saved address and an empty form resets the fields */}
          <div key={saved ? 'saved' : 'empty'} className="mt-5 grid gap-5 sm:grid-cols-2">
            <FormField
              label="Full name"
              name="fullName"
              required
              maxLength={80}
              defaultValue={saved?.fullName ?? user?.name}
              autoComplete="name"
            />
            <FormField
              label="Phone"
              name="phone"
              type="tel"
              required
              minLength={7}
              maxLength={20}
              defaultValue={saved?.phone}
              autoComplete="tel"
              hint="Only for delivery updates."
            />
            <FormField
              label="Address"
              name="line1"
              required
              maxLength={120}
              defaultValue={saved?.line1}
              autoComplete="address-line1"
              placeholder="House number and street"
              className="sm:col-span-2"
            />
            <FormField
              label="Apartment, suite, etc. (optional)"
              name="line2"
              maxLength={120}
              defaultValue={saved?.line2}
              autoComplete="address-line2"
              className="sm:col-span-2"
            />
            <FormField label="City" name="city" required maxLength={60} defaultValue={saved?.city} autoComplete="address-level2" />
            <FormField label="State" name="state" required maxLength={60} defaultValue={saved?.state} autoComplete="address-level1" />
            <FormField
              label="PIN / postal code"
              name="postalCode"
              required
              minLength={3}
              maxLength={12}
              inputMode="numeric"
              defaultValue={saved?.postalCode}
              autoComplete="postal-code"
            />
            <FormField
              label="Country"
              name="country"
              required
              maxLength={60}
              defaultValue={saved?.country ?? 'India'}
              autoComplete="country-name"
            />
          </div>

          <h2 className="heading-display mt-12 text-3xl">Payment</h2>
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            This is a demo store: no payment is taken and nothing will be shipped. Placing the order just records it
            in your order history.
          </p>
        </section>

        <aside className="h-fit rounded-[28px] bg-onyx p-7 lg:sticky lg:top-32">
          <h2 className="heading-display text-3xl">Your order</h2>
          <ul className="mt-4 space-y-3">
            {cart.items.map((item) => (
              <li key={item._id} className="flex justify-between gap-3 text-sm">
                <span className="text-gray-700">
                  {item.product.name}
                  <span className="block text-xs text-gray-500">
                    {item.color} · {item.size} · Qty {item.qty}
                  </span>
                </span>
                <span className="font-medium">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-between border-t border-smoke pt-5 heading-display text-2xl">
            <span>Total</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
          <SubmitButton loading={placing} loadingText="Placing order…" className="mt-6">
            Place order
          </SubmitButton>
          <Link to="/cart" className="mt-4 block text-center text-[11px] font-semibold tracking-[0.16em] text-alabaster uppercase hover:text-ember">
            Back to cart
          </Link>
        </aside>
      </form>
    </div>
  );
}
