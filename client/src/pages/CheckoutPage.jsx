import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate } from 'react-router';
import { createOrder } from '../api/orders.js';
import FormField, { SubmitButton } from '../components/ui/FormField.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import { formatPrice } from '../utils/format.js';

const ADDRESS_FIELDS = ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country'];

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, loaded, refresh } = useCart();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  // Fresh prices and stock before the customer confirms
  useEffect(() => {
    refresh().catch((err) => toast.error(err.userMessage));
  }, [refresh]);

  if (!loaded) return <Spinner className="py-24" />;
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
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Shipping address</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" name="fullName" required maxLength={80} defaultValue={user?.name} autoComplete="name" />
            <FormField label="Phone" name="phone" type="tel" required minLength={7} maxLength={20} autoComplete="tel" />
            <FormField label="Address" name="line1" required maxLength={120} autoComplete="address-line1" className="sm:col-span-2" />
            <FormField
              label="Apartment, suite, etc. (optional)"
              name="line2"
              maxLength={120}
              autoComplete="address-line2"
              className="sm:col-span-2"
            />
            <FormField label="City" name="city" required maxLength={60} autoComplete="address-level2" />
            <FormField label="State" name="state" required maxLength={60} autoComplete="address-level1" />
            <FormField label="Postal code" name="postalCode" required minLength={3} maxLength={12} autoComplete="postal-code" />
            <FormField label="Country" name="country" required maxLength={60} defaultValue="India" autoComplete="country-name" />
          </div>

          <h2 className="mt-10 text-lg font-semibold text-gray-900">Payment</h2>
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            This is a demo store: no payment is taken and nothing will be shipped. Placing the order just records it
            in your order history.
          </p>
        </section>

        <aside className="h-fit rounded-2xl bg-cream p-6">
          <h2 className="text-lg font-semibold text-gray-900">Your order</h2>
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
          <div className="mt-4 flex justify-between border-t border-gray-300 pt-4 text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
          <SubmitButton loading={placing} loadingText="Placing order…" className="mt-6">
            Place order
          </SubmitButton>
          <Link to="/cart" className="mt-3 block text-center text-sm font-medium text-brand hover:underline">
            Back to cart
          </Link>
        </aside>
      </form>
    </div>
  );
}
