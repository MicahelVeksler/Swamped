// Home screen: interactive campus map with search, zoom, color-coded buildings, and walking directions.
import BuildingSheet from '../components/BuildingSheet.jsx';

export default function MapScreen() {
  return (
    <div className="map-screen">
      <h1>Map</h1>
      <BuildingSheet />
    </div>
  );
}
