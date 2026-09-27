import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import AuthCard from '../components/auth/AuthCard.jsx';
import FormField, { PasswordField, SubmitButton } from '../components/ui/FormField.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { safeRedirect } from '../utils/redirect.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = safeRedirect(searchParams.get('redirect'));
  const [submitting, setSubmitting] = useState(false);
  usePageTitle('Log in');

  if (user) return <Navigate to={redirect} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const loggedIn = await login({ email: form.get('email'), password: form.get('password') });
      toast.success(`Welcome back, ${loggedIn.name.split(' ')[0]}!`);
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.userMessage);
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Log in"
      footer={
        <>
          New to tryMate?{' '}
          <Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="link-underline font-semibold text-ink">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" name="email" type="email" required autoComplete="email" autoFocus />
        <PasswordField name="password" required autoComplete="current-password" />
        <SubmitButton loading={submitting} loadingText="Logging in…">
          Log in
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
