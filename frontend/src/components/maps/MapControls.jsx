import React, { useState } from 'react';

const MapControls = ({
  visibleLayers,
  onLayerToggle,
  onZoomToLocation,
  onResetView,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const layerConfig = [
    {
      key: 'waterBodies',
      label: 'Water Bodies',
      icon: '💧',
      color: 'text-blue-600'
    },
    {
      key: 'outbreakAreas',
      label: 'Outbreak Areas',
      icon: '⚠️',
      color: 'text-orange-600'
    },
    {
      key: 'facilities',
      label: 'Clinics & Hospitals',
      icon: '🏥',
      color: 'text-green-600'
    },
    {
      key: 'ngos',
      label: 'NGO Partners',
      icon: '🤝',
      color: 'text-purple-600'
    },
    {
      key: 'patientClusters',
      label: 'Patient Clusters',
      icon: '🎯',
      color: 'text-red-600'
    }
  ];

  const handleLayerToggle = (layerKey) => {
    if (onLayerToggle) {
      onLayerToggle(layerKey, !visibleLayers[layerKey]);
    }
  };

  return (
    <div className={`absolute top-2 left-2 z-[1000] ${className}`}>
      {/* Layer Control Panel */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="text-sm font-medium text-gray-700">Map Layers</span>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>

        {/* Layer Toggles */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-3 space-y-2">
            {layerConfig.map((layer) => (
              <label
                key={layer.key}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={visibleLayers[layer.key] || false}
                  onChange={() => handleLayerToggle(layer.key)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{layer.icon}</span>
                <span className={`text-sm ${layer.color}`}>
                  {layer.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="mt-2 space-y-2">
        {onZoomToLocation && (
          <button
            onClick={onZoomToLocation}
            className="w-full bg-white hover:bg-gray-50 border border-gray-300 rounded px-3 py-2 shadow-sm text-sm font-medium text-gray-700 transition-colors"
            title="Zoom to current location"
          >
            📍 My Location
          </button>
        )}

        {onResetView && (
          <button
            onClick={onResetView}
            className="w-full bg-white hover:bg-gray-50 border border-gray-300 rounded px-3 py-2 shadow-sm text-sm font-medium text-gray-700 transition-colors"
            title="Reset map view"
          >
            🔄 Reset View
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Water Bodies</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Severe Cases</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Moderate Cases</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Mild Cases</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapControls;