// Session times are stored as UTC instants but every booking decision —
// "is this a Monday?", "what date is the session on?", "what time does it start?" —
// is made in the studio's local timezone. Centralizing those conversions here keeps
// the API and the booking UI from drifting into browser-local interpretations that
// silently break for users outside Pacific time.

export const STUDIO_TIMEZONE = 'America/Los_Angeles';

const yMDFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: STUDIO_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const time24Formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: STUDIO_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const time12Formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: STUDIO_TIMEZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: STUDIO_TIMEZONE,
  weekday: 'short',
});

const monthYearFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: STUDIO_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
});

const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: STUDIO_TIMEZONE,
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: STUDIO_TIMEZONE,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

function toDate(input: Date | string): Date {
  return typeof input === 'string' ? new Date(input) : input;
}

// "yyyy-MM-dd" in studio TZ. Use this anywhere you'd otherwise call
// format(parseISO(x), 'yyyy-MM-dd') or x.slice(0, 10).
export function studioDateString(input: Date | string): string {
  const parts = yMDFormatter.formatToParts(toDate(input));
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;
  return `${year}-${month}-${day}`;
}

// "HH:mm" 24h in studio TZ — used to compare recurring time slots.
export function studioTime24(input: Date | string): string {
  const parts = time24Formatter.formatToParts(toDate(input));
  const hour = parts.find(p => p.type === 'hour')!.value;
  const minute = parts.find(p => p.type === 'minute')!.value;
  // Intl emits "24" for midnight under some runtimes; normalize to "00".
  return `${hour === '24' ? '00' : hour}:${minute}`;
}

// "h:mm AM/PM" in studio TZ for display.
export function studioTime12(input: Date | string): string {
  return time12Formatter.format(toDate(input));
}

// 0 = Sunday … 6 = Saturday, in studio TZ.
const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
export function studioDayOfWeek(input: Date | string): number {
  return DOW[weekdayFormatter.format(toDate(input))] ?? 0;
}

// "yyyy-MM" in studio TZ — for same-month checks.
export function studioMonthString(input: Date | string): string {
  const parts = monthYearFormatter.formatToParts(toDate(input));
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  return `${year}-${month}`;
}

// Long form ("Wednesday, May 13, 2026") in studio TZ for confirmation labels.
export function studioFullDate(input: Date | string): string {
  return fullDateFormatter.format(toDate(input));
}

// Short form ("Wed, May 13") in studio TZ for compact list rows.
export function studioShortDate(input: Date | string): string {
  return shortDateFormatter.format(toDate(input));
}
