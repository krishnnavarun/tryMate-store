import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth.js';
import { useCart } from '../../hooks/useCart.js';
import SearchBox from '../ui/SearchBox.jsx';

const NAV_LINKS = [
  { to: '/shop', label: 'Shop all' },
  { to: '/shop?type=shirt', label: 'Shirts' },
  { to: '/shop?type=tshirt', label: 'T-shirts' },
  { to: '/shop?type=polo', label: 'Polos' },
  { to: '/fitting-room', label: 'Fitting room' },
  { to: '/fit-profile', label: 'My fit' },
];

export function Logo() {
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5 text-[19px] leading-none font-semibold tracking-[-0.03em] text-alabaster">
      <LogoMark tone="light" className="h-[18px] w-[18px] transition-[color,transform] duration-700 ease-out-expo group-hover:rotate-45 group-hover:text-racing" />
      tryMate
    </Link>
  );
}

// An eight-armed asterisk. tone="red": Racing Red with a soft glow; tone="light": alabaster
// (the logo, which sits on the red light at the top of every page)
export function LogoMark({ tone = 'red', className = '' }) {
  const colour = tone === 'light' ? 'text-alabaster' : 'text-racing drop-shadow-[0_0_6px_rgb(221_2_0/0.6)]';
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${colour} ${className}`}>
      <path d="M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M18.7 5.3L5.3 18.7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
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
  const [searchOpen, setSearchOpen] = useState(false);
  const searchButtonRef = useRef(null);
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const scrolled = useScrolled();

  const menuButtonRef = useRef(null);

  // Close the mobile menu whenever the page changes
  const [menuPath, setMenuPath] = useState(location.pathname);
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  // Escape closes the search bar and puts focus back on its button
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      setSearchOpen(false);
      searchButtonRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  function search(text) {
    setSearchOpen(false);
    setMenuOpen(false);
    navigate(text ? `/shop?q=${encodeURIComponent(text)}` : '/shop');
  }

  // Escape closes the mobile menu and puts focus back on its button
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  async function handleLogout() {
    await logout();
    toast.success('You are logged out.');
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-30">
      {/* A quiet line of reassurance above the navigation */}
      <div className="border-b border-white/[0.06] text-alabaster/85">
        <p className="mx-auto max-w-7xl truncate px-4 py-2 text-center text-[10.5px] font-medium tracking-[0.24em] uppercase sm:px-6">
          Your size on every piece
          <span className="hidden sm:inline">
            <span aria-hidden="true" className="mx-3 text-racing">
              ✳
            </span>
            Complimentary shipping
            <span aria-hidden="true" className="mx-3 text-racing">
              ✳
            </span>
            Photos never stored
          </span>
        </p>
      </div>

      <div
        className={`border-b transition-[background-color,border-color,box-shadow] duration-500 ${
          scrolled ? 'border-white/[0.07] bg-noir/75 shadow-[0_10px_40px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl' : 'border-transparent'
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
                className="link-underline pb-0.5 text-[11.5px] font-semibold tracking-[0.16em] text-gray-700 uppercase transition-colors hover:text-alabaster"
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
                  className="link-underline hidden pb-0.5 text-[11.5px] font-semibold tracking-[0.16em] text-gray-700 uppercase hover:text-alabaster sm:block"
                >
                  Log in
                </Link>
              ))}
            <button
              ref={searchButtonRef}
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-expanded={searchOpen}
              aria-label={searchOpen ? 'Close search' : 'Search'}
              className="rounded-full p-2 text-alabaster transition-colors hover:text-ember-light"
            >
              <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path strokeLinecap="round" d="M16 16l4.5 4.5" />
              </svg>
            </button>
            <CartButton />

            {/* Mobile menu button */}
            <button
              ref={menuButtonRef}
              type="button"
              className="rounded-full p-2 text-alabaster lg:hidden"
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

        {searchOpen && (
          <div className="animate-fade border-t border-white/[0.07] bg-noir/95 backdrop-blur-xl">
            <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
              <SearchBox autoFocus onSearch={search} />
              <p className="mt-3 text-center text-xs text-gray-500">Try &ldquo;navy polo&rdquo;, &ldquo;linen&rdquo; or &ldquo;tees&rdquo;</p>
            </div>
          </div>
        )}

        {menuOpen && (
          <nav className="animate-fade border-t border-white/[0.07] bg-noir/95 px-4 pt-4 pb-4 backdrop-blur-xl lg:hidden">
            <SearchBox onSearch={search} className="mb-2" />
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.to}
                to={link.to}
                className="block animate-rise py-3 text-2xl font-semibold tracking-[-0.03em] text-alabaster"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-smoke pt-2">
              {user ? (
                <>
                  <Link to="/orders" className="block py-2.5 text-sm font-medium text-gray-700">
                    Your orders
                  </Link>
                  {user.role === 'admin' && (
                    <>
                      <Link to="/admin/products" className="block py-2.5 text-sm font-medium text-gray-700">
                        Admin: products
                      </Link>
                      <Link to="/admin/orders" className="block py-2.5 text-sm font-medium text-gray-700">
                        Admin: orders
                      </Link>
                    </>
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
    <Link to="/cart" className="relative rounded-full p-2 text-alabaster transition-colors hover:text-ember-light" aria-label={`Cart, ${count} items`}>
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l-1 13H7L6 7zm3 0a3 3 0 016 0" />
      </svg>
      {count > 0 && (
        // key: a new count re-mounts the badge, so it "bumps" each time something is added
        <span
          key={count}
          className="absolute top-0 right-0 flex h-[18px] min-w-[18px] animate-bump items-center justify-center rounded-full bg-racing px-1 text-[10px] font-bold text-white shadow-[0_0_12px_rgb(221_2_0/0.7)]"
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
  const buttonRef = useRef(null);

  // Close when clicking anywhere outside the menu, or on Escape (focus back on the button)
  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const item = 'block w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-onyx hover:text-alabaster';

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-full px-3 py-2 text-[11.5px] font-semibold tracking-[0.16em] text-gray-700 uppercase transition-colors hover:text-alabaster"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-onyx text-[13px] font-semibold tracking-normal text-alabaster normal-case ring-1 ring-white/10">
          {name.trim()[0]?.toUpperCase()}
        </span>
        {name.split(' ')[0]}
        <svg className={`h-3 w-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 origin-top-right animate-pop overflow-hidden rounded-2xl border border-smoke bg-coal py-1.5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)]">
          <Link to="/fit-profile" onClick={() => setOpen(false)} className={item}>
            My fit profile
          </Link>
          <Link to="/orders" onClick={() => setOpen(false)} className={item}>
            Your orders
          </Link>
          {isAdmin && (
            <>
              <Link to="/admin/products" onClick={() => setOpen(false)} className={item}>
                Admin: products
              </Link>
              <Link to="/admin/orders" onClick={() => setOpen(false)} className={item}>
                Admin: orders
              </Link>
            </>
          )}
          <div className="my-1 border-t border-smoke" />
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
