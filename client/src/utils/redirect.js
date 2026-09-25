// Only allow redirects to pages on this site. Without this check, a link like
// /login?redirect=https://evil.example would send users to another site after login.
export function safeRedirect(value, fallback = '/') {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
}
