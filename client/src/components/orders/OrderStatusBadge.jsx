const STYLES = {
  placed: 'bg-blue-50 text-blue-700',
  shipped: 'bg-amber-50 text-amber-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function OrderStatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STYLES[status] ?? STYLES.placed}`}>
      {status}
    </span>
  );
}
