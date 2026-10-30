import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MailCheck, UserPlus } from 'lucide-react';
import { useAuth, useToast } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import FormField from '../components/auth/FormField';
import { RedirectIfSignedIn } from '../components/auth/RouteGuards';
import Button from '../components/common/Button';
import { ErrorBanner } from '../components/common/States';
import { validateRegistration as validate } from '../utils/validation';

export default function UserRegisterPage() {
  const { signUp, signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSentTo, setConfirmationSentTo] = useState(null);

  const update = (field) => (event) => {
    setForm((f) => ({ ...f, [field]: event.target.value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const { needsConfirmation } = await signUp(form);
      if (needsConfirmation) {
        setConfirmationSentTo(form.email.trim());
        setSubmitting(false);
        return;
      }
      await signIn(form.email, form.password).catch(() => null);
      toast.success('Account created', 'Welcome to Gravitas AI!');
      navigate('/chat', { replace: true });
    } catch (error) {
      setFormError(error.message);
      setSubmitting(false);
    }
  };

  if (confirmationSentTo) {
    return (
      <AuthLayout title="Check your inbox" subtitle="One more step to activate your account.">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <MailCheck className="size-7" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm text-slate-600">
            We sent a confirmation link to <strong className="text-navy-900">{confirmationSentTo}</strong>. Open it, then sign in.
          </p>
          <Link to="/login/user" className="mt-6 inline-flex h-11 items-center rounded-xl bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-800">
            Go to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register to start a conversation with Gravitas AI."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login/user" className="font-semibold text-navy-800 hover:underline">Sign in</Link>
        </>
      }
    >
      <RedirectIfSignedIn hold={submitting} />
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <ErrorBanner title="Registration failed" message={formError} onDismiss={() => setFormError(null)} />}
        <FormField label="Full name" autoComplete="name" placeholder="Your name" value={form.displayName} onChange={update('displayName')} error={errors.displayName} maxLength={80} />
        <FormField label="Email address" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={form.email} onChange={update('email')} error={errors.email} />
        <FormField label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={update('password')} error={errors.password} hint="Use 8+ characters with letters and numbers." />
        <FormField label="Confirm password" type="password" autoComplete="new-password" placeholder="Repeat your password" value={form.confirm} onChange={update('confirm')} error={errors.confirm} />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {!submitting && <UserPlus className="size-4" aria-hidden="true" />}
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
        <p className="text-center text-xs text-slate-500">Operator accounts cannot be created here. They are provisioned by the project administrator.</p>
      </form>
    </AuthLayout>
  );
}
