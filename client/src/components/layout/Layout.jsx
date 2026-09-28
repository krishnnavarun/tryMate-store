import { useEffect, useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router';
import ErrorBoundary from '../ui/ErrorBoundary.jsx';
import Footer from './Footer.jsx';
import Header from './Header.jsx';

// Scroll back to `y` once the page is tall enough (its content may still be loading)
function restoreScroll(y) {
  let frame;
  let tries = 0;
  const attempt = () => {
    const reachable = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.min(y, reachable));
    if (reachable < y && tries++ < 90) frame = requestAnimationFrame(attempt); // up to ~1.5 s
  };
  attempt();
  return () => cancelAnimationFrame(frame);
}

export default function Layout() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const { pathname } = location;
  const mainRef = useRef(null);
  const shownPath = useRef(pathname);
  // Scroll position of every history entry, so Back/Forward return to where you were
  const scrollPositions = useRef(new Map());
  const current = useRef({ key: location.key, type: navigationType });

  useLayoutEffect(() => {
    current.current = { key: location.key, type: navigationType };
  }, [location.key, navigationType]);

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'; // we do it ourselves
    let frame;
    const remember = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => scrollPositions.current.set(current.current.key, window.scrollY));
    };
    window.addEventListener('scroll', remember, { passive: true });
    return () => {
      window.removeEventListener('scroll', remember);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    // Back/Forward: return to the old position. A new page: start at the top.
    const saved = current.current.type === 'POP' ? scrollPositions.current.get(current.current.key) : undefined;
    let cancelRestore;
    if (saved) cancelRestore = restoreScroll(saved);
    else window.scrollTo(0, 0);

    // After a navigation, move keyboard / screen-reader focus to the new page's content, as a
    // full page load would. Not on the first page: there, focus starts at the skip link.
    // (Compared with the previous path, not a "first run" flag: StrictMode runs effects twice.)
    if (shownPath.current !== pathname) {
      shownPath.current = pathname;
      mainRef.current?.focus({ preventScroll: true });
    }
    return cancelRestore;
  }, [pathname]);

  return (
    <div className="relative isolate flex min-h-screen flex-col">
      {/* The signature light: Racing Red from the top-left, behind the header (it scrolls
          away with the page), a faint cream haze from the bottom-right of the window, and
          a film grain over both. All behind the content, all decoration. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1100px] overflow-hidden">
        <div className="glow-red absolute -inset-[6%] origin-top-left animate-drift" />
      </div>
      <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 -z-10">
        <div className="glow-cream absolute inset-0 opacity-[0.13]" />
      </div>
      {/* The first thing Tab reaches: jump past the navigation */}
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault(); // focus the content without adding #main to the URL
          mainRef.current?.focus();
        }}
        className="btn-primary btn-sm sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
      >
        Skip to content
      </a>
      <Header />
      {/* key: each new page (not a filter change on the same page) rises in gently,
          and a crashed page recovers when you navigate away */}
      <main id="main" ref={mainRef} tabIndex={-1} key={pathname} className="flex-1 animate-page outline-none">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
