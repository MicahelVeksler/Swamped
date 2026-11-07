// Small "what time is it" chip. Lets a presenter pin the app to a specific weekday and time
// (and turn on exam week) so the schedule and recommendations can be demoed any time.
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext.js';
import { DAY_LONG, DAY_SHORT, fmtTime, minutesOf } from '../utils/time.js';

const PRESETS = [
  { label: 'Mon 11:40 AM · between classes', day: 1, minutes: 11 * 60 + 40 },
  { label: 'Mon 2:31 PM · in class', day: 1, minutes: 14 * 60 + 31 },
  { label: 'Tue 1:00 PM · no classes', day: 2, minutes: 13 * 60 },
];

const toInput = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export default function DemoClock() {
  const { now, demo, setDemo, examWeek, setExamWeek } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const day = now.getDay();
  const minutes = minutesOf(now);

  return (
    <div className="demo-clock" ref={ref}>
      <button
        className={`clock-chip${demo ? ' demo' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title="Change the time used for the schedule and suggestions"
      >
        <span className="clock-dot" />
        {demo ? 'Demo' : 'Live'} · {DAY_SHORT[day]} {fmtTime(minutes)}
        {examWeek && <span className="exam-tag">Exams</span>}
      </button>
      {open && (
        <div className="clock-pop" role="dialog" aria-label="Time settings">
          <p className="pop-title">Pretend it is…</p>
          <div className="pop-row">
            <select
              aria-label="Day"
              value={day}
              onChange={(e) => setDemo({ day: Number(e.target.value), minutes })}
            >
              {DAY_LONG.map((d, i) => (
                <option key={d} value={i}>{d}</option>
              ))}
            </select>
            <input
              type="time"
              aria-label="Time"
              value={toInput(minutes)}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                if (!Number.isNaN(h)) setDemo({ day, minutes: h * 60 + (m || 0) });
              }}
            />
          </div>
          <div className="pop-presets">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => setDemo({ day: p.day, minutes: p.minutes })}>
                {p.label}
              </button>
            ))}
          </div>
          <label className="pop-check">
            <input type="checkbox" checked={examWeek} onChange={(e) => setExamWeek(e.target.checked)} />
            Exam week (libraries fill up)
          </label>
          <button className="pop-reset" disabled={!demo} onClick={() => setDemo(null)}>
            Use real time
          </button>
        </div>
      )}
    </div>
  );
}
