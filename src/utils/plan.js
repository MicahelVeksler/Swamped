// Turns "where am I in my day" into recommendation inputs, so the schedule's Close by card,
// the gap blocks on the grid, and the map's suggestion card all agree.

import { CAMPUS_CENTER, PLACES, getBuilding } from '../data/mockBuildings.js';
import { scheduleContext } from './gapFinder.js';
import { recommend } from './recommendations.js';
import { atMinutes, fmtDuration, fmtTime, minutesOf } from './time.js';

const OPEN_ENDED_MINUTES = 120;

const bld = (cls) => getBuilding(cls?.buildingId);

/** Recommendation inputs plus a heading for right now. */
export function planFor(schedule, now, location) {
  const ctx = scheduleContext(schedule, now);
  const here = location.source === 'gps' ? location : null;

  switch (ctx.kind) {
    case 'gap':
      return {
        title: `Free until ${fmtTime(ctx.gap.end)} · ${fmtDuration(ctx.remaining)}`,
        short: `Free until ${fmtTime(ctx.gap.end)}`,
        origin: here ?? bld(ctx.gap.from) ?? location,
        destination: bld(ctx.gap.to),
        nextLabel: ctx.gap.to.location,
        available: ctx.remaining,
        at: now,
        live: true,
      };
    case 'inClass':
      if (ctx.gap) {
        return {
          title: `Next break ${fmtTime(ctx.gap.start)} – ${fmtTime(ctx.gap.end)} (forecast)`,
          short: `Next break at ${fmtTime(ctx.gap.start)}`,
          origin: bld(ctx.gap.from) ?? location,
          destination: bld(ctx.gap.to),
          nextLabel: ctx.gap.to.location,
          available: ctx.gap.minutes,
          at: atMinutes(now, ctx.gap.start),
          live: false,
        };
      }
      return {
        title: `After ${ctx.current.name} (${fmtTime(ctx.current.end)}) · forecast`,
        short: `After ${ctx.current.name}`,
        origin: bld(ctx.current) ?? location,
        available: OPEN_ENDED_MINUTES,
        at: atMinutes(now, ctx.current.end),
        live: false,
      };
    case 'beforeFirst':
      return {
        title: `Before ${ctx.next.name} at ${fmtTime(ctx.next.start)} · ${fmtDuration(ctx.remaining)}`,
        short: `Before ${ctx.next.name} at ${fmtTime(ctx.next.start)}`,
        origin: location,
        destination: bld(ctx.next),
        nextLabel: ctx.next.location,
        available: Math.min(ctx.remaining, 240),
        at: now,
        live: true,
      };
    case 'passing':
      return {
        title: `${ctx.next.name} starts at ${fmtTime(ctx.next.start)}`,
        short: `${ctx.next.name} at ${fmtTime(ctx.next.start)}`,
        message: `Only ${fmtDuration(ctx.remaining)} until class. Head to ${ctx.next.location}.`,
      };
    case 'done':
      return { title: 'Done with classes today', short: 'Done for today', origin: location, available: OPEN_ENDED_MINUTES, at: now, live: true };
    default:
      return { title: 'No classes today', short: 'No classes today', origin: location, available: OPEN_ENDED_MINUTES, at: now, live: true };
  }
}

/** Ranked places for right now (empty when there's no time to go anywhere). */
export function suggestionsNow({ schedule, now, location, examWeek, category = 'all' }) {
  const plan = planFor(schedule, now, location);
  const results = plan.message ? [] : recommend({ places: PLACES, ...plan, category, examWeek });
  return { plan, results };
}

/**
 * Best place for one gap on a given day this week. Uses live crowds if the gap is happening
 * now, otherwise the typical crowd forecast for when the gap starts.
 */
export function suggestionForGap({ gap, date, now, examWeek }) {
  const sameDay = date.toDateString() === now.toDateString();
  const nowMin = minutesOf(now);
  if (sameDay && nowMin >= gap.end) return null; // already over
  const live = sameDay && nowMin >= gap.start;
  const [best] = recommend({
    places: PLACES,
    origin: bld(gap.from) ?? CAMPUS_CENTER,
    destination: bld(gap.to),
    available: live ? gap.end - nowMin : gap.minutes,
    at: live ? now : atMinutes(date, gap.start),
    live,
    examWeek,
  });
  return best ?? null;
}
