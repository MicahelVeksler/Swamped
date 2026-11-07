// Sample class schedule used to develop the schedule and recommendation features.
// Matches the hi-fi Figma prototype. Days use 1 = Monday ... 5 = Friday; times are minutes after midnight.

export const CLASS_COLORS = ['#81c4ff', '#ffe138', '#ff804a', '#00dd58', '#c9a7ff', '#ff9bd0', '#7fe3d8'];

export const MOCK_SCHEDULE = [
  { id: 'c1', name: 'CEN4721', days: [1, 3, 5], start: 9 * 60 + 35, end: 10 * 60 + 25, location: 'MALA 1000', buildingId: 'mala', color: '#81c4ff' },
  { id: 'c2', name: 'CAP3027', days: [1, 3, 5], start: 10 * 60 + 40, end: 11 * 60 + 30, location: 'CSE E121', buildingId: 'cse', color: '#ffe138' },
  { id: 'c3', name: 'ENC3246', days: [1, 3, 5], start: 12 * 60 + 50, end: 13 * 60 + 40, location: 'AH 2109', buildingId: 'and', color: '#ff804a' },
  { id: 'c4', name: 'CEN4722', days: [1, 3, 5], start: 13 * 60 + 55, end: 14 * 60 + 45, location: 'NEB 0202', buildingId: 'neb', color: '#00dd58' },
];

// Bookmarks shown in the prototype.
export const MOCK_BOOKMARKS = ['marston', 'newell', 'hub', 'flavet', 'swrc'];
