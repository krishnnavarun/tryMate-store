import { Link, useLocation, useParams } from 'react-router';
import { fetchOrder } from '../api/orders.js';
import OrderStatusBadge from '../components/orders/OrderStatusBadge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import { useApi } from '../hooks/useApi.js';
import { formatDate, formatPrice, shortId } from '../utils/format.js';

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const justPlaced = location.state?.justPlaced === true;
  const { data: order, loading, error } = useApi((signal) => fetchOrder(id, { signal }), [id]);

  if (loading) return <Spinner className="py-24" />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <StatusMessage
          title="Order not found"
          message={error.userMessage}
          action={
            <Link to="/orders" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white">
              Your orders
            </Link>
          }
        />
      </div>
    );
  }

  const address = order.shippingAddress;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {justPlaced && (
        <div className="mb-8 rounded-2xl bg-green-50 p-6 text-green-800">
          <h2 className="text-lg font-semibold">Thank you! Your order is placed.</h2>
          <p className="mt-1 text-sm">This is a demo, so nothing was charged and nothing will ship.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Order #{shortId(order._id)}</h1>
          <p className="text-sm text-gray-500">Placed {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_260px]">
        <ul className="divide-y divide-gray-200 border-y border-gray-200">
          {order.items.map((item, i) => (
            <li key={i} className="flex gap-4 py-4">
              <img src={item.image} alt={item.name} className="h-24 w-18 rounded-lg object-cover" />
              <div className="flex flex-1 justify-between gap-4">
                <div>
                  {item.slug ? (
                    <Link to={`/products/${item.slug}`} className="font-medium text-gray-900 hover:text-brand-accent">
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
          <Link to="/orders" className="block font-medium text-brand hover:underline">
            ← All orders
          </Link>
        </aside>
      </div>
    </div>
  );
}
