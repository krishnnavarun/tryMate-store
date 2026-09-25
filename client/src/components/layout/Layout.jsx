import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Footer from './Footer.jsx';
import Header from './Header.jsx';

export default function Layout() {
  const { pathname } = useLocation();

  // Start each new page at the top (SPA navigation keeps the old scroll position otherwise)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
