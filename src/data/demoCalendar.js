// Sample Google Calendar week used when the app has no Google client ID configured, so the
// "Connect Google Calendar" flow can be demoed end to end. Shaped like Google Calendar API
// event resources so it goes through the same import code as a real calendar.

const DAY_MS = 24 * 60 * 60 * 1000;

const EVENTS = [
  // [summary, weekdays (1 = Mon), start "H:MM" 24h, minutes, location, weekly?]
  ['CEN4721 - Human-Computer Interaction', [1, 3, 5], '9:35', 50, 'MALA 1000', true],
  ['CAP3027 - Data Visualization', [1, 3, 5], '10:40', 50, 'CSE E121', true],
  ['ENC3246 - Professional Communication for Engineers', [1, 3, 5], '12:50', 50, 'AH 2109', true],
  ['CEN4722 - User Experience Design', [1, 3, 5], '13:55', 50, 'NEB 0202', true],
  ['COP 3530 Data Structures', [2, 4], '10:40', 75, 'Turlington Hall, Room L005', true],
  ['Gator Robotics meeting', [4], '18:00', 90, 'Reitz Union', true],
  ['Gym with Sam', [2], '17:00', 60, 'Southwest Recreation Center', false],
  ['Dentist', [5], '16:00', 60, 'Gainesville Dental', false],
];

export function demoGoogleEvents({ from }) {
  const out = [];
  for (const [summary, days, time, minutes, location, weekly] of EVENTS) {
    const [h, m] = time.split(':').map(Number);
    for (const d of days) {
      const start = new Date(from.getTime() + (d - 1) * DAY_MS);
      start.setHours(h, m, 0, 0);
      out.push({
        summary,
        location,
        status: 'confirmed',
        recurringEventId: weekly ? `demo-${summary}` : undefined,
        start: { dateTime: start.toISOString() },
        end: { dateTime: new Date(start.getTime() + minutes * 60 * 1000).toISOString() },
      });
    }
  }
  return out;
}
