import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { APP, ROLE_HOME } from '../config/app';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import FormField from '../components/auth/FormField';
import { RedirectIfSignedIn } from '../components/auth/RouteGuards';
import Button from '../components/common/Button';
import { ErrorBanner } from '../components/common/States';
import { validateLogin } from '../utils/validation';

/**
 * Operator sign-in. Signing in here does NOT grant any role: the role comes
 * from the database (assigned by an administrator) and is verified by the
 * backend. Accounts without the operator role are signed out again.
 */
export default function OperatorLoginPage() {
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();
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
      if (profile.role !== 'ai_operator') {
        await signOut();
        setFormError('This account does not have operator access. Ordinary users should use the user sign-in page.');
        setSubmitting(false);
        return;
      }
      navigate(ROLE_HOME.ai_operator, { replace: true });
    } catch (error) {
      setFormError(error.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      variant="operator"
      title={
        <span className="flex flex-col">
          <span className="text-xs font-bold tracking-[0.2em] text-blue-600">{APP.name}</span>
          {APP.operatorConsoleName}
        </span>
      }
      subtitle="Sign in with your authorised operator account to manage conversations."
      footer={
        <>
          Not an operator?{' '}
          <Link to="/login/user" className="font-semibold text-white hover:underline">User sign-in</Link>
        </>
      }
    >
      <RedirectIfSignedIn hold={submitting} />
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <ErrorBanner title="Access denied" message={formError} onDismiss={() => setFormError(null)} />}
        <FormField label="Operator email" type="email" autoComplete="username" inputMode="email" placeholder="operator@example.com" value={form.email} onChange={update('email')} error={errors.email} />
        <FormField label="Password" type="password" autoComplete="current-password" placeholder="Your password" value={form.password} onChange={update('password')} error={errors.password} />
        <Button type="submit" size="lg" variant="primary" className="w-full" loading={submitting}>
          {!submitting && <ShieldCheck className="size-4" aria-hidden="true" />}
          {submitting ? 'Verifying access...' : 'Enter Operator Console'}
        </Button>
        <p className="text-center text-xs text-slate-500">Operator accounts are created and authorised by the project administrator.</p>
      </form>
    </AuthLayout>
  );
}
