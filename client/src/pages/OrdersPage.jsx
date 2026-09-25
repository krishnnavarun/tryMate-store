import { Link } from 'react-router';
import { fetchOrders } from '../api/orders.js';
import OrderStatusBadge from '../components/orders/OrderStatusBadge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import { useApi } from '../hooks/useApi.js';
import { formatDate, formatPrice, shortId } from '../utils/format.js';

export default function OrdersPage() {
  const { data: orders, loading, error, reload } = useApi((signal) => fetchOrders({ signal }), []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your orders</h1>

      <div className="mt-8">
        {loading ? (
          <Spinner className="py-16" />
        ) : error ? (
          <StatusMessage
            title="Couldn't load your orders"
            message={error.userMessage}
            action={
              <button type="button" onClick={reload} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white">
                Try again
              </button>
            }
          />
        ) : orders.length === 0 ? (
          <StatusMessage
            title="No orders yet"
            message="When you place an order, it will show up here."
            action={
              <Link to="/shop" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white">
                Start shopping
              </Link>
            }
          />
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order._id}>
                <Link
                  to={`/orders/${order._id}`}
                  className="block rounded-xl border border-gray-200 p-5 transition hover:border-gray-400"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">Order #{shortId(order._id)}</p>
                      <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="flex -space-x-3">
                      {order.items.slice(0, 4).map((item, i) => (
                        <img
                          key={i}
                          src={item.image}
                          alt={item.name}
                          className="h-14 w-11 rounded-md border-2 border-white object-cover"
                        />
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
