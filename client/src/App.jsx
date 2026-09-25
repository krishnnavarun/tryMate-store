import { Toaster } from 'react-hot-toast';
import { Route, Routes } from 'react-router';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import Layout from './components/layout/Layout.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ShopPage from './pages/ShopPage.jsx';

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

          {/* Logged-in users only */}
          <Route element={<ProtectedRoute />}>
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            {/* Later phases: fit-profile, admin */}
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
    </>
  );
}
