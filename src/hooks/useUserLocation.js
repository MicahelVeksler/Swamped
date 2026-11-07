// The student's location. Defaults to the middle of campus; uses GPS only after they tap
// the locate button (the proposal flags location as a privacy concern, so it is opt-in
// and never leaves the device).
import { useCallback, useState } from 'react';
import { CAMPUS_CENTER } from '../data/mockBuildings.js';
import { straightKm } from '../utils/geo.js';

const MAX_KM_FROM_CAMPUS = 4;

export default function useUserLocation(notify) {
  const [location, setLocation] = useState({ ...CAMPUS_CENTER, source: 'default' });
  const [locating, setLocating] = useState(false);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      notify?.('Location is not available in this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (straightKm(here, CAMPUS_CENTER) > MAX_KM_FROM_CAMPUS) {
          notify?.("You're off campus, so distances are from Turlington Plaza");
          return;
        }
        setLocation({ ...here, label: 'Your location', source: 'gps' });
        notify?.('Using your location. It stays on this device.');
      },
      () => {
        setLocating(false);
        notify?.('Location permission denied. Using campus center.');
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [notify]);

  /** Stops using GPS and goes back to measuring from the middle of campus. */
  const stopLocating = useCallback(() => {
    setLocation({ ...CAMPUS_CENTER, source: 'default' });
    notify?.(`Location off. Distances are from ${CAMPUS_CENTER.label}.`);
  }, [notify]);

  return { location, locate, stopLocating, locating };
}
