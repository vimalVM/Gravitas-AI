const toDate = (value) => (value instanceof Date ? value : new Date(value));

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Local calendar-day key, e.g. "2026-10-29". */
export function dayKey(value) {
  const d = toDate(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "10:31 AM" in the viewer's locale. */
export function formatTime(value) {
  return toDate(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Date separator label: "Today", "Yesterday" or "28 October 2026". */
export function formatDayLabel(value, now = new Date()) {
  const date = toDate(value);
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Compact time for conversation lists: "10:31 AM", "Yesterday", "Mon", "28/10/2026". */
export function formatListTime(value, now = new Date()) {
  if (!value) return '';
  const date = toDate(value);
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return formatTime(date);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString('en-GB');
}

export function formatFullDate(value) {
  if (!value) return '';
  return toDate(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
