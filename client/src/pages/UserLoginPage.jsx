import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { ROLE_HOME } from '../config/app';
import { useAuth, useToast } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import FormField from '../components/auth/FormField';
import { RedirectIfSignedIn } from '../components/auth/RouteGuards';
import Button from '../components/common/Button';
import { ErrorBanner } from '../components/common/States';
import { validateLogin } from '../utils/validation';

export default function UserLoginPage() {
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    setForm((f) => ({ ...f, [field]: event.target.value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateLogin(form);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const profile = await signIn(form.email, form.password);
      if (profile.role === 'ai_operator') {
        toast.info('Operator account', 'You were signed in to the Operator Console.');
        navigate(ROLE_HOME.ai_operator, { replace: true });
      } else {
        navigate(location.state?.from?.startsWith('/') && !location.state.from.startsWith('/ai') ? location.state.from : ROLE_HOME.user, { replace: true });
      }
    } catch (error) {
      setFormError(error.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your conversation with Gravitas AI."
      footer={
        <>
          New to Gravitas AI?{' '}
          <Link to="/register" className="font-semibold text-navy-800 hover:underline">Create an account</Link>
        </>
      }
    >
      <RedirectIfSignedIn hold={submitting} />
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <ErrorBanner title="Sign-in failed" message={formError} onDismiss={() => setFormError(null)} />}
        <FormField label="Email address" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={form.email} onChange={update('email')} error={errors.email} />
        <FormField label="Password" type="password" autoComplete="current-password" placeholder="Your password" value={form.password} onChange={update('password')} error={errors.password} />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {!submitting && <LogIn className="size-4" aria-hidden="true" />}
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-5 text-center text-xs text-slate-500">
        Are you the operator?{' '}
        <Link to="/login/ai" className="font-semibold text-navy-700 hover:underline">Use the Operator Console</Link>
      </p>
    </AuthLayout>
  );
}
