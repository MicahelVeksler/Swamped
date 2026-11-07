// Walking distance and time between two points on campus.

const EARTH_KM = 6371;
// Paths on campus are not straight lines; this stretches the straight-line distance to approximate them.
const PATH_FACTOR = 1.25;
const WALK_KMH = 4.8; // about 3 mph

function haversineKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

export function straightKm(a, b) {
  return haversineKm(a, b);
}

/** Estimated walk between two {lat, lng} points: { km, miles, minutes }. */
export function walk(a, b) {
  if (!a || !b) return { km: 0, miles: 0, minutes: 0 };
  const km = haversineKm(a, b) * PATH_FACTOR;
  return { km, miles: km * 0.621371, minutes: Math.max(1, Math.round((km / WALK_KMH) * 60)) };
}

/** 0.04 -> "0.1 mi" */
export function fmtMiles(miles) {
  return `${Math.max(0.1, Math.round(miles * 10) / 10).toFixed(1)} mi`;
}

export function googleWalkingUrl(from, to) {
  const params = new URLSearchParams({
    api: '1',
    origin: `${from.lat},${from.lng}`,
    destination: `${to.lat},${to.lng}`,
    travelmode: 'walking',
  });
  return `https://www.google.com/maps/dir/?${params}`;
}
