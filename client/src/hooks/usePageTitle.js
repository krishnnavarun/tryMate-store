import { useEffect } from 'react';

const SITE = 'tryMate';
export const DEFAULT_TITLE = `${SITE} · Clothes cut to your measure`;

// Sets the browser tab title for the current page: "Classic Oxford Shirt · tryMate".
// Screen readers announce it on navigation, so every page should have its own (WCAG 2.4.2).
// Pass nothing (or null while loading) for the site's default title.
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : DEFAULT_TITLE;
  }, [title]);
}
