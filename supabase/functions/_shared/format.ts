// Timezone-aware string builders for round pushes. All copy strings are
// lowercase per plan §3; minute digits are always two digits.
//
// Intl.DateTimeFormat accepts an IANA timezone and handles DST
// transitions without any help from us.

const DEFAULT_TZ = 'America/Los_Angeles';

function tz(timezone: string | null | undefined): string {
  return timezone && timezone.length > 0 ? timezone : DEFAULT_TZ;
}

function partsFor(teeTimeIso: string, timezone: string | null | undefined) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz(timezone),
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const parts = formatter.formatToParts(new Date(teeTimeIso));
  const lookup = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  return {
    weekday: lookup('weekday').toLowerCase(),
    hour: lookup('hour'),
    minute: lookup('minute'),
  };
}

// e.g. "sat 7:20"
export function formatTeeTimeLabel(
  teeTimeIso: string,
  timezone: string | null | undefined,
): string {
  const { weekday, hour, minute } = partsFor(teeTimeIso, timezone);
  return `${weekday} ${hour}:${minute}`;
}

// e.g. "sat"
export function formatWeekdayLabel(
  teeTimeIso: string,
  timezone: string | null | undefined,
): string {
  return partsFor(teeTimeIso, timezone).weekday;
}

// e.g. "7:20"
export function formatClockLabel(
  teeTimeIso: string,
  timezone: string | null | undefined,
): string {
  const { hour, minute } = partsFor(teeTimeIso, timezone);
  return `${hour}:${minute}`;
}
