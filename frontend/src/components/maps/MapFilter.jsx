import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Rectangle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to handle area selection
function AreaSelector({ onAreaSelect, selectedArea, isSelecting }) {
  const [startPoint, setStartPoint] = useState(null);
  const [currentArea, setCurrentArea] = useState(null);

  useMapEvents({
    mousedown(e) {
      if (isSelecting) {
        setStartPoint([e.latlng.lat, e.latlng.lng]);
        setCurrentArea(null);
      }
    },
    mousemove(e) {
      if (isSelecting && startPoint) {
        const bounds = [
          startPoint,
          [e.latlng.lat, e.latlng.lng]
        ];
        setCurrentArea(bounds);
      }
    },
    mouseup(e) {
      if (isSelecting && startPoint) {
        const bounds = {
          north: Math.max(startPoint[0], e.latlng.lat),
          south: Math.min(startPoint[0], e.latlng.lat),
          east: Math.max(startPoint[1], e.latlng.lng),
          west: Math.min(startPoint[1], e.latlng.lng)
        };
        
        if (onAreaSelect) {
          onAreaSelect(bounds);
        }
        
        setStartPoint(null);
        setCurrentArea(null);
      }
    }
  });

  return (
    <>
      {/* Show current selection area */}
      {currentArea && (
        <Rectangle
          bounds={currentArea}
          pathOptions={{
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
            weight: 2,
            dashArray: '5, 5'
          }}
        />
      )}
      
      {/* Show selected area */}
      {selectedArea && !currentArea && (
        <Rectangle
          bounds={[
            [selectedArea.south, selectedArea.west],
            [selectedArea.north, selectedArea.east]
          ]}
          pathOptions={{
            color: '#10B981',
            fillColor: '#10B981',
            fillOpacity: 0.2,
            weight: 2
          }}
        />
      )}
    </>
  );
}

const MapFilter = ({
  onAreaSelect,
  selectedArea,
  center = [20.5937, 78.9629],
  zoom = 6,
  height = '400px',
  className = ''
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  const handleStartSelection = () => {
    setIsSelecting(true);
  };

  const handleCancelSelection = () => {
    setIsSelecting(false);
  };

  const handleAreaSelect = useCallback((bounds) => {
    setIsSelecting(false);
    if (onAreaSelect) {
      onAreaSelect(bounds);
    }
  }, [onAreaSelect]);

  const clearSelection = () => {
    if (onAreaSelect) {
      onAreaSelect(null);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center space-x-3">
          <h4 className="text-sm font-medium text-gray-900">Location Filter</h4>
          {selectedArea && (
            <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
              Area selected: {selectedArea.north.toFixed(4)}, {selectedArea.west.toFixed(4)} to {selectedArea.south.toFixed(4)}, {selectedArea.east.toFixed(4)}
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          {!isSelecting ? (
            <>
              <button
                onClick={handleStartSelection}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
              >
                📍 Select Area
              </button>
              {selectedArea && (
                <button
                  onClick={clearSelection}
                  className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-colors"
                >
                  ✕ Clear
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleCancelSelection}
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
            >
              Cancel Selection
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      {isSelecting && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            💡 Click and drag on the map to select an area for filtering data by location.
          </p>
        </div>
      )}

      {/* Map */}
      <div 
        className={`border border-gray-300 rounded-lg overflow-hidden ${
          isSelecting ? 'cursor-crosshair' : ''
        }`}
        style={{ height }}
      >
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={!isSelecting}
          doubleClickZoom={!isSelecting}
          dragging={!isSelecting}
          touchZoom={!isSelecting}
          boxZoom={false}
          keyboard={!isSelecting}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <AreaSelector
            onAreaSelect={handleAreaSelect}
            selectedArea={selectedArea}
            isSelecting={isSelecting}
          />
        </MapContainer>
      </div>

      {/* Selected Area Info */}
      {selectedArea && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Area Filter Active</p>
              <p className="text-xs text-green-600">
                Data will be filtered to show only results within the selected geographical area.
              </p>
            </div>
            <button
              onClick={clearSelection}
              className="text-green-600 hover:text-green-800 transition-colors"
              title="Remove area filter"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapFilter;