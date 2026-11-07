// List of saved locations with distance and current occupancy, sortable by distance or capacity.
import Dropdown from '../components/Dropdown.jsx';
import Icon from '../components/Icon.jsx';
import PlaceStats from '../components/PlaceStats.jsx';
import { useApp } from '../AppContext.js';
import { getBuilding } from '../data/mockBuildings.js';
import { walk } from '../utils/geo.js';
import { hoursStatus, liveOccupancy } from '../utils/occupancy.js';
import useLocalStorage from '../hooks/useLocalStorage.js';

const SORTS = [
  { value: 'distance', label: 'Distance' },
  { value: 'occupancy', label: 'Least busy' },
  { value: 'name', label: 'Name' },
];

export default function BookmarksScreen() {
  const { now, examWeek, location, bookmarks, showOnMap, toast } = useApp();
  const [sort, setSort] = useLocalStorage('swamped.bookmarkSort', 'distance');

  const rows = bookmarks.ids
    .map(getBuilding)
    .filter(Boolean)
    .map((place) => {
      const status = hoursStatus(place, now);
      return {
        place,
        status,
        trip: walk(location, place),
        occ: status.open ? liveOccupancy(place, now, { examWeek }) : 0,
      };
    });

  rows.sort((a, b) => {
    if (sort === 'name') return a.place.name.localeCompare(b.place.name);
    if (sort === 'occupancy') {
      // Closed places go last; they are not an option right now.
      if (a.status.open !== b.status.open) return a.status.open ? -1 : 1;
      return a.occ - b.occ;
    }
    return a.trip.miles - b.trip.miles;
  });

  const remove = (place) => {
    const undo = bookmarks.remove(place.id);
    toast(`${place.name} removed`, { label: 'Undo', onClick: undo });
  };

  return (
    <div className="bookmarks-screen">
      <header className="bm-header">
        <h1 className="sr-only">Bookmarks</h1>
        <Dropdown
          size="large"
          label="Sort"
          ariaLabel={`Sort by ${SORTS.find((s) => s.value === sort)?.label}`}
          value={sort}
          onChange={setSort}
          options={SORTS}
        />
      </header>

      {rows.length === 0 && (
        <div className="bm-empty">
          <Icon name="navBookmark" />
          <p>No bookmarks yet.</p>
          <p className="muted">Tap a building on the map, then the bookmark button, to keep it here.</p>
          <button className="add-btn" onClick={() => showOnMap(null)}>Open map</button>
        </div>
      )}

      <ul className="bm-list">
        {rows.map(({ place, status, trip, occ }) => (
          <li key={place.id} className="bm-card">
            <div className="bm-top">
              <button className="bm-open" onClick={() => showOnMap(place.id)}>
                <Icon name="location24" />
                <span className="bm-name">{place.name}</span>
              </button>
              <button className="icon-btn" aria-label={`Remove ${place.name}`} onClick={() => remove(place)}>
                <Icon name="close16" />
              </button>
            </div>
            <button className="bm-stats" onClick={() => showOnMap(place.id)} tabIndex={-1}>
              <PlaceStats miles={trip.miles} occupancy={occ} status={status} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
