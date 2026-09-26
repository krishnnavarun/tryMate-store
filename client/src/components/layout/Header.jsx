import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth.js';
import { useCart } from '../../hooks/useCart.js';

const NAV_LINKS = [
  { to: '/shop', label: 'Shop all' },
  { to: '/shop?type=shirt', label: 'Shirts' },
  { to: '/shop?type=tshirt', label: 'T-shirts' },
  { to: '/shop?type=polo', label: 'Polos' },
  { to: '/fitting-room', label: 'Fitting room' },
  { to: '/fit-profile', label: 'My fit' },
];

export function Logo({ light = false }) {
  return (
    <Link to="/" className={`font-display text-[30px] leading-none tracking-tight ${light ? 'text-ivory' : 'text-ink'}`}>
      try<em className={light ? 'text-brass-light' : 'text-brass'}>Mate</em>
    </Link>
  );
}

// True once the page has scrolled a little (for the header's shadow)
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const scrolled = useScrolled();

  // Close the mobile menu whenever the page changes
  const [menuPath, setMenuPath] = useState(location.pathname);
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname);
    setMenuOpen(false);
  }

  async function handleLogout() {
    await logout();
    toast.success('You are logged out.');
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-30">
      {/* A quiet line of reassurance above the navigation */}
      <div className="bg-ink text-ivory/80">
        <p className="mx-auto max-w-7xl truncate px-4 py-2 text-center text-[10.5px] font-medium tracking-[0.22em] uppercase sm:px-6">
          Your size on every piece
          <span className="hidden sm:inline">
            <span className="mx-2 text-brass-light">·</span> Complimentary shipping
            <span className="mx-2 text-brass-light">·</span> Photos never stored
          </span>
        </p>
      </div>

      <div
        className={`border-b bg-ivory/85 backdrop-blur-md transition-[border-color,box-shadow] duration-500 ${
          scrolled ? 'border-sand shadow-[0_8px_30px_-12px_rgb(28_26_23/0.18)]' : 'border-transparent'
        }`}
      >
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="link-underline pb-0.5 text-[11.5px] font-semibold tracking-[0.16em] text-gray-700 uppercase transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            {/* Hide account controls until we know whether the user is logged in (no flicker) */}
            {status === 'ready' &&
              (user ? (
                <AccountMenu name={user.name} isAdmin={user.role === 'admin'} onLogout={handleLogout} />
              ) : (
                <Link
                  to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                  className="link-underline hidden pb-0.5 text-[11.5px] font-semibold tracking-[0.16em] text-gray-700 uppercase hover:text-ink sm:block"
                >
                  Log in
                </Link>
              ))}
            <CartButton />

            {/* Mobile menu button */}
            <button
              type="button"
              className="rounded-full p-2 text-ink lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {menuOpen ? (
                  <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
                ) : (
                  <path strokeLinecap="round" d="M4 8h16M4 16h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="animate-fade border-t border-sand bg-ivory px-4 pt-2 pb-4 lg:hidden">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.to}
                to={link.to}
                className="block animate-rise py-3 font-display text-2xl text-ink"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-sand pt-2">
              {user ? (
                <>
                  <Link to="/orders" className="block py-2.5 text-sm font-medium text-gray-700">
                    Your orders
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin/products" className="block py-2.5 text-sm font-medium text-gray-700">
                      Admin: products
                    </Link>
                  )}
                  <button type="button" onClick={handleLogout} className="block py-2.5 text-sm font-medium text-gray-700">
                    Log out
                  </button>
                </>
              ) : (
                <Link to="/login" className="block py-2.5 text-sm font-medium text-gray-700">
                  Log in
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

function CartButton() {
  const { cart } = useCart();
  const count = cart.itemCount;

  return (
    <Link to="/cart" className="relative rounded-full p-2 text-ink transition-colors hover:text-brass" aria-label={`Cart, ${count} items`}>
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l-1 13H7L6 7zm3 0a3 3 0 016 0" />
      </svg>
      {count > 0 && (
        // key: a new count re-mounts the badge, so it "bumps" each time something is added
        <span
          key={count}
          className="absolute top-0 right-0 flex h-[18px] min-w-[18px] animate-bump items-center justify-center rounded-full bg-brass px-1 text-[10px] font-bold text-ivory"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

function AccountMenu({ name, isAdmin, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking anywhere outside the menu
  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const item = 'block w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-bone hover:text-ink';

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full px-3 py-2 text-[11.5px] font-semibold tracking-[0.16em] text-gray-700 uppercase transition-colors hover:text-ink"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bone font-display text-base tracking-normal text-ink normal-case">
          {name.trim()[0]?.toUpperCase()}
        </span>
        {name.split(' ')[0]}
        <svg className={`h-3 w-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 origin-top-right animate-pop overflow-hidden rounded-2xl border border-sand bg-white py-1.5 shadow-[0_20px_50px_-20px_rgb(28_26_23/0.35)]">
          <Link to="/fit-profile" onClick={() => setOpen(false)} className={item}>
            My fit profile
          </Link>
          <Link to="/orders" onClick={() => setOpen(false)} className={item}>
            Your orders
          </Link>
          {isAdmin && (
            <Link to="/admin/products" onClick={() => setOpen(false)} className={item}>
              Admin: products
            </Link>
          )}
          <div className="my-1 border-t border-sand" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className={item}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
