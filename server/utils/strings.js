// "Classic Oxford Shirt!" → "classic-oxford-shirt"
export function slugify(text) {
  return String(text)
    .normalize('NFKD') // split accented letters: "é" → "e" + accent
    .replace(/[̀-ͯ]/g, '') // drop the accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Escape user input before putting it inside a RegExp, so "a.b" matches "a.b" literally.
export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
