const STYLES = {
  placed: 'bg-bone text-ink',
  shipped: 'bg-amber-50 text-amber-800',
  delivered: 'bg-emerald-50 text-emerald-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function OrderStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-semibold tracking-[0.16em] uppercase ${STYLES[status] ?? STYLES.placed}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
