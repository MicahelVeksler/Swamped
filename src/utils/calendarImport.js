// Turns calendar data (an .ics file, or Google Calendar API events) into weekly classes.
//
// Both sources become "candidates": one per distinct class meeting pattern (name, time,
// location) with the weekdays it meets. The import screen lets the student pick which
// candidates are real classes before anything is added to their schedule.

import { buildingFromLocation } from '../data/mockBuildings.js';
import { minutesOf } from './time.js';

const ICS_DAYS = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
const COURSE_CODE = /\b([A-Z]{3})\s?(\d{4}[A-Z]?)\b/;
const MAX_CLASS_MINUTES = 4 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

// ---------- Shared ----------

function courseName(summary) {
  const m = summary.toUpperCase().match(COURSE_CODE);
  if (m) return `${m[1]}${m[2]}`;
  return summary.trim().slice(0, 14) || 'Class';
}

/** Cleans a raw calendar location into "CODE ROOM" when the building is recognized. */
function normalizeLocation(raw) {
  const text = (raw || '').replace(/\\,/g, ',').replace(/\s+/g, ' ').trim();
  const building = buildingFromLocation(text);
  if (!building) return { location: text.slice(0, 24), buildingId: null };
  if (!building.code) return { location: building.short, buildingId: building.id }; // a campus place
  const first = text.split(/[\s,]+/)[0].toUpperCase();
  if (first === building.code || building.aliases?.includes(first)) {
    return { location: text.toUpperCase().slice(0, 24), buildingId: building.id };
  }
  const room = text.match(/\b([A-Z]?\d{3,4}[A-Z]?)\b/i)?.[1]?.toUpperCase();
  return { location: room ? `${building.code} ${room}` : building.code, buildingId: building.id };
}

/**
 * Groups meetings into candidates.
 * @param {{summary, location, start: Date, end: Date, recurring: boolean, days?: number[]}[]} meetings
 */
function toCandidates(meetings) {
  const byKey = new Map();
  for (const m of meetings) {
    const start = minutesOf(m.start);
    const end = minutesOf(m.end);
    if (end <= start || end - start > MAX_CLASS_MINUTES) continue;
    const days = (m.days ?? [m.start.getDay()]).filter((d) => d >= 1 && d <= 5);
    if (!days.length) continue;

    const summary = (m.summary || '').replace(/\\,/g, ',').trim() || 'Untitled';
    const key = `${summary}|${start}|${end}|${m.location ?? ''}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.days = [...new Set([...existing.days, ...days])].sort();
      existing.recurring ||= m.recurring;
      existing.occurrences += 1;
      continue;
    }
    byKey.set(key, {
      key,
      title: summary,
      name: courseName(summary),
      start,
      end,
      days: [...days].sort(),
      ...normalizeLocation(m.location),
      recurring: m.recurring,
      occurrences: 1,
    });
  }

  return [...byKey.values()]
    .map((c) => ({
      ...c,
      // Pre-check things that look like classes: a course code, or something that repeats on
      // several days a week. A once-a-week club meeting or a one-off appointment is left unticked.
      likelyClass: COURSE_CODE.test(c.title.toUpperCase()) || (c.recurring && c.days.length > 1),
    }))
    .sort((a, b) => a.days[0] - b.days[0] || a.start - b.start);
}

/** The Monday-to-Saturday window of the current school week (next week on weekends). */
export function schoolWeek(today = new Date()) {
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  const dow = monday.getDay();
  monday.setDate(monday.getDate() + (dow === 0 ? 1 : dow === 6 ? 2 : 1 - dow));
  const saturday = new Date(monday.getTime() + 5 * DAY_MS);
  return { from: monday, to: saturday };
}

// ---------- .ics files ----------

function unfold(text) {
  return text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
}

function parseIcsDate(value) {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (h === undefined) return { allDay: true, date: new Date(+y, +mo - 1, +d) };
  // Times with a TZID are taken as local wall-clock time (students and campus share a time zone).
  const date = z
    ? new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s))
    : new Date(+y, +mo - 1, +d, +h, +mi, +s);
  return { allDay: false, date };
}

function parseRrule(value) {
  return Object.fromEntries(value.split(';').map((part) => part.split('=')));
}

/**
 * Parses an iCalendar (.ics) file. Weekly repeating events become classes; one-off events
 * near today are grouped by time and title so a class exported as single events still works.
 */
export function parseIcs(text, now = new Date()) {
  const lines = unfold(text).split('\n');
  const meetings = [];
  let ev = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      ev = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (ev) meetings.push(ev);
      ev = null;
      continue;
    }
    if (!ev) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const [name] = line.slice(0, colon).split(';');
    const value = line.slice(colon + 1);
    if (name === 'SUMMARY') ev.summary = value;
    else if (name === 'LOCATION') ev.location = value;
    else if (name === 'DTSTART') ev.dtstart = parseIcsDate(value);
    else if (name === 'DTEND') ev.dtend = parseIcsDate(value);
    else if (name === 'RRULE') ev.rrule = parseRrule(value);
    else if (name === 'RECURRENCE-ID') ev.isException = true;
    else if (name === 'STATUS') ev.cancelled = value === 'CANCELLED';
  }

  const windowStart = now.getTime() - 21 * DAY_MS;
  const windowEnd = now.getTime() + 60 * DAY_MS;
  const out = [];

  for (const ev of meetings) {
    if (!ev.dtstart || ev.dtstart.allDay || ev.isException || ev.cancelled) continue;
    const start = ev.dtstart.date;
    const end = ev.dtend?.date ?? new Date(start.getTime() + 50 * 60 * 1000);

    if (ev.rrule?.FREQ === 'WEEKLY') {
      const until = ev.rrule.UNTIL ? parseIcsDate(ev.rrule.UNTIL)?.date : null;
      if (until && until.getTime() < now.getTime() - DAY_MS) continue; // an old semester
      const days = ev.rrule.BYDAY
        ? ev.rrule.BYDAY.split(',').map((d) => ICS_DAYS[d.slice(-2)]).filter((d) => d !== undefined)
        : [start.getDay()];
      out.push({ summary: ev.summary, location: ev.location, start, end, days, recurring: true });
    } else if (!ev.rrule && start.getTime() >= windowStart && start.getTime() <= windowEnd) {
      out.push({ summary: ev.summary, location: ev.location, start, end, recurring: false });
    }
  }
  return toCandidates(out);
}

// ---------- Google Calendar API ----------

/** Converts Google Calendar API event resources (singleEvents=true) into candidates. */
export function fromGoogleEvents(events) {
  return toCandidates(
    events
      .filter((e) => e.status !== 'cancelled' && e.start?.dateTime && e.end?.dateTime)
      .map((e) => ({
        summary: e.summary,
        location: e.location,
        start: new Date(e.start.dateTime),
        end: new Date(e.end.dateTime),
        recurring: Boolean(e.recurringEventId),
      })),
  );
}
