// Time helpers. Times of day are stored as minutes after midnight.

export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Weekday columns on the schedule (1 = Monday ... 5 = Friday) and their UF-style letters.
export const WEEKDAYS = [1, 2, 3, 4, 5];
export const WEEKDAY_LETTER = { 1: 'M', 2: 'T', 3: 'W', 4: 'R', 5: 'F' };

export function minutesOf(date) {
  return date.getHours() * 60 + date.getMinutes();
}

/** A Date on the same calendar day as `date`, at `minutes` after midnight. */
export function atMinutes(date, minutes) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
}

function split(minutes) {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  return { h12: h24 % 12 === 0 ? 12 : h24 % 12, min: m % 60, pm: h24 >= 12 };
}

/** 575 -> "9:35" */
export function fmtClock(minutes) {
  const { h12, min } = split(minutes);
  return `${h12}:${String(min).padStart(2, '0')}`;
}

/** 575 -> "9:35 AM" */
export function fmtTime(minutes) {
  return `${fmtClock(minutes)} ${split(minutes).pm ? 'PM' : 'AM'}`;
}

/** 871 -> "2:31PM" (current-time marker style) */
export function fmtTimeTight(minutes) {
  return `${fmtClock(minutes)}${split(minutes).pm ? 'PM' : 'AM'}`;
}

/** 1200 -> "8PM", 450 -> "7:30AM" (hours style) */
export function fmtHour(minutes) {
  const { h12, min, pm } = split(minutes);
  return `${h12}${min ? `:${String(min).padStart(2, '0')}` : ''}${pm ? 'PM' : 'AM'}`;
}

/** 14 -> "2p" (chart axis style) */
export function fmtAxisHour(hour) {
  const { h12, pm } = split(hour * 60);
  return `${h12}${pm ? 'p' : 'a'}`;
}

/** Start-end range like the class cards: "9:35-10:25" */
export function fmtRange(start, end) {
  return `${fmtClock(start)}-${fmtClock(end)}`;
}

/** 95 -> "1 hr 35 min" */
export function fmtDuration(minutes) {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} hr ${r} min` : `${h} hr`;
}

/** 80 -> "1h 20m" (tight spaces like the schedule grid) */
export function fmtDurationShort(minutes) {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r}m`;
  return r ? `${h}h ${r}m` : `${h}h`;
}

/**
 * Parses "9:35" / "935" / "9" plus an AM/PM flag into minutes after midnight.
 * Returns null if the text is not a valid 12-hour clock time.
 */
export function parseClock(text, pm) {
  const match = String(text).trim().match(/^(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2] ?? 0);
  if (h < 1 || h > 12 || m > 59) return null;
  return ((h % 12) + (pm ? 12 : 0)) * 60 + m;
}

export function isPm(minutes) {
  return split(minutes).pm;
}
