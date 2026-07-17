// Quiet-hours math, timezone-aware. Plan §2: events fired during quiet
// hours are held and delivered at the start of the next non-quiet window.
// The window can cross midnight (e.g. 22:00–08:00), which is the common
// case and the default in notification_preferences.

const DEFAULT_TZ = 'America/Los_Angeles';

function wallClockMinutes(
  now: Date,
  timezone: string | null | undefined,
): number {
  const tz = timezone && timezone.length > 0 ? timezone : DEFAULT_TZ;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const lookup = (type: Intl.DateTimeFormatPartTypes): number =>
    parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);
  // Intl "24h" returns hour 24 at midnight in some locales; normalize.
  const hour = lookup('hour') % 24;
  const minute = lookup('minute');
  return hour * 60 + minute;
}

// Accepts `HH:MM:SS` or `HH:MM` (Postgres `time` serializes either way).
function parseTimeStringToMinutes(time: string): number {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  return (h % 24) * 60 + (m || 0);
}

export function isInQuietHours(input: {
  now: Date;
  quietHoursStart: string; // '22:00' or '22:00:00'
  quietHoursEnd: string;   // '08:00'
  timezone: string | null | undefined;
}): boolean {
  const nowMinutes = wallClockMinutes(input.now, input.timezone);
  const startMinutes = parseTimeStringToMinutes(input.quietHoursStart);
  const endMinutes = parseTimeStringToMinutes(input.quietHoursEnd);

  if (startMinutes === endMinutes) {
    // Degenerate window — treat as "never quiet" rather than "always quiet"
    // so a misconfigured row doesn't silently mute the user forever.
    return false;
  }

  if (startMinutes < endMinutes) {
    // Same-day window, e.g. 13:00–15:00.
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  // Crosses midnight, e.g. 22:00–08:00.
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}
