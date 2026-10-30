import { useRef, useState } from 'react';
import { Camera, LogOut, Mail, Save, ShieldCheck, UserRound } from 'lucide-react';
import { UPLOADS } from '../../config/app';
import { useAuth, useToast } from '../../hooks/useAuth';
import { formatFullDate } from '../../utils/date';
import { validateImageFile } from '../../utils/files';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { ConfirmationDialog } from '../common/Dialogs';
import { Spinner } from '../common/States';
import FormField from '../auth/FormField';

/** Account details, display name, avatar upload and sign-out. */
export default function UserProfile() {
  const { profile, updateDisplayName, updateAvatar, signOut } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(profile.displayName);
  const [nameError, setNameError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const fileRef = useRef(null);

  const roleLabel = profile.role === 'ai_operator' ? 'AI Operator' : 'User';
  const dirty = name.trim() !== profile.displayName;

  const saveName = async (event) => {
    event.preventDefault();
    const value = name.trim().replace(/\s+/g, ' ');
    if (value.length < 2 || value.length > 80) {
      setNameError('Use between 2 and 80 characters.');
      return;
    }
    setSaving(true);
    try {
      await updateDisplayName(value);
      toast.success('Profile updated', 'Your name has been saved.');
    } catch (error) {
      toast.error('Could not save your name', error.message);
    } finally {
      setSaving(false);
    }
  };

  const changeAvatar = async (file) => {
    const problem = validateImageFile(file, UPLOADS.maxBytes);
    if (problem) {
      toast.error('Image not accepted', problem);
      return;
    }
    setAvatarProgress(0);
    try {
      await updateAvatar(file, setAvatarProgress);
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error('Upload failed', error.message);
    } finally {
      setAvatarProgress(null);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col items-center rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <div className="relative">
          <Avatar name={profile.displayName} src={profile.avatarUrl} size={88} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarProgress !== null}
            className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full bg-navy-900 text-white shadow-md ring-4 ring-white hover:bg-navy-800 disabled:opacity-70"
            aria-label="Change profile picture"
          >
            {avatarProgress !== null ? <Spinner className="size-4" /> : <Camera className="size-4" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) changeAvatar(file);
            }}
          />
        </div>
        {avatarProgress !== null && <p className="mt-2 text-xs text-slate-500">Uploading {avatarProgress}%</p>}
        <h2 className="mt-4 text-lg font-bold text-navy-900">{profile.displayName}</h2>
        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-semibold text-navy-700 ring-1 ring-navy-100">
          {profile.role === 'ai_operator' ? <ShieldCheck className="size-3.5" aria-hidden="true" /> : <UserRound className="size-3.5" aria-hidden="true" />}
          {roleLabel}
        </span>
      </section>

      <form onSubmit={saveName} className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-sm font-bold text-navy-900">Account</h3>
        <FormField
          label="Display name"
          value={name}
          maxLength={80}
          onChange={(event) => {
            setName(event.target.value);
            setNameError(null);
          }}
          error={nameError}
        />
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-sm ring-1 ring-slate-200">
          <Mail className="size-4 text-slate-400" aria-hidden="true" />
          <span className="truncate text-slate-700">{profile.email}</span>
        </div>
        <p className="text-xs text-slate-500">Member since {formatFullDate(profile.createdAt)}</p>
        <Button type="submit" disabled={!dirty} loading={saving}>
          {!saving && <Save className="size-4" aria-hidden="true" />} Save changes
        </Button>
      </form>

      <Button variant="secondary" className="w-full text-rose-600" onClick={() => setConfirmLogout(true)}>
        <LogOut className="size-4" aria-hidden="true" /> Sign out
      </Button>

      <ConfirmationDialog
        open={confirmLogout}
        title="Sign out?"
        description="You can sign back in at any time. Your conversation history is saved."
        confirmLabel="Sign out"
        tone="danger"
        loading={signingOut}
        onConfirm={handleSignOut}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
