export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function validateRegistration({ displayName, email, password, confirm }) {
  const errors = {};
  const name = displayName.trim();
  if (name.length < 2) errors.displayName = 'Enter your name (at least 2 characters).';
  else if (name.length > 80) errors.displayName = 'Your name must be 80 characters or fewer.';
  if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (password.length < 8) errors.password = 'Use at least 8 characters.';
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = 'Use a mix of letters and numbers.';
  if (confirm !== password) errors.confirm = 'Passwords do not match.';
  return errors;
}
