import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Route, Routes } from 'react-router';
import AdminRoute from './components/auth/AdminRoute.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import Layout from './components/layout/Layout.jsx';
import AdminProductFormPage from './pages/admin/AdminProductFormPage.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import FitProfilePage from './pages/FitProfilePage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import Spinner from './components/ui/Spinner.jsx';

// Loaded only when someone opens the fitting room: it pulls in MediaPipe (~0.2 MB gzipped)
const FittingRoomPage = lazy(() => import('./pages/FittingRoomPage.jsx'));

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="products/:slug" element={<ProductPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route
            path="fitting-room"
            element={
              <Suspense fallback={<Spinner className="py-24" />}>
                <FittingRoomPage />
              </Suspense>
            }
          />

          {/* Logged-in users only */}
          <Route element={<ProtectedRoute />}>
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="fit-profile" element={<FitProfilePage />} />
          </Route>

          {/* Admins only */}
          <Route path="admin" element={<AdminRoute />}>
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<AdminProductFormPage />} />
            <Route path="products/:slug/edit" element={<AdminProductFormPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <Toaster
        position="top-center"
        containerStyle={{ top: 112 }} // just below the header
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1c1a17',
            color: '#faf8f4',
            borderRadius: '999px',
            padding: '10px 18px',
            fontSize: '14px',
            boxShadow: '0 18px 40px -18px rgb(28 26 23 / 0.6)',
          },
          success: { iconTheme: { primary: '#c8ad7f', secondary: '#1c1a17' } },
          error: { iconTheme: { primary: '#cf9186', secondary: '#1c1a17' } },
        }}
      />
    </>
  );
}
