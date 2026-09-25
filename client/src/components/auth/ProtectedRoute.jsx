import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../hooks/useAuth.js';
import Spinner from '../ui/Spinner.jsx';

// Wrap routes that need a logged-in user:
//   <Route element={<ProtectedRoute />}> ...private routes... </Route>
// Logged-out visitors go to /login?redirect=<where they wanted to go>.
export default function ProtectedRoute() {
  const { user, status } = useAuth();
  const location = useLocation();

  // Still checking the cookie: don't redirect yet, or a refresh would always bounce to login
  if (status === 'loading') return <Spinner className="py-24" />;

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
