const AUTH_MESSAGES = [
  [/invalid login credentials/i, 'Incorrect email or password.'],
  [/email not confirmed/i, 'Please confirm your email address first (check your inbox), then sign in.'],
  [/user already registered/i, 'An account with this email already exists. Try signing in instead.'],
  [/password should be at least/i, 'Your password is too short. Use at least 8 characters.'],
  [/rate limit|too many requests/i, 'Too many attempts. Please wait a minute and try again.'],
  [/failed to fetch|network/i, "Can't reach Supabase. Check your internet connection and VITE_SUPABASE_URL."],
  [/signups not allowed/i, 'New registrations are disabled for this project.'],
];

/** Maps Supabase Auth errors to friendly, non-technical messages. */
export function friendlyAuthError(error) {
  const message = error?.message ?? '';
  for (const [pattern, friendly] of AUTH_MESSAGES) if (pattern.test(message)) return friendly;
  return message || 'Something went wrong. Please try again.';
}
