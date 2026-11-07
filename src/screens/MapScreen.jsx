// Home screen: interactive campus map with search, zoom, color-coded buildings, and walking directions.
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Basemap from '../components/Basemap.jsx';
import BuildingSheet from '../components/BuildingSheet.jsx';
import Icon from '../components/Icon.jsx';
import { useApp } from '../AppContext.js';
import { CAMPUS_CENTER, PLACES, getBuilding } from '../data/mockBuildings.js';
import { hoursStatus, isOpen, liveOccupancy, pct } from '../utils/occupancy.js';
import { suggestionsNow } from '../utils/plan.js';
import { fmtDuration } from '../utils/time.js';
import { CLOSED_COLOR, occupancyColor } from '../utils/occupancyColor.js';

// Leaflet can fire a delayed zoom-end after its map is removed; ignore it instead of throwing.
const zoomEnd = L.Map.prototype._onZoomTransitionEnd;
L.Map.prototype._onZoomTransitionEnd = function safeZoomEnd() {
  if (this._mapPane) zoomEnd.call(this);
};

const BOUNDS = L.latLngBounds([29.628, -82.38], [29.662, -82.325]);
const SHEET_OFFSET_PX = 130;

function pillIcon(label, color, selected, suggested) {
  const cls = `pill${selected ? ' selected' : ''}${suggested ? ' suggested' : ''}`;
  const star = suggested ? '<span class="pill-star" aria-hidden="true">★</span>' : '';
  return L.divIcon({
    className: 'pill-anchor',
    iconSize: null,
    html: `<span class="${cls}" style="background:${color}">${star}${label}</span>`,
  });
}

/** Floating card: the best place to go right now, based on your schedule and how busy places are. */
function SuggestionCard({ plan, best, onOpen, onDismiss }) {
  return (
    <div className="suggest-card" role="region" aria-label="Suggested now">
      <button className="suggest-main" onClick={onOpen} disabled={!best}>
        <span className="suggest-kicker">Suggested now · {plan.short}</span>
        {best ? (
          <>
            <span className="suggest-name">
              <span className="swatch" style={{ background: occupancyColor(best.occ) }} />
              {best.place.name}
            </span>
            <span className="suggest-why">
              {pct(best.occ)} full · {best.there.minutes} min walk · ~{fmtDuration(best.stay)} there
            </span>
          </>
        ) : (
          <span className="suggest-why">{plan.message}</span>
        )}
      </button>
      <button className="icon-btn" aria-label="Hide suggestion" onClick={onDismiss}>
        <Icon name="close16" />
      </button>
    </div>
  );
}

const youIcon = L.divIcon({ className: 'pill-anchor', iconSize: null, html: '<span class="you-dot"></span>' });

function MapClicks({ onClick }) {
  useMapEvents({ click: onClick });
  return null;
}

function SearchBar({ onPick }) {
  const { now, examWeek } = useApp();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const q = query.trim().toLowerCase();
  const results = q
    ? PLACES.filter((p) =>
        [p.name, p.short, ...(p.tags ?? [])].some((s) => s.toLowerCase().includes(q)),
      ).slice(0, 6)
    : [];

  const pick = (place) => {
    setQuery('');
    setFocused(false);
    document.activeElement?.blur();
    onPick(place.id);
  };

  return (
    <div className="map-search">
      <form
        className="search-bar"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) pick(results[0]);
        }}
      >
        <input
          value={query}
          placeholder="Search"
          aria-label="Search buildings"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
        />
        <button type="submit" className="icon-btn" aria-label="Search">
          <Icon name="search" />
        </button>
      </form>
      {focused && q && (
        <ul className="search-results">
          {results.length === 0 && <li className="empty">No places match “{query}”</li>}
          {results.map((p) => {
            const open = isOpen(p, now);
            const occ = liveOccupancy(p, now, { examWeek });
            return (
              <li key={p.id}>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => pick(p)}>
                  <span className="swatch" style={{ background: open ? occupancyColor(occ) : CLOSED_COLOR }} />
                  <span className="name">{p.name}</span>
                  <span className="meta">{open ? pct(occ) : 'Closed'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function MapScreen({ active = true }) {
  const { now, examWeek, location, locate, stopLocating, locating, selectedId, setSelectedId, schedule } = useApp();
  const [map, setMap] = useState(null);
  const [hideSuggestion, setHideSuggestion] = useState(false);
  const { plan, results } = suggestionsNow({ schedule: schedule.classes, now, location, examWeek });
  const best = results[0] ?? null;
  const suggestedId = best?.place.id ?? null;
  const [expanded, setExpanded] = useState(false);
  const firstFly = useRef(true);
  const selected = selectedId ? getBuilding(selectedId) : null;

  // Fly to the selected building, leaving room for the sheet at the bottom.
  useEffect(() => {
    if (!map || !selected) return;
    const zoom = Math.max(map.getZoom(), 17);
    const point = map.project([selected.lat, selected.lng], zoom).add([0, SHEET_OFFSET_PX]);
    const target = map.unproject(point, zoom);
    if (firstFly.current) map.setView(target, zoom);
    else map.flyTo(target, zoom, { duration: 0.6 });
    firstFly.current = false;
  }, [map, selected]);

  useEffect(() => setExpanded(false), [selectedId]);

  // The map is hidden (not unmounted) on other tabs; resize it when it comes back.
  useEffect(() => {
    if (active) map?.invalidateSize();
  }, [active, map]);

  // Once GPS location arrives, show it.
  useEffect(() => {
    if (map && location.source === 'gps') {
      map.flyTo([location.lat, location.lng], Math.max(map.getZoom(), 17), { duration: 0.6 });
    }
  }, [map, location.source, location.lat, location.lng]);

  const markers = useMemo(
    () =>
      PLACES.map((p) => {
        const open = isOpen(p, now);
        const occ = open ? liveOccupancy(p, now, { examWeek }) : 0;
        const status = hoursStatus(p, now);
        return {
          place: p,
          title: `${p.name}: ${open ? `${pct(occ)} full` : `closed, ${status.text}`}`,
          icon: pillIcon(p.short, open ? occupancyColor(occ) : CLOSED_COLOR, p.id === selectedId, p.id === suggestedId),
        };
      }),
    [now, examWeek, selectedId, suggestedId],
  );

  return (
    <div className="map-screen" hidden={!active}>
      <MapContainer
        ref={setMap}
        center={[29.6475, -82.3455]}
        zoom={16}
        minZoom={14}
        maxZoom={19}
        maxBounds={BOUNDS}
        maxBoundsViscosity={0.8}
        zoomControl={false}
        attributionControl
        className="map"
      >
        <Basemap />
        <MapClicks onClick={() => setSelectedId(null)} />
        {markers.map(({ place, icon, title }) => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={icon}
            title={title}
            alt={title}
            zIndexOffset={place.id === selectedId ? 1000 : 0}
            eventHandlers={{ click: () => setSelectedId(place.id) }}
          />
        ))}
        <Marker position={[location.lat, location.lng]} icon={youIcon} title={location.label} interactive={false} zIndexOffset={-1000} />
        {selected && (
          <Polyline
            positions={[[location.lat, location.lng], [selected.lat, selected.lng]]}
            pathOptions={{ color: '#2b7fd9', weight: 4, dashArray: '2 9', lineCap: 'round' }}
            interactive={false}
          />
        )}
      </MapContainer>

      <SearchBar onPick={setSelectedId} />

      <div className="map-controls">
        <div className="zoom-box">
          <button aria-label="Zoom in" onClick={() => map?.zoomIn()}>
            <Icon name="zoomPlus" />
          </button>
          <span className="zoom-divider" />
          <button aria-label="Zoom out" onClick={() => map?.zoomOut()}>
            <Icon name="zoomMinus" />
          </button>
        </div>
        <button
          className={`locate-btn${location.source === 'gps' ? ' active' : ''}${locating ? ' busy' : ''}`}
          aria-label={location.source === 'gps' ? 'Turn off my location' : 'Use my location'}
          aria-pressed={location.source === 'gps'}
          title={location.source === 'gps' ? 'Location on. Tap to turn off.' : `Location off. Distances are from ${CAMPUS_CENTER.label}.`}
          onClick={() => (location.source === 'gps' ? stopLocating() : locate())}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="8" r="1.75" fill="currentColor" />
            <path d="M8 1v2.5M8 12.5V15M1 8h2.5M12.5 8H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {!selected && !hideSuggestion && (best || plan.message) && (
        <SuggestionCard
          plan={plan}
          best={best}
          onOpen={() => best && setSelectedId(best.place.id)}
          onDismiss={() => setHideSuggestion(true)}
        />
      )}

      {selected && (
        <BuildingSheet
          key={selected.id}
          place={selected}
          expanded={expanded}
          onExpandedChange={setExpanded}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
