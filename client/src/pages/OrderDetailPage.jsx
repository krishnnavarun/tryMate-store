import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useParams } from 'react-router';
import { cancelOrder, fetchOrder } from '../api/orders.js';
import OrderStatusBadge from '../components/orders/OrderStatusBadge.jsx';
import CheckoutSteps from '../components/orders/CheckoutSteps.jsx';
import ProductImage from '../components/products/ProductImage.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { formatDate, formatPrice, shortId } from '../utils/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const justPlaced = location.state?.justPlaced === true;
  const { data: order, loading, error, reload } = useApi((signal) => fetchOrder(id, { signal }), [id]);
  const { user } = useAuth();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  usePageTitle(order ? `Order #${shortId(order._id)}` : error ? 'Order not found' : null);

  if (loading && !order) return <Spinner className="py-24" />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <StatusMessage
          title="Order not found"
          message={error.userMessage}
          action={
            <Link to="/orders" className="btn-primary btn-sm">
              Your orders
            </Link>
          }
        />
      </div>
    );
  }

  const address = order.shippingAddress;
  // Customers can cancel their own order until it ships (admins use /admin/orders)
  const canCancel = order.status === 'placed' && String(order.user) === String(user?._id);

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelOrder(order._id);
      toast.success('Your order is cancelled. Nothing was charged.');
      setConfirmCancel(false);
      reload();
    } catch (err) {
      toast.error(err.userMessage);
      // It shipped (or was cancelled) since this page loaded: show where it is now
      if (err.errorCode === 'CANNOT_CANCEL') {
        setConfirmCancel(false);
        reload();
      }
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {justPlaced && <CheckoutSteps current={3} />}
      {justPlaced && (
        <div className="mt-8 mb-10 flex animate-rise items-center gap-5 rounded-[28px] bg-emerald-50 p-7 text-emerald-900">
          {/* A check mark that draws itself */}
          <svg className="h-12 w-12 shrink-0 text-emerald-700" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="24" cy="24" r="22" strokeDasharray="139" className="animate-draw" style={{ '--dash': 139 }} />
            <path d="M15 24.5l6 6 12-13" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" className="animate-draw" style={{ '--dash': 30, animationDelay: '700ms' }} />
          </svg>
          <div>
            <h2 className="heading-display text-3xl text-emerald-900">Thank you, your order is placed.</h2>
            <p className="mt-1 text-sm">This is a demo, so nothing was charged and nothing will ship.</p>
            <Link to="/shop" className="btn-primary btn-sm mt-4">
              Continue shopping
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-display text-5xl">Order #{shortId(order._id)}</h1>
          <p className="text-sm text-gray-500">Placed {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_260px]">
        <ul className="divide-y divide-smoke border-y border-smoke">
          {order.items.map((item, i) => (
            <li key={i} className="flex gap-4 py-4">
              <span className="relative block h-24 w-18 shrink-0 overflow-hidden rounded-xl bg-onyx">
                <ProductImage src={item.image} alt={item.name} name={item.name} className="absolute inset-0 h-full w-full" />
              </span>
              <div className="flex flex-1 justify-between gap-4">
                <div>
                  {item.slug ? (
                    <Link to={`/products/${item.slug}`} className="font-medium text-gray-900 hover:text-ember">
                      {item.name}
                    </Link>
                  ) : (
                    <p className="font-medium text-gray-900">{item.name}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {item.color} · Size {item.size} · Qty {item.qty}
                  </p>
                </div>
                <p className="font-medium">{formatPrice(item.price * item.qty)}</p>
              </div>
            </li>
          ))}
        </ul>

        <aside className="space-y-6 text-sm">
          <div>
            <h2 className="font-semibold text-gray-900">Shipping to</h2>
            <address className="mt-2 not-italic leading-relaxed text-gray-600">
              {address.fullName}
              <br />
              {address.line1}
              {address.line2 && (
                <>
                  <br />
                  {address.line2}
                </>
              )}
              <br />
              {address.city}, {address.state} {address.postalCode}
              <br />
              {address.country}
              <br />
              {address.phone}
            </address>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-4 text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          {order.status === 'cancelled' && (
            <p className="rounded-2xl bg-gray-100 p-4 text-gray-600">This order was cancelled. Nothing was charged.</p>
          )}
          {canCancel &&
            (confirmCancel ? (
              <div className="space-y-3 rounded-2xl bg-onyx p-4">
                <p className="text-gray-700">Cancel this order? You can order again any time.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="rounded-full bg-red-500 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-red-400 disabled:opacity-60"
                  >
                    {cancelling ? 'Cancelling…' : 'Yes, cancel it'}
                  </button>
                  <button type="button" onClick={() => setConfirmCancel(false)} className="px-3 py-1.5 font-semibold">
                    Keep it
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="link-underline block text-[11px] font-semibold tracking-[0.16em] text-gray-600 uppercase hover:text-red-700"
              >
                Cancel order
              </button>
            ))}
          <Link to="/orders" className="link-underline inline-block text-[11px] font-semibold tracking-[0.16em] text-alabaster uppercase">
            ← All orders
          </Link>
        </aside>
      </div>
    </div>
  );
}
