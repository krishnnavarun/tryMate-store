// Size recommendations are computed on request, never stored (PROJECT_SPEC.md §6).
// This keeps them in memory for a few minutes so browsing back and forth between products
// doesn't call the AI service every time. It's cleared for a user whenever their fit
// profile or fit preference changes, so a stale recommendation is never shown.

const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 5000;
const cache = new Map(); // key → { value, expires }

const keyFor = (userId, productId, fitPreference, productUpdatedAt) =>
  `${userId}|${productId}|${fitPreference}|${new Date(productUpdatedAt).getTime()}`;

export function getCachedRecommendation(userId, productId, fitPreference, productUpdatedAt) {
  const key = keyFor(userId, productId, fitPreference, productUpdatedAt);
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCachedRecommendation(userId, productId, fitPreference, productUpdatedAt, value) {
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value); // drop the oldest
  cache.set(keyFor(userId, productId, fitPreference, productUpdatedAt), { value, expires: Date.now() + TTL_MS });
}

export function clearRecommendationCache(userId) {
  const prefix = `${userId}|`;
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}
