// "Close by" card under the schedule: where to go during the current (or next) gap.
import { useState } from 'react';
import Icon from './Icon.jsx';
import PlaceStats from './PlaceStats.jsx';
import { useApp } from '../AppContext.js';
import { CATEGORIES } from '../data/mockBuildings.js';
import { suggestionsNow } from '../utils/plan.js';
import { fmtDuration, fmtTime, minutesOf } from '../utils/time.js';

const SHOWN = 3;
const SHOWN_MORE = 7;

export default function CloseBy() {
  const { now, examWeek, location, schedule, showOnMap } = useApp();
  const [category, setCategory] = useState('all');
  const [more, setMore] = useState(false);

  const { plan, results } = suggestionsNow({ schedule: schedule.classes, now, location, examWeek, category });
  const shown = results.slice(0, more ? SHOWN_MORE : SHOWN);

  return (
    <section className="closeby card" aria-label="Close by">
      <div className="closeby-head">
        <h2>Close by</h2>
        <p className="closeby-sub">{plan.title}</p>
      </div>

      {!plan.message && (
        <div className="chips" role="radiogroup" aria-label="Kind of place">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              role="radio"
              aria-checked={category === c.id}
              className={category === c.id ? 'chip selected' : 'chip'}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {plan.message && <p className="closeby-empty">{plan.message}</p>}
      {!plan.message && results.length === 0 && (
        <p className="closeby-empty">
          Nothing {category === 'all' ? '' : `in ${CATEGORIES.find((c) => c.id === category).label} `}
          fits this gap. It may be too short to be worth the walk.
        </p>
      )}

      <ul className="closeby-list">
        {shown.map((r) => (
          <li key={r.place.id}>
            <button className="closeby-row" onClick={() => showOnMap(r.place.id)}>
              <Icon name="location24" />
              <span className="closeby-main">
                <span className="closeby-line">
                  <span className="closeby-name">{r.place.name}</span>
                  <PlaceStats miles={r.there.miles} occupancy={r.occ} />
                </span>
                <span className="closeby-why">
                  {r.there.minutes} min walk · ~{fmtDuration(r.stay)} there
                  {plan.destination && ` · ${r.onward.minutes} min to ${plan.nextLabel}`}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {results.length > SHOWN && (
        <button className="more-btn" onClick={() => setMore((m) => !m)}>
          {more ? 'Fewer options' : 'More options'}
        </button>
      )}
      {!plan.live && !plan.message && (
        <p className="closeby-note">Crowd levels are the typical forecast for {fmtTime(minutesOf(plan.at))}.</p>
      )}
    </section>
  );
}
