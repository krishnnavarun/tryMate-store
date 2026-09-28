import { Link } from 'react-router';
import { fetchOrders } from '../api/orders.js';
import OrderStatusBadge from '../components/orders/OrderStatusBadge.jsx';
import ProductImage from '../components/products/ProductImage.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import { useApi } from '../hooks/useApi.js';
import { formatDate, formatPrice, shortId } from '../utils/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function OrdersPage() {
  const { data: orders, loading, error, reload } = useApi((signal) => fetchOrders({ signal }), []);
  usePageTitle('Your orders');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="eyebrow">Account</p>
      <h1 className="heading-display mt-3 text-5xl sm:text-6xl">Your orders</h1>

      <div className="mt-8">
        {loading ? (
          <Spinner className="py-16" />
        ) : error ? (
          <StatusMessage
            title="Couldn't load your orders"
            message={error.userMessage}
            action={
              <button type="button" onClick={reload} className="btn-primary btn-sm">
                Try again
              </button>
            }
          />
        ) : orders.length === 0 ? (
          <StatusMessage
            title="No orders yet"
            message="When you place an order, it will show up here."
            action={
              <Link to="/shop" className="btn-primary btn-sm">
                Start shopping
              </Link>
            }
          />
        ) : (
          <ul className="space-y-4">
            {orders.map((order, i) => (
              <li key={order._id} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                <Link
                  to={`/orders/${order._id}`}
                  className="block rounded-2xl border border-smoke bg-coal p-6 transition duration-500 ease-out-expo hover:-translate-y-0.5 hover:border-alabaster/40 hover:shadow-[0_20px_40px_-24px_rgb(28_26_23/0.3)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="heading-display text-2xl text-alabaster">Order #{shortId(order._id)}</p>
                      <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="flex -space-x-3">
                      {order.items.slice(0, 4).map((item, i) => (
                        <span key={i} className="relative block h-16 w-12 overflow-hidden rounded-lg border-2 border-noir bg-onyx">
                          <ProductImage src={item.image} alt={item.name} name={item.name} className="absolute inset-0 h-full w-full" />
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.items.reduce((n, i) => n + i.qty, 0)} items ·{' '}
                      <span className="font-semibold text-gray-900">{formatPrice(order.total)}</span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
