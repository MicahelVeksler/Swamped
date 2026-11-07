// Ranks nearby buildings by walk time, occupancy, and gap length to suggest where to go.
//
// Based on the interviews:
//  - Short gaps (about an hour): proximity matters most, and a place on the way to the next
//    class is ideal ("a good midpoint between locations of importance").
//  - Longer gaps: students will walk farther if it is worth it, so crowding matters more.
//  - A place is only worth it if there is real time left once you get there.

import { walk } from './geo.js';
import { isOpenAt, liveOccupancy, minutesUntilClose, typicalOccupancy } from './occupancy.js';
import { minutesOf } from './time.js';

// Least time worth spending at each kind of place.
const MIN_STAY = { study: 20, food: 15, gym: 40, outdoor: 10 };
const TOO_FULL = 0.92;

/**
 * @param {object} p
 * @param {object[]} p.places      candidate places
 * @param {{lat,lng}} p.origin     where the student starts (class just ended, or their location)
 * @param {{lat,lng}} [p.destination] next class, if any
 * @param {number} p.available     minutes until they need to be at the next class
 * @param {Date} p.at              when they'd leave (now, or the start of a future gap)
 * @param {boolean} p.live         use live occupancy (now) or the typical forecast (later)
 * @param {string} [p.category]    'all' or a place category
 * @param {boolean} [p.examWeek]
 */
export function recommend({ places, origin, destination, available, at, live, category = 'all', examWeek = false }) {
  const day = at.getDay();
  const m = minutesOf(at);
  const shortGap = available < 75;
  const results = [];

  for (const place of places) {
    if (category !== 'all' && place.category !== category) continue;
    if (!isOpenAt(place, day, m)) continue;

    const there = walk(origin, place);
    const onward = destination ? walk(place, destination) : { minutes: 0, miles: 0 };
    const travel = there.minutes + onward.minutes;
    const stay = available - travel;
    if (stay < (MIN_STAY[place.category] ?? 15)) continue;
    if (minutesUntilClose(place, day, m) < Math.min(stay, 30)) continue;

    const occ = live
      ? liveOccupancy(place, at, { examWeek })
      : typicalOccupancy(place, day, m, { examWeek });
    if (occ > TOO_FULL) continue;

    const travelScore = 1 - Math.min(1, travel / (shortGap ? 20 : 45));
    const roomScore = 1 - occ;
    const timeScore = Math.min(1, stay / 90);
    const base = shortGap
      ? 0.55 * travelScore + 0.3 * roomScore + 0.15 * timeScore
      : 0.35 * travelScore + 0.4 * roomScore + 0.25 * timeScore;
    // Open-air spots depend on the weather, so rank them a little lower than indoor ones.
    const score = place.category === 'outdoor' ? base * 0.9 : base;

    results.push({ place, there, onward, stay, occ, score });
  }

  return results.sort((a, b) => b.score - a.score);
}
