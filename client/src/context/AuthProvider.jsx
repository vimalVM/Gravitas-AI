import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { setUnauthorizedHandler } from '../services/api';
import { fetchMyProfile, updateMyProfile, uploadMyAvatar } from '../services/chatApi';
import { messageStore } from '../services/messageStore';
import { resetRooms } from '../services/roomManager';
import { clearSignedImageCache } from '../hooks/useSignedImage';
import { useToast } from '../hooks/useAuth';
import { friendlyAuthError } from '../utils/authErrors';
import { AuthContext } from './contexts';

function clearClientCaches() {
  messageStore.reset();
  resetRooms();
  clearSignedImageCache();
}

/**
 * Supabase Auth session + the profile/role from our backend.
 * profileStatus: 'idle' | 'loading' | 'ready' | 'error'
 */
export default function AuthProvider({ children }) {
  const toast = useToast();
  const [session, setSession] = useState(undefined); // undefined = still restoring
  const [profile, setProfile] = useState(null);
  const [profileStatus, setProfileStatus] = useState('idle');
  const [profileError, setProfileError] = useState(null);
  const loadedFor = useRef(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession ?? null);
      if (event === 'SIGNED_OUT') {
        loadedFor.current = null;
        setProfile(null);
        setProfileStatus('idle');
        clearClientCaches();
      }
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = useCallback(async () => {
    setProfileStatus('loading');
    setProfileError(null);
    try {
      const next = await fetchMyProfile();
      setProfile(next);
      setProfileStatus('ready');
      return next;
    } catch (error) {
      setProfileError(error);
      setProfileStatus('error');
      throw error;
    }
  }, []);

  const userId = session?.user?.id ?? null;
  useEffect(() => {
    if (!userId || loadedFor.current === userId) return;
    loadedFor.current = userId;
    loadProfile().catch(() => {});
  }, [userId, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => supabase.auth.signOut({ scope: 'local' }));
    clearClientCaches();
  }, []);

  // Called by the API layer when the session cannot be refreshed any more.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      toast.error('Session expired', 'Please sign in again to continue.');
      supabase.auth.signOut({ scope: 'local' });
    });
    return () => setUnauthorizedHandler(null);
  }, [toast]);

  const signIn = useCallback(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(friendlyAuthError(error));
      loadedFor.current = data.user.id;
      setSession(data.session);
      return loadProfile();
    },
    [loadProfile],
  );

  const signUp = useCallback(async ({ displayName, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: `${window.location.origin}/login/user`,
      },
    });
    if (error) throw new Error(friendlyAuthError(error));
    return { needsConfirmation: !data.session };
  }, []);

  const updateDisplayName = useCallback(async (displayName) => {
    const next = await updateMyProfile(displayName);
    setProfile(next);
    return next;
  }, []);

  const updateAvatar = useCallback(async (file, onProgress) => {
    const next = await uploadMyAvatar(file, onProgress);
    setProfile(next);
    return next;
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileStatus,
      profileError,
      initializing: session === undefined,
      signIn,
      signUp,
      signOut,
      reloadProfile: loadProfile,
      updateDisplayName,
      updateAvatar,
    }),
    [session, profile, profileStatus, profileError, signIn, signUp, signOut, loadProfile, updateDisplayName, updateAvatar],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
