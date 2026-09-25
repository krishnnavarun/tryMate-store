import { discountPercent, formatPrice } from '../../utils/format.js';

// Shows the price, or the discount price with the original struck through.
export default function Price({ price, discountPrice, size = 'md' }) {
  const off = discountPercent(price, discountPrice);
  const main = size === 'lg' ? 'text-2xl' : 'text-base';

  if (!off) {
    return <p className={`${main} font-semibold text-gray-900`}>{formatPrice(price)}</p>;
  }

  return (
    <p className="flex flex-wrap items-baseline gap-2">
      <span className={`${main} font-semibold text-gray-900`}>{formatPrice(discountPrice)}</span>
      <span className="text-sm text-gray-400 line-through">{formatPrice(price)}</span>
      <span className="text-sm font-semibold text-brand-accent">{off}% off</span>
    </p>
  );
}
