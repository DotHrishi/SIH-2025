import React, { useState, useEffect } from 'react';
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

// Component to handle map click events for location selection
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
        <div className="text-center">
          <strong>Selected Location</strong><br />
          <small>
            Lat: {selectedLocation.lat.toFixed(6)}<br />
            Lng: {selectedLocation.lng.toFixed(6)}
          </small>
        </div>
      </Popup>
    </Marker>
  ) : null;
}

const LocationPicker = ({
  value = null, // { lat, lng }
  onChange,
  height = '300px',
  className = '',
  placeholder = 'Click on the map to select a location',
  showCoordinates = true,
  disabled = false
}) => {
  const [selectedLocation, setSelectedLocation] = useState(value);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default to India center
  const [isExpanded, setIsExpanded] = useState(false);

  // Update internal state when value prop changes
  useEffect(() => {
    setSelectedLocation(value);
    if (value) {
      setMapCenter([value.lat, value.lng]);
    }
  }, [value]);

  const handleLocationSelect = (location) => {
    if (disabled) return;
    
    setSelectedLocation(location);
    if (onChange) {
      onChange(location);
    }
  };

  const getCurrentLocation = () => {
    if (disabled) return;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMapCenter([location.lat, location.lng]);
          handleLocationSelect(location);
        },
        (error) => {
          console.error('Error getting current location:', error);
          alert('Unable to get current location. Please select manually on the map.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const clearLocation = () => {
    if (disabled) return;
    
    setSelectedLocation(null);
    if (onChange) {
      onChange(null);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Location Display and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {selectedLocation ? (
            <div className="text-sm text-gray-700">
              <span className="font-medium">Selected Location:</span>
              {showCoordinates && (
                <span className="ml-2 text-gray-600">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </span>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">{placeholder}</div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={disabled}
            className="text-xs bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 px-2 py-1 rounded transition-colors"
            title="Use current location"
          >
            📍 Current
          </button>
          
          {selectedLocation && (
            <button
              type="button"
              onClick={clearLocation}
              disabled={disabled}
              className="text-xs bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 text-red-700 px-2 py-1 rounded transition-colors"
              title="Clear location"
            >
              ✕ Clear
            </button>
          )}
          
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={disabled}
            className="text-xs bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 px-2 py-1 rounded transition-colors"
          >
            {isExpanded ? '▲ Hide Map' : '▼ Show Map'}
          </button>
        </div>
      </div>

      {/* Map Container */}
      {isExpanded && (
        <div 
          className={`border border-gray-300 rounded-lg overflow-hidden ${disabled ? 'opacity-50' : ''}`}
          style={{ height }}
        >
          <MapContainer
            center={mapCenter}
            zoom={selectedLocation ? 15 : 6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={!disabled}
            doubleClickZoom={!disabled}
            dragging={!disabled}
            touchZoom={!disabled}
            boxZoom={!disabled}
            keyboard={!disabled}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <LocationSelector
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
            />
          </MapContainer>
        </div>
      )}

      {/* Instructions */}
      {isExpanded && !disabled && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          💡 Click anywhere on the map to select a location, or use the "Current" button to use your current location.
        </div>
      )}
    </div>
  );
};

export default LocationPicker;