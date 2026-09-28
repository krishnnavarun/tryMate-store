import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router';
import { fetchAllOrders, updateOrderStatus } from '../../api/admin.js';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import { useApi } from '../../hooks/useApi.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { formatDate, formatPrice, shortId } from '../../utils/format.js';

const FILTERS = [
  ['', 'All'],
  ['placed', 'Placed'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
];

// The next steps an admin can take from each status (the server checks them too)
const ACTIONS = {
  placed: [
    ['shipped', 'Mark shipped'],
    ['cancelled', 'Cancel'],
  ],
  shipped: [['delivered', 'Mark delivered']],
  delivered: [],
  cancelled: [],
};

// /admin/orders: every order, newest first; move them along placed → shipped → delivered
export default function AdminOrdersPage() {
  usePageTitle('Admin · Orders');
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const { data: orders, loading, error, reload } = useApi(
    (signal) => fetchAllOrders({ status: status || undefined, signal }),
    [status],
  );
  const [busyId, setBusyId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);

  async function change(order, next) {
    setBusyId(order._id);
    try {
      await updateOrderStatus(order._id, next);
      toast.success(
        next === 'cancelled'
          ? `Order #${shortId(order._id)} cancelled; its items are back in stock.`
          : `Order #${shortId(order._id)} marked ${next}.`,
      );
      setConfirmCancel(null);
      reload();
    } catch (err) {
      toast.error(err.userMessage);
      // Someone else changed it first: show the order's real status
      if (err.errorCode === 'INVALID_STATUS_CHANGE') {
        setConfirmCancel(null);
        reload();
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="eyebrow">Admin</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="heading-display text-5xl">Orders</h1>
        <Link to="/admin/products" className="link-underline text-[11px] font-semibold tracking-[0.16em] text-ink uppercase">
          Products
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {FILTERS.map(([value, label]) => (
          <button
            key={label}
            type="button"
            aria-pressed={status === value}
            onClick={() => setSearchParams(value ? { status: value } : {})}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors duration-300 ${
              status === value ? 'border-ink bg-ink text-ivory' : 'border-sand bg-white text-gray-700 hover:border-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {loading && !orders ? (
          <Spinner className="py-16" />
        ) : error ? (
          <StatusMessage
            title="Couldn't load orders"
            message={error.userMessage}
            action={
              <button type="button" onClick={reload} className="btn-primary btn-sm">
                Try again
              </button>
            }
          />
        ) : orders.length === 0 ? (
          <StatusMessage title="No orders here" message={status ? `There are no ${status} orders.` : 'No one has ordered yet.'} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-sand bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-bone text-[11px] tracking-[0.14em] text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/70">
                {orders.map((order) => (
                  <tr key={order._id} className={busyId === order._id ? 'opacity-60' : ''}>
                    <td className="px-4 py-3">
                      <Link to={`/orders/${order._id}`} className="font-semibold text-ink hover:text-brass">
                        #{shortId(order._id)}
                      </Link>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink">{order.user?.name ?? 'Deleted account'}</p>
                      <p className="text-xs text-gray-500">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.items.reduce((n, i) => n + i.qty, 0)}</td>
                    <td className="px-4 py-3 font-semibold text-ink tabular-nums">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {confirmCancel === order._id ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-gray-600">Cancel and restock?</span>
                          <button
                            type="button"
                            disabled={busyId === order._id}
                            onClick={() => change(order, 'cancelled')}
                            className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-ivory hover:bg-red-700 disabled:opacity-60"
                          >
                            Yes, cancel
                          </button>
                          <button type="button" onClick={() => setConfirmCancel(null)} className="px-2 py-1 text-xs font-semibold">
                            No
                          </button>
                        </span>
                      ) : (
                        <span className="inline-flex gap-2">
                          {ACTIONS[order.status].map(([next, label]) => (
                            <button
                              key={next}
                              type="button"
                              disabled={busyId === order._id}
                              onClick={() => (next === 'cancelled' ? setConfirmCancel(order._id) : change(order, next))}
                              className={
                                next === 'cancelled'
                                  ? 'rounded-full px-3 py-1 text-xs font-semibold text-gray-600 hover:text-red-700'
                                  : 'btn-secondary px-3 py-1 text-xs'
                              }
                            >
                              {label}
                            </button>
                          ))}
                          {ACTIONS[order.status].length === 0 && <span className="text-xs text-gray-500">No further steps</span>}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
