// Finds the free gaps between a student's classes and how long each one lasts.

import { minutesOf } from './time.js';

// Anything shorter is just the walk between back-to-back classes.
export const MIN_GAP = 20;

export function classesOn(schedule, day) {
  return schedule.filter((c) => c.days.includes(day)).sort((a, b) => a.start - b.start);
}

/** Gaps between consecutive classes on one day: { start, end, minutes, from, to }. */
export function findGaps(classes) {
  const gaps = [];
  for (let i = 1; i < classes.length; i++) {
    const from = classes[i - 1];
    const to = classes[i];
    if (to.start > from.end) {
      gaps.push({ start: from.end, end: to.start, minutes: to.start - from.end, from, to });
    }
  }
  return gaps;
}

/**
 * Where the student is in their day right now. One of:
 *   noClasses   - nothing scheduled today
 *   beforeFirst - day hasn't started; `next` is the first class
 *   inClass     - `current` class; `gap` is the next real gap today (if any)
 *   gap         - in a free gap; `remaining` minutes left
 *   passing     - a few minutes between back-to-back classes; `next` is coming up
 *   done        - finished for the day
 */
export function scheduleContext(schedule, now) {
  const day = now.getDay();
  const m = minutesOf(now);
  const today = classesOn(schedule, day);
  if (!today.length) return { kind: 'noClasses' };

  const gaps = findGaps(today);
  const current = today.find((c) => m >= c.start && m < c.end);
  if (current) {
    const gap = gaps.find((g) => g.start >= current.end && g.minutes >= MIN_GAP) ?? null;
    return { kind: 'inClass', current, gap };
  }
  if (m < today[0].start) return { kind: 'beforeFirst', next: today[0], remaining: today[0].start - m };

  const gap = gaps.find((g) => m >= g.start && m < g.end);
  if (gap) {
    const remaining = gap.end - m;
    return gap.minutes >= MIN_GAP && remaining >= 10
      ? { kind: 'gap', gap, remaining }
      : { kind: 'passing', next: gap.to, remaining };
  }
  return { kind: 'done', last: today[today.length - 1] };
}
