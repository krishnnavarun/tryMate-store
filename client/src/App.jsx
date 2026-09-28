import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Route, Routes } from 'react-router';
import AdminRoute from './components/auth/AdminRoute.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import Layout from './components/layout/Layout.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
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
            <Route path="orders" element={<AdminOrdersPage />} />
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
            background: '#1c1816',
            color: '#f1ece6',
            border: '1px solid rgb(255 255 255 / 0.1)',
            borderRadius: '999px',
            padding: '10px 18px',
            fontSize: '14px',
            boxShadow: '0 20px 50px -18px rgb(0 0 0 / 0.9)',
          },
          success: { iconTheme: { primary: '#9cbb8e', secondary: '#0b0a09' } },
          error: { iconTheme: { primary: '#ff5a4d', secondary: '#0b0a09' } },
        }}
      />
    </>
  );
}
