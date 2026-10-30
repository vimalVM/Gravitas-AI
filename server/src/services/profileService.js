import { dbError } from '../utils/httpError.js';

const PROFILE_COLUMNS = 'id, display_name, avatar_path, role, created_at, updated_at';

export function createProfileService({ supabase, storage }) {
  return {
    async getById(id) {
      const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', id).maybeSingle();
      if (error) throw dbError(error, 'load profile');
      return data;
    },

    async updateDisplayName(id, displayName) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', id)
        .select(PROFILE_COLUMNS)
        .single();
      if (error) throw dbError(error, 'update profile');
      return data;
    },

    async setAvatarPath(id, avatarPath) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_path: avatarPath })
        .eq('id', id)
        .select(PROFILE_COLUMNS)
        .single();
      if (error) throw dbError(error, 'update avatar');
      return data;
    },

    /** Public representation of a profile (with a signed avatar URL). */
    async toApi(profile, email) {
      const avatar = profile.avatar_path ? await storage.signOne(profile.avatar_path) : null;
      return {
        id: profile.id,
        email: email ?? null,
        displayName: profile.display_name,
        role: profile.role,
        avatarUrl: avatar?.url ?? null,
        createdAt: profile.created_at,
      };
    },
  };
}
