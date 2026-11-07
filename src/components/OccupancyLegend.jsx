// 0% to 100% blue-to-red scale that explains the building colors on the map.
import { OCCUPANCY_GRADIENT } from '../utils/occupancyColor.js';

export default function OccupancyLegend() {
  return (
    <div className="legend" aria-label="Building colors: blue is empty, red is full">
      <span>0%</span>
      <span className="legend-bar" style={{ background: OCCUPANCY_GRADIENT }} />
      <span>100%</span>
    </div>
  );
}
