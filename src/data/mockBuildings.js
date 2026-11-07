// Placeholder campus buildings with coordinates, hours, and occupancy until real data is available.
//
// PLACES are spots students can go between classes (libraries, dining, gyms, outdoor spaces).
// They appear on the map, in bookmarks, and in recommendations.
// CLASS_BUILDINGS are lecture halls. They are only used to locate classes on the schedule
// and to measure walking distance to and from a class.
//
// Hours are minutes after midnight, keyed by day (0 = Sunday ... 6 = Saturday).
// A closing time past 1440 means the building closes after midnight.
// `null` means closed all day.

const H = (h, m = 0) => h * 60 + m;
const ALL = (r) => ({ 0: r, 1: r, 2: r, 3: r, 4: r, 5: r, 6: r });
const WEEK = (weekday, sat, sun, fri = weekday) => ({
  0: sun, 1: weekday, 2: weekday, 3: weekday, 4: weekday, 5: fri, 6: sat,
});

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'study', label: 'Study' },
  { id: 'food', label: 'Food' },
  { id: 'gym', label: 'Gym' },
  { id: 'outdoor', label: 'Outside' },
];

export const PLACES = [
  {
    id: 'marston', name: 'Marston Science Library', short: 'Marston',
    category: 'study', profile: 'library', busy: 1.05, capacity: 2208,
    lat: 29.6481, lng: -82.3439, hours: ALL([0, H(24)]),
    tags: ['library', 'quiet', 'science', 'study', 'basement'],
  },
  {
    id: 'libwest', name: 'Library West', short: 'Lib West',
    category: 'study', profile: 'library', busy: 1.0, capacity: 1564,
    lat: 29.6513, lng: -82.3429,
    hours: WEEK([H(7), H(26)], [H(9), H(22)], [H(10), H(26)], [H(7), H(22)]),
    tags: ['library', 'humanities', 'study', 'starbucks'],
  },
  {
    id: 'smathers', name: 'Smathers Library', short: 'Smathers',
    category: 'study', profile: 'library', busy: 0.75, capacity: 231,
    lat: 29.6507, lng: -82.3418,
    hours: WEEK([H(8), H(20)], null, [H(13), H(20)], [H(8), H(17)]),
    tags: ['library', 'quiet', 'historic', 'east'],
  },
  {
    id: 'hsclib', name: 'Health Science Center Library', short: 'HSC Library',
    category: 'study', profile: 'library', busy: 0.85, capacity: 761,
    lat: 29.6406, lng: -82.3443,
    hours: WEEK([H(7), H(23)], [H(10), H(20)], [H(12), H(23)], [H(7), H(20)]),
    tags: ['library', 'health', 'medical', 'study'],
  },
  {
    id: 'afalib', name: 'Architecture & Fine Arts Library', short: 'AFA Library',
    category: 'study', profile: 'library', busy: 0.8, capacity: 124,
    lat: 29.6481, lng: -82.3394,
    hours: WEEK([H(8), H(22)], null, [H(13), H(22)], [H(8), H(17)]),
    tags: ['library', 'art', 'architecture', 'quiet'],
  },
  {
    id: 'edulib', name: 'Education Library', short: 'Edu Library',
    category: 'study', profile: 'library', busy: 0.6, capacity: 560,
    lat: 29.6461, lng: -82.3384,
    hours: WEEK([H(8), H(21)], null, [H(14), H(21)], [H(8), H(17)]),
    tags: ['library', 'norman', 'education', 'quiet'],
  },
  {
    id: 'newell', name: 'Newell Hall', short: 'Newell',
    category: 'study', profile: 'studyhall', busy: 0.85, capacity: 500,
    lat: 29.6491, lng: -82.3452,
    hours: WEEK([H(7), H(20)], [H(10), H(20)], [H(12), H(20)], [H(7), H(18)]),
    tags: ['study', 'collaborative', 'group'],
  },
  {
    id: 'career', name: 'Career Connections Center', short: 'Career Ctr',
    category: 'study', profile: 'office', busy: 0.8, capacity: 150,
    lat: 29.6459, lng: -82.3486,
    hours: WEEK([H(8), H(17)], null, null),
    tags: ['career', 'study', 'reitz'],
  },
  {
    id: 'reitz', name: 'Reitz Union', short: 'Reitz',
    category: 'food', profile: 'union', busy: 1.0, capacity: 1500,
    lat: 29.6466, lng: -82.3476,
    hours: WEEK([H(7), H(23)], [H(9), H(23)], [H(11), H(23)]),
    tags: ['food', 'union', 'seating', 'outside', 'study', 'lunch'],
  },
  {
    id: 'hub', name: 'The Hub', short: 'Hub',
    category: 'food', profile: 'dining', busy: 1.15, capacity: 400,
    lat: 29.6484, lng: -82.3458,
    hours: WEEK([H(7), H(18)], null, null, [H(7), H(15)]),
    tags: ['chick-fil-a', 'cfa', 'food', 'lunch', 'coffee'],
  },
  {
    id: 'broward', name: 'Broward Dining', short: 'Broward',
    category: 'food', profile: 'dining', busy: 0.85, capacity: 600,
    lat: 29.6453, lng: -82.3497, hours: ALL([H(7), H(21)]),
    tags: ['dining hall', 'food', 'lunch', 'dinner'],
  },
  {
    id: 'gatorcorner', name: 'Gator Corner Dining', short: 'Gator Corner',
    category: 'food', profile: 'dining', busy: 0.85, capacity: 550,
    lat: 29.6495, lng: -82.3508, hours: ALL([H(7), H(21)]),
    tags: ['dining hall', 'food', 'lunch', 'dinner'],
  },
  {
    id: 'src', name: 'Student Recreation & Fitness Center', short: 'Rec Center',
    category: 'gym', profile: 'gym', busy: 1.0, capacity: 600,
    lat: 29.65, lng: -82.3477,
    hours: WEEK([H(6), H(23)], [H(10), H(20)], [H(10), H(23)], [H(6), H(21)]),
    tags: ['gym', 'workout', 'src', 'student rec', 'fitness'],
  },
  {
    id: 'swrc', name: 'Southwest Recreation Center', short: 'SW Rec',
    category: 'gym', profile: 'gym', busy: 1.0, capacity: 1200,
    lat: 29.6383, lng: -82.3681,
    hours: WEEK([H(6), H(23)], [H(10), H(19)], [H(10), H(23)], [H(6), H(21)]),
    tags: ['gym', 'workout', 'swrc', 'fitness', 'weight room'],
  },
  {
    id: 'flavet', name: 'Flavet Field', short: 'Flavet',
    category: 'outdoor', profile: 'outdoor', busy: 0.7, capacity: 800,
    lat: 29.6448, lng: -82.3524, hours: ALL([H(6), H(23)]),
    tags: ['field', 'outside', 'sports', 'intramural'],
  },
  {
    id: 'turlington', name: 'Turlington Plaza', short: 'Turlington',
    category: 'outdoor', profile: 'outdoor', busy: 1.0, capacity: 300,
    lat: 29.6494, lng: -82.344, hours: ALL([0, H(24)]),
    tags: ['tabling', 'clubs', 'outside', 'plaza'],
  },
  {
    id: 'plaza', name: 'Plaza of the Americas', short: 'Plaza',
    category: 'outdoor', profile: 'outdoor', busy: 0.6, capacity: 600,
    lat: 29.6503, lng: -82.3426, hours: ALL([0, H(24)]),
    tags: ['outside', 'lawn', 'relax'],
  },
];

export const CLASS_BUILDINGS = [
  { id: 'mala', code: 'MALA', name: 'Mechanical & Aerospace Eng. A', keywords: ['Mechanical and Aerospace', 'Mechanical & Aerospace'], lat: 29.6425, lng: -82.3488 },
  { id: 'neb', code: 'NEB', name: 'New Engineering Building', lat: 29.6424, lng: -82.3468 },
  { id: 'cse', code: 'CSE', name: 'Computer Sciences & Engineering', keywords: ['Computer Science'], lat: 29.6483, lng: -82.3446 },
  { id: 'and', code: 'AND', aliases: ['AH'], name: 'Anderson Hall', lat: 29.651, lng: -82.3425 },
  { id: 'tur', code: 'TUR', name: 'Turlington Hall', lat: 29.6497, lng: -82.3437 },
  { id: 'lit', code: 'LIT', name: 'Little Hall', lat: 29.6499, lng: -82.3428 },
  { id: 'mat', code: 'MAT', name: 'Matherly Hall', lat: 29.6509, lng: -82.3412 },
  { id: 'car', code: 'CAR', name: 'Carleton Auditorium', lat: 29.6488, lng: -82.342 },
  { id: 'lei', code: 'LEI', name: 'Leigh Hall', lat: 29.6475, lng: -82.3424 },
  { id: 'weil', code: 'WEIL', name: 'Weil Hall', lat: 29.6477, lng: -82.3474 },
  { id: 'flg', code: 'FLG', name: 'Florida Gym', lat: 29.6496, lng: -82.3465 },
  { id: 'nrn', code: 'NRN', name: 'Norman Hall', lat: 29.6464, lng: -82.3388 },
  { id: 'mcca', code: 'MCCA', name: 'McCarty Hall A', keywords: ['McCarty'], lat: 29.6468, lng: -82.344 },
  { id: 'npb', code: 'NPB', name: 'New Physics Building', lat: 29.644, lng: -82.3505 },
  { id: 'fac', code: 'FAC', name: 'Fine Arts C', lat: 29.6479, lng: -82.3399 },
];

// Where the app assumes you are when location is off: the middle of campus.
export const CAMPUS_CENTER = { lat: 29.6488, lng: -82.3443, label: 'Turlington Plaza' };

const BY_ID = new Map([...PLACES, ...CLASS_BUILDINGS].map((b) => [b.id, b]));

export function getBuilding(id) {
  return BY_ID.get(id) ?? null;
}

/**
 * Finds the class building for a location like "MALA 1000", "NEB 0202" or
 * "Turlington Hall L007" (calendar exports often spell the building out).
 */
export function buildingFromLocation(location) {
  const text = (location || '').trim();
  if (!text) return null;
  const code = text.split(/[\s,]+/)[0].toUpperCase();
  const byCode = CLASS_BUILDINGS.find((b) => b.code === code || b.aliases?.includes(code));
  if (byCode) return byCode;
  const lower = text.toLowerCase();
  return (
    CLASS_BUILDINGS.find((b) =>
      [b.name, ...(b.keywords ?? [])].some((n) => lower.includes(n.toLowerCase())),
    ) ??
    // Clubs, labs, and study groups often meet at a place (e.g. "Reitz Union").
    PLACES.find((p) => lower.includes(p.name.toLowerCase())) ??
    null
  );
}
