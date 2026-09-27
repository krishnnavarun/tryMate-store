import { discountPercent, formatPrice } from '../../utils/format.js';

// Shows the price, or the discount price with the original struck through.
export default function Price({ price, discountPrice, size = 'md' }) {
  const off = discountPercent(price, discountPrice);
  const main = size === 'lg' ? 'text-2xl' : 'text-[15px]';

  if (!off) {
    return <p className={`${main} font-semibold text-ink tabular-nums`}>{formatPrice(price)}</p>;
  }

  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular-nums">
      <span className={`${main} font-semibold text-ink`}>{formatPrice(discountPrice)}</span>
      <span className="text-sm text-gray-500 line-through">{formatPrice(price)}</span>
      <span className="text-xs font-semibold tracking-wide text-red-600">−{off}%</span>
    </p>
  );
}
