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
  { to: '/fit-profile', label: 'My fit' },
];

export function Logo() {
  return (
    <Link to="/" className="text-xl font-extrabold tracking-tight text-brand">
      try<span className="text-brand-accent">Mate</span>
    </Link>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm font-medium text-gray-600 transition hover:text-brand">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Hide account controls until we know whether the user is logged in (no flicker) */}
          {status === 'ready' &&
            (user ? (
              <AccountMenu name={user.name} isAdmin={user.role === 'admin'} onLogout={handleLogout} />
            ) : (
              <Link
                to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand sm:block"
              >
                Log in
              </Link>
            ))}
          <CartButton />

          {/* Mobile menu button */}
          <button
            type="button"
            className="rounded-md p-2 text-gray-700 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-gray-200 bg-white px-4 py-2 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="block py-3 text-base font-medium text-gray-700">
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 py-2">
            {user ? (
              <>
                <Link to="/orders" className="block py-3 text-base font-medium text-gray-700">
                  Your orders
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin/products" className="block py-3 text-base font-medium text-gray-700">
                    Admin: products
                  </Link>
                )}
                <button type="button" onClick={handleLogout} className="block py-3 text-base font-medium text-gray-700">
                  Log out
                </button>
              </>
            ) : (
              <Link to="/login" className="block py-3 text-base font-medium text-gray-700">
                Log in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function CartButton() {
  const { cart } = useCart();
  const count = cart.itemCount;

  return (
    <Link to="/cart" className="relative rounded-md p-2 text-gray-700 hover:text-brand" aria-label={`Cart, ${count} items`}>
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l-1 13H7L6 7zm3 0a3 3 0 016 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent px-1 text-[11px] font-bold text-white">
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

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand"
      >
        Hi, {name.split(' ')[0]} ▾
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <Link to="/fit-profile" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            My fit profile
          </Link>
          <Link to="/orders" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Your orders
          </Link>
          {isAdmin && (
            <Link to="/admin/products" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Admin: products
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
