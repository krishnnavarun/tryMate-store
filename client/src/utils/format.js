// Prices are stored in INR. Change these two constants to switch currency display.
const CURRENCY = 'INR';
const LOCALE = 'en-IN';

const priceFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

export function formatPrice(amount) {
  return priceFormatter.format(amount);
}

export const TYPE_LABELS = {
  shirt: 'Shirts',
  tshirt: 'T-shirts',
  polo: 'Polos',
};

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });

export function formatDate(value) {
  return dateFormatter.format(new Date(value));
}

// Last 8 characters of a MongoDB id, upper-cased: a readable order number
export function shortId(id) {
  return String(id).slice(-8).toUpperCase();
}

// % off, rounded: 1999 → 1599 = 20
export function discountPercent(price, discountPrice) {
  if (discountPrice == null || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}
