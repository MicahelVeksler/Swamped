// Weekly class grid (Mon-Fri) with a "now" marker and a "Close by" list of recommended places for the current gap.
import { useState } from 'react';
import AddClassModal from './AddClassModal.jsx';
import ImportModal from './ImportModal.jsx';
import CloseBy from '../components/CloseBy.jsx';
import DemoClock from '../components/DemoClock.jsx';
import Icon from '../components/Icon.jsx';
import { useApp } from '../AppContext.js';
import { MIN_GAP, classesOn, findGaps } from '../utils/gapFinder.js';
import { pct } from '../utils/occupancy.js';
import { occupancyColor } from '../utils/occupancyColor.js';
import { suggestionForGap } from '../utils/plan.js';
import { WEEKDAYS, WEEKDAY_LETTER, fmtDuration, fmtDurationShort, fmtRange, fmtTimeTight, minutesOf } from '../utils/time.js';

const HOUR_PX = 82; // a bit taller than the Figma rows (71px) so a 50-minute card fits its room number
const SNAP = 5;

function hourLabel(h) {
  return String(h % 12 === 0 ? 12 : h % 12);
}

/** The date of weekday `d` in the week being shown (next week if it's the weekend). */
function dateOfWeekday(now, d) {
  const today = now.getDay();
  const offset = today === 0 ? d : today === 6 ? d + 1 : d - today;
  const date = new Date(now);
  date.setDate(date.getDate() + offset);
  return date;
}

function ImportIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h9M8 3v4M16 3v4" strokeLinecap="round" />
      <path d="M17 11v7M14.5 15.5 17 18l2.5-2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ScheduleScreen() {
  const { now, examWeek, schedule, showOnMap } = useApp();
  const [modal, setModal] = useState(null); // null | {} (new) | {day,start} | class
  const [importing, setImporting] = useState(false);

  const classes = schedule.classes;
  const firstHour = Math.min(9, ...classes.map((c) => Math.floor(c.start / 60)));
  const lastHour = Math.max(15, ...classes.map((c) => Math.ceil(c.end / 60)));
  const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, i) => firstHour + i);
  const height = (lastHour - firstHour) * HOUR_PX;
  const y = (minutes) => ((minutes - firstHour * 60) / 60) * HOUR_PX;

  const today = now.getDay();
  const nowMin = minutesOf(now);
  const showNow = WEEKDAYS.includes(today) && nowMin >= firstHour * 60 && nowMin <= lastHour * 60;

  // Best place for every free gap this week, based on the crowd forecast for that time.
  const gapBlocks = WEEKDAYS.flatMap((d) => {
    const date = dateOfWeekday(now, d);
    return findGaps(classesOn(classes, d))
      .filter((g) => g.minutes >= MIN_GAP)
      .map((gap) => ({ d, gap, best: suggestionForGap({ gap, date, now, examWeek }) }));
  });

  // Tap an empty spot to add a class at that day and time.
  const onGridClick = (e) => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.min(4, Math.floor(((e.clientX - rect.left) / rect.width) * 5));
    const raw = firstHour * 60 + ((e.clientY - rect.top) / HOUR_PX) * 60;
    const start = Math.round(raw / SNAP) * SNAP;
    setModal({ day: WEEKDAYS[col], start, end: start + 50 });
  };

  return (
    <div className="schedule-screen">
      <header className="sched-header">
        <DemoClock />
        <span className="sched-actions">
          <button className="icon-btn plus-btn" aria-label="Import schedule" title="Import from Google Calendar or a file" onClick={() => setImporting(true)}>
            <ImportIcon />
          </button>
          <button className="icon-btn plus-btn" aria-label="Add class" onClick={() => setModal({})}>
            <Icon name="plus24" />
          </button>
        </span>
      </header>

      <div className="week">
        <div className="day-letters" aria-hidden="true">
          {WEEKDAYS.map((d) => (
            <span key={d} className={d === today ? 'today' : ''}>
              {WEEKDAY_LETTER[d]}
            </span>
          ))}
        </div>

        <div className="week-body" style={{ height }}>
          <div className="hour-labels" aria-hidden="true">
            {hours.map((h) => (
              <span key={h} style={{ top: y(h * 60) }}>
                {hourLabel(h)}
              </span>
            ))}
          </div>

          <div className="grid" onClick={onGridClick} role="presentation">
            {hours.map((h) => (
              <span key={h} className="hline" style={{ top: y(h * 60) }} />
            ))}
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className="vline" style={{ left: `${i * 20}%` }} />
            ))}

            {gapBlocks.map(({ d, gap, best }) => {
              const h = y(gap.end) - y(gap.start) - 6;
              return (
                <button
                  key={`${d}-${gap.start}`}
                  className={best ? 'gap-card' : 'gap-card empty'}
                  style={{ top: y(gap.start) + 3, height: h, left: `calc(${(d - 1) * 20}% + 2px)` }}
                  disabled={!best}
                  aria-label={
                    best
                      ? `Free ${fmtDuration(gap.minutes)}. Suggested: ${best.place.name}, ${pct(best.occ)} full. Show on map`
                      : `Free ${fmtDuration(gap.minutes)}. Too short to go anywhere.`
                  }
                  onClick={() => best && showOnMap(best.place.id)}
                >
                  {h >= 46 && <span className="gap-free">{fmtDurationShort(gap.minutes)} free</span>}
                  {best ? (
                    <span className="gap-pick">
                      <span className="swatch" style={{ background: occupancyColor(best.occ) }} />
                      <span className="gap-name">{best.place.short}</span>
                      {h >= 30 && <span className="gap-pct">{pct(best.occ)}</span>}
                    </span>
                  ) : (
                    <span className="gap-free">Stay close</span>
                  )}
                </button>
              );
            })}

            {classes.flatMap((c) =>
              c.days.filter((d) => WEEKDAYS.includes(d)).map((d) => (
                <button
                  key={`${c.id}-${d}`}
                  className="class-card"
                  style={{
                    top: y(c.start),
                    height: Math.max(28, y(c.end) - y(c.start)),
                    left: `calc(${(d - 1) * 20}% + 2px)`,
                    background: c.color,
                  }}
                  aria-label={`${c.name}, ${fmtRange(c.start, c.end)}, ${c.location}. Edit`}
                  onClick={() => setModal(c)}
                >
                  <b>{c.name}</b>
                  <span>{fmtRange(c.start, c.end)}</span>
                  <span className="class-loc">
                    <Icon name="location16" />
                    <span>{c.location}{!c.buildingId && ' ?'}</span>
                  </span>
                </button>
              )),
            )}

            {showNow && (
              <div className="now-line" style={{ top: y(nowMin), left: `${(today - 1) * 20}%` }}>
                <span className="now-bar" />
                <span className="now-label">{fmtTimeTight(nowMin)}</span>
              </div>
            )}

            {classes.length === 0 && (
              <div className="grid-empty">
                <p>Add your classes with +, or import them.</p>
                <button className="add-btn" onClick={() => setImporting(true)}>Import schedule</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CloseBy />

      {modal && <AddClassModal initial={modal} onClose={() => setModal(null)} />}
      {importing && <ImportModal onClose={() => setImporting(false)} />}
    </div>
  );
}
