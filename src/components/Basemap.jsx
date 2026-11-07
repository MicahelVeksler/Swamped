// Map background. Uses OpenFreeMap's "Liberty" vector style (free, no API key) drawn by
// MapLibre, with point-of-interest and bus-stop icons hidden so the occupancy pills stand out.
// Falls back to Esri's street tiles if the device can't do WebGL.
import { useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-leaflet';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

// Style layers that clutter the map behind our pills. (The 3D buildings are swapped for flat
// footprints at every zoom, which read better from straight above.)
const HIDDEN_LAYERS = ['poi_r1', 'poi_r7', 'poi_r20', 'poi_transit', 'building-3d', 'road_one_way_arrow', 'road_one_way_arrow_opposite'];

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

const HAS_WEBGL = supportsWebGL();

function VectorBasemap() {
  const map = useMap();

  useEffect(() => {
    const layer = L.maplibreGL({ style: STYLE_URL, attribution: ATTRIBUTION });
    layer.addTo(map);
    const gl = layer.getMaplibreMap();
    const hideClutter = () => {
      for (const id of HIDDEN_LAYERS) {
        if (gl.getLayer(id)) gl.setLayoutProperty(id, 'visibility', 'none');
      }
      if (gl.getLayer('building')) gl.setLayerZoomRange('building', 13, 24);
    };
    gl.on('styledata', hideClutter);
    return () => {
      gl.off('styledata', hideClutter);
      map.removeLayer(layer);
    };
  }, [map]);

  return null;
}

export default function Basemap() {
  if (HAS_WEBGL && typeof L.maplibreGL === 'function') return <VectorBasemap />;
  return (
    <TileLayer
      attribution="Tiles &copy; Esri"
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
      maxZoom={19}
    />
  );
}
