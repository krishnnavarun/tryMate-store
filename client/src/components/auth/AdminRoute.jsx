import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../hooks/useAuth.js';
import StatusMessage from '../ui/StatusMessage.jsx';
import Spinner from '../ui/Spinner.jsx';

// Admin pages. The server checks the role on every admin request too; this only keeps
// customers from seeing pages that wouldn't work for them.
export default function AdminRoute() {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Spinner className="py-24" />;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <StatusMessage title="Admins only" message="Your account doesn't have access to this page." />
      </div>
    );
  }
  return <Outlet />;
}
