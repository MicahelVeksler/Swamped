// Simulated occupancy and opening hours.
//
// There is no live occupancy feed yet, so each place gets a typical "popular times" curve
// (like Google Maps) based on what kind of place it is, scaled by day of week. The "live"
// value adds a small, repeatable variation on top of the typical value so it can be
// busier or quieter than usual. Swap liveOccupancy() for a real feed later.

import { DAY_SHORT, fmtHour, minutesOf } from './time.js';

// Typical fraction of capacity in use for each hour of a weekday (index = hour 0-23).
const PROFILES = {
  library:   [.18, .12, .08, .05, .04, .04, .05, .10, .22, .38, .50, .58, .62, .66, .72, .74, .70, .62, .58, .60, .58, .50, .40, .28],
  studyhall: [0, 0, 0, 0, 0, 0, 0, .12, .25, .40, .52, .60, .64, .68, .70, .66, .60, .50, .40, .30, .15, 0, 0, 0],
  office:    [0, 0, 0, 0, 0, 0, 0, 0, .20, .35, .50, .55, .40, .55, .60, .55, .40, .10, 0, 0, 0, 0, 0, 0],
  dining:    [0, 0, 0, 0, 0, 0, 0, .15, .30, .28, .35, .65, .92, .80, .45, .30, .35, .55, .70, .50, .30, .18, .08, 0],
  union:     [.02, 0, 0, 0, 0, 0, .05, .15, .30, .40, .50, .70, .82, .75, .60, .55, .50, .52, .45, .38, .30, .20, .10, .05],
  gym:       [0, 0, 0, 0, 0, .08, .30, .42, .38, .30, .28, .35, .40, .35, .32, .45, .70, .88, .85, .70, .52, .35, .18, 0],
  outdoor:   [0, 0, 0, 0, 0, 0, .05, .10, .18, .25, .35, .50, .62, .55, .50, .45, .48, .52, .45, .30, .18, .10, .05, 0],
};

// How busy each day is compared with a Monday (index = day 0-6, Sunday first).
const DAY_FACTOR = {
  default: [.6, 1, 1, 1, .95, .75, .5],
  library: [.85, 1, 1, 1, .95, .7, .55],
  gym:     [.75, 1, 1, 1, .95, .8, .75],
  outdoor: [.5, 1, 1, 1, 1, .85, .6],
};

// During exam week the study spaces fill up (every interviewee mentioned this).
const EXAM_WEEK_BOOST = 1.35;

// ---------- Hours ----------

/** Is the place open on `day` at `minutes` after midnight? Handles closings after midnight. */
export function isOpenAt(place, day, minutes) {
  const today = place.hours[day];
  if (today && minutes >= today[0] && minutes < today[1]) return true;
  const yesterday = place.hours[(day + 6) % 7];
  return Boolean(yesterday && yesterday[1] > 1440 && minutes < yesterday[1] - 1440);
}

export function isOpen(place, date) {
  return isOpenAt(place, date.getDay(), minutesOf(date));
}

/** Minutes until the place closes (Infinity if open around the clock), or 0 if closed. */
export function minutesUntilClose(place, day, minutes) {
  if (!isOpenAt(place, day, minutes)) return 0;
  const today = place.hours[day];
  const close = today && minutes >= today[0] && minutes < today[1]
    ? today[1]
    : place.hours[(day + 6) % 7][1] - 1440;
  if (close >= 1440 && place.hours[(day + 1) % 7]?.[0] === 0) return Infinity;
  return close - minutes;
}

/**
 * Status line for a place, e.g.
 *   { open: true,  text: '24 hours' }
 *   { open: true,  text: 'Closes 8PM' }
 *   { open: false, text: 'Opens 7AM Mon' }
 */
export function hoursStatus(place, date) {
  const day = date.getDay();
  const m = minutesOf(date);
  if (isOpenAt(place, day, m)) {
    const left = minutesUntilClose(place, day, m);
    if (left === Infinity) return { open: true, text: '24 hours' };
    return { open: true, text: `Closes ${fmtHour(m + left)}` };
  }
  const today = place.hours[day];
  if (today && m < today[0]) return { open: false, text: `Opens ${fmtHour(today[0])}` };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const r = place.hours[d];
    if (r) return { open: false, text: `Opens ${fmtHour(r[0])} ${DAY_SHORT[d]}` };
  }
  return { open: false, text: 'Temporarily closed' };
}

// ---------- Occupancy ----------

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/** Typical occupancy (0-1) for a place on `day` at `minutes`. 0 when closed. */
export function typicalOccupancy(place, day, minutes, { examWeek = false } = {}) {
  if (!isOpenAt(place, day, minutes)) return 0;
  const curve = PROFILES[place.profile] ?? PROFILES.outdoor;
  const hour = Math.floor(minutes / 60) % 24;
  const frac = (minutes % 60) / 60;
  let v = curve[hour] * (1 - frac) + curve[(hour + 1) % 24] * frac;
  v *= (DAY_FACTOR[place.profile] ?? DAY_FACTOR.default)[day];
  v *= place.busy ?? 1;
  if (examWeek && place.category === 'study') v *= EXAM_WEEK_BOOST;
  return clamp(v, 0.03, 0.98);
}

// Repeatable pseudo-random number in [-1, 1] for a string key.
function noise(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) / 4294967295) * 2 - 1;
}

/** Simulated live occupancy (0-1) right now. */
export function liveOccupancy(place, date, opts) {
  const day = date.getDay();
  const m = minutesOf(date);
  const typical = typicalOccupancy(place, day, m, opts);
  if (!typical) return 0;
  const key = `${place.id}|${date.toDateString()}|${Math.floor(m / 60)}`;
  return clamp(typical * (1 + 0.18 * noise(key)), 0.02, 0.99);
}

/** Hourly typical occupancy for a whole day, for the popular-times chart. */
export function dayCurve(place, day, opts) {
  return Array.from({ length: 24 }, (_, h) => typicalOccupancy(place, day, h * 60 + 30, opts));
}

/** Words for an occupancy level, comparing live to typical when they differ a lot. */
export function busyLabel(live, typical) {
  if (typical && live - typical > 0.12) return 'Busier than usual';
  if (typical && typical - live > 0.12) return 'Less busy than usual';
  if (live < 0.2) return 'Not busy';
  if (live < 0.4) return 'Not too busy';
  if (live < 0.6) return 'A little busy';
  if (live < 0.8) return 'Busy';
  return 'As busy as it gets';
}

export function pct(fraction) {
  return `${Math.round(fraction * 100)}%`;
}
