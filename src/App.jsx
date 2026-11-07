// Root component: owns shared state, tracks the active tab, and renders the matching screen.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TabBar from './components/TabBar.jsx';
import StatusBar from './components/StatusBar.jsx';
import MapScreen from './screens/MapScreen.jsx';
import ScheduleScreen from './screens/ScheduleScreen.jsx';
import BookmarksScreen from './screens/BookmarksScreen.jsx';
import { AppContext } from './AppContext.js';
import { getBuilding } from './data/mockBuildings.js';
import useBookmarks from './hooks/useBookmarks.js';
import useClock from './hooks/useClock.js';
import useSchedule from './hooks/useSchedule.js';
import useUserLocation from './hooks/useUserLocation.js';

const PHONE_W = 402;
const PHONE_H = 874;
const BEZEL = 10;

/**
 * On a computer the app is shown as an iPhone 17 Pro (402x874). If the window is too small,
 * scale the whole phone down evenly instead of squashing its height, so it keeps its shape.
 */
function usePhoneScale() {
  const read = () => {
    const desktop = window.innerWidth > 500;
    const scale = desktop
      ? Math.min(1, (window.innerHeight - 40) / (PHONE_H + 2 * BEZEL), (window.innerWidth - 32) / (PHONE_W + 2 * BEZEL))
      : 1;
    return { desktop, scale };
  };
  const [state, setState] = useState(read);
  useEffect(() => {
    const onResize = () => setState(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return state;
}

// A shared link like ?b=marston opens that building on the map.
function initialBuilding() {
  const id = new URLSearchParams(window.location.search).get('b');
  return id && getBuilding(id)?.capacity ? id : null;
}

export default function App() {
  const [tab, setTab] = useState('map');
  const [selectedId, setSelectedId] = useState(initialBuilding);
  const [toastState, setToastState] = useState(null);
  const toastTimer = useRef(null);

  const toast = useCallback((message, action) => {
    clearTimeout(toastTimer.current);
    setToastState({ message, action, key: Date.now() });
    toastTimer.current = setTimeout(() => setToastState(null), action ? 5000 : 2500);
  }, []);

  const { desktop, scale } = usePhoneScale();
  const clock = useClock();
  const schedule = useSchedule();
  const bookmarks = useBookmarks();
  const { location, locate, stopLocating, locating } = useUserLocation(toast);

  const showOnMap = useCallback((id) => {
    setSelectedId(id);
    setTab('map');
  }, []);

  // Keep the URL in sync so the current building can be shared or reloaded.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedId) url.searchParams.set('b', selectedId);
    else url.searchParams.delete('b');
    window.history.replaceState(null, '', url);
  }, [selectedId]);

  const value = useMemo(
    () => ({
      ...clock,
      schedule,
      bookmarks,
      location,
      locate,
      stopLocating,
      locating,
      selectedId,
      setSelectedId,
      showOnMap,
      toast,
    }),
    [clock, schedule, bookmarks, location, locate, stopLocating, locating, selectedId, showOnMap, toast],
  );

  return (
    <AppContext.Provider value={value}>
      <div
        className="phone-stage"
        style={
          desktop
            ? { width: (PHONE_W + 2 * BEZEL) * scale, height: (PHONE_H + 2 * BEZEL) * scale, padding: BEZEL * scale }
            : undefined
        }
      >
      <div className="phone" style={desktop && scale < 1 ? { transform: `scale(${scale})` } : undefined}>
        <StatusBar />
        <main className={`screen screen-${tab}`}>
          {/* The map stays mounted so it keeps its position when you switch tabs. */}
          <MapScreen active={tab === 'map'} />
          {tab === 'schedule' && <ScheduleScreen />}
          {tab === 'bookmarks' && <BookmarksScreen />}
        </main>
        {toastState && (
          <div className="toast" role="status" key={toastState.key}>
            <span>{toastState.message}</span>
            {toastState.action && (
              <button
                onClick={() => {
                  toastState.action.onClick();
                  setToastState(null);
                }}
              >
                {toastState.action.label}
              </button>
            )}
          </div>
        )}
        <TabBar active={tab} onChange={setTab} />
      </div>
      </div>
    </AppContext.Provider>
  );
}
