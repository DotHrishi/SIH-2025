import React, { useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to handle map click events
function LocationSelector({ onLocationSelect, selectedLocation }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      }
    },
  });

  return selectedLocation ? (
    <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
      <Popup>
        Selected Location<br />
        Lat: {selectedLocation.lat.toFixed(6)}<br />
        Lng: {selectedLocation.lng.toFixed(6)}
      </Popup>
    </Marker>
  ) : null;
}

const InteractiveMap = ({
  center = [20.5937, 78.9629], // Default to India center
  zoom = 6,
  height = '400px',
  width = '100%',
  onLocationSelect,
  selectedLocation,
  markers = [],
  layers = [],
  showControls = true,
  className = ''
}) => {
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const mapRef = useRef();

  // Handle map events
  const handleMapMove = useCallback(() => {
    const map = mapRef.current;
    if (map) {
      setMapCenter([map.getCenter().lat, map.getCenter().lng]);
      setMapZoom(map.getZoom());
    }
  }, []);

  // Zoom to location function
  const zoomToLocation = useCallback((lat, lng, zoomLevel = 15) => {
    const map = mapRef.current;
    if (map) {
      map.setView([lat, lng], zoomLevel);
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          zoomToLocation(latitude, longitude);
          if (onLocationSelect) {
            onLocationSelect({ lat: latitude, lng: longitude });
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    }
  }, [zoomToLocation, onLocationSelect]);

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        whenReady={handleMapMove}
      >
        {/* OpenStreetMap tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Location selector for click events */}
        {onLocationSelect && (
          <LocationSelector
            onLocationSelect={onLocationSelect}
            selectedLocation={selectedLocation}
          />
        )}

        {/* Render additional markers */}
        {markers.map((marker, index) => (
          <Marker
            key={marker.id || index}
            position={[marker.lat, marker.lng]}
            icon={marker.icon}
          >
            {marker.popup && <Popup>{marker.popup}</Popup>}
          </Marker>
        ))}

        {/* Render additional layers */}
        {layers.map((layer, index) => (
          <React.Fragment key={index}>
            {layer}
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Map controls */}
      {showControls && (
        <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-2">
          <button
            onClick={getCurrentLocation}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded px-3 py-2 shadow-sm text-sm font-medium text-gray-700 transition-colors"
            title="Get current location"
          >
            📍 My Location
          </button>
          
          <div className="bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-xs text-gray-600">
            Zoom: {mapZoom}
          </div>
          
          {selectedLocation && (
            <div className="bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-xs text-gray-600 max-w-32">
              <div>Lat: {selectedLocation.lat.toFixed(4)}</div>
              <div>Lng: {selectedLocation.lng.toFixed(4)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;