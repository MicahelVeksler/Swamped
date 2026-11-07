// Shared "walk distance · occupancy · hours" row used in Close by and Bookmarks.
import Icon from './Icon.jsx';
import { fmtMiles } from '../utils/geo.js';
import { pct } from '../utils/occupancy.js';

export function OpenStatus({ status }) {
  return (
    <span className="hours">
      <b className={status.open ? 'open' : 'closed'}>{status.open ? 'Open' : 'Closed'}</b>
      <span>{status.text}</span>
    </span>
  );
}

export default function PlaceStats({ miles, occupancy, status }) {
  return (
    <span className="stats">
      <span className="stat">
        <Icon name="walk" />
        {fmtMiles(miles)}
      </span>
      <span className="stat">
        <Icon name="people" />
        {status && !status.open ? '–' : pct(occupancy)}
      </span>
      {status && <OpenStatus status={status} />}
    </span>
  );
}
