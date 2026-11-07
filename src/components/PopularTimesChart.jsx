// Bar chart of typical busyness by hour, with a day dropdown and a live status line (e.g. "A little busy").
import { useEffect, useState } from 'react';
import Dropdown from './Dropdown.jsx';
import { useApp } from '../AppContext.js';
import { busyLabel, dayCurve, isOpen, liveOccupancy, pct, typicalOccupancy } from '../utils/occupancy.js';
import { occupancyColor } from '../utils/occupancyColor.js';
import { DAY_LONG, fmtAxisHour, fmtHour, minutesOf } from '../utils/time.js';

const FIRST_HOUR = 6;
const LAST_HOUR = 23;
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);
const AXIS = [9, 12, 15, 18, 21];
const MAX_BAR = 60;

export default function PopularTimesChart({ place }) {
  const { now, examWeek } = useApp();
  const today = now.getDay();
  const [day, setDay] = useState(today);
  useEffect(() => setDay(today), [today, place.id]);

  const curve = dayCurve(place, day, { examWeek });
  const isToday = day === today;
  const nowHour = now.getHours();
  const openNow = isOpen(place, now);
  const live = openNow ? liveOccupancy(place, now, { examWeek }) : 0;
  const typicalNow = typicalOccupancy(place, today, minutesOf(now), { examWeek });
  const closedAllDay = curve.every((v) => v === 0);
  const peak = curve.indexOf(Math.max(...curve));

  let status;
  if (closedAllDay) status = `Closed on ${DAY_LONG[day]}s`;
  else if (isToday && openNow) status = (
    <>
      <span className="live">Live {fmtHour(nowHour * 60)}:</span> {busyLabel(live, typicalNow)}
    </>
  );
  else if (isToday) status = 'Closed right now';
  else status = `Usually busiest around ${fmtHour(peak * 60)}`;

  return (
    <section className="popular card" aria-label="Popular times">
      <div className="popular-head">
        <h3>Popular times</h3>
        <Dropdown
          ariaLabel="Day"
          label={DAY_LONG[day]}
          value={day}
          onChange={setDay}
          options={DAY_LONG.map((d, i) => ({ value: i, label: d }))}
        />
      </div>
      <p className="popular-status">{status}</p>
      <div className="bars" role="img" aria-label={`Typical busyness on ${DAY_LONG[day]}`}>
        {HOURS.map((h) => {
          const isNow = isToday && h === nowHour && openNow;
          const v = isNow ? live : curve[h];
          return (
            <div className="bar-slot" key={h} title={v ? `${fmtHour(h * 60)}: ${pct(v)}` : `${fmtHour(h * 60)}: closed`}>
              {v > 0 && (
                <span
                  className={isNow ? 'bar now' : 'bar'}
                  style={{ height: Math.max(6, v * MAX_BAR), background: occupancyColor(v) }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="axis" aria-hidden="true">
        {HOURS.map((h) => (
          <span key={h}>{AXIS.includes(h) ? fmtAxisHour(h) : ''}</span>
        ))}
      </div>
    </section>
  );
}
