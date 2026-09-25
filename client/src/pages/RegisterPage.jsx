import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import AuthCard from '../components/auth/AuthCard.jsx';
import FormField, { SubmitButton } from '../components/ui/FormField.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { safeRedirect } from '../utils/redirect.js';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = safeRedirect(searchParams.get('redirect'));
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={redirect} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const created = await register({
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
      });
      toast.success(`Welcome to tryMate, ${created.name.split(' ')[0]}!`);
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.userMessage);
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      footer={
        <>
          Already have an account?{' '}
          <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-brand">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name" name="name" required maxLength={80} autoComplete="name" autoFocus />
        <FormField label="Email" name="email" type="email" required autoComplete="email" />
        <FormField
          label="Password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          hint="At least 8 characters."
        />
        <SubmitButton loading={submitting} loadingText="Creating account…">
          Create account
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
