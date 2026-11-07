// Converts an occupancy percentage into a blue-to-red color for the map and legend.
// Matches the Figma gradient (#001eff at 0% to #ff0000 at 100%), which passes through purple.

const EMPTY = [0, 30, 255];
const FULL = [255, 0, 0];

export const OCCUPANCY_GRADIENT = 'linear-gradient(90deg, #001eff, #ff0000)';
export const CLOSED_COLOR = '#8e8e93';

/** @param {number} fraction occupancy from 0 to 1 */
export function occupancyColor(fraction) {
  const t = Math.min(1, Math.max(0, fraction));
  const rgb = EMPTY.map((lo, i) => Math.round(lo + (FULL[i] - lo) * t));
  return `rgb(${rgb.join(', ')})`;
}
