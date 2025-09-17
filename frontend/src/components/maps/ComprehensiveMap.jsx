import React, { useState, useCallback } from 'react';
import InteractiveMap from './InteractiveMap.jsx';
import MapLayers from './MapLayers.jsx';
import MapControls from './MapControls.jsx';

const ComprehensiveMap = ({
  center = [20.5937, 78.9629], // Default to India center
  zoom = 6,
  height = '500px',
  width = '100%',
  onLocationSelect,
  selectedLocation,
  data = {
    waterBodies: [],
    outbreakAreas: [],
    facilities: [],
    ngos: []
  },
  showControls = true,
  showLayerControls = true,
  className = ''
}) => {
  const [visibleLayers, setVisibleLayers] = useState({
    waterBodies: true,
    outbreakAreas: true,
    facilities: true,
    ngos: true
  });

  const handleLayerToggle = useCallback((layerKey, isVisible) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layerKey]: isVisible
    }));
  }, []);

  const handleZoomToLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (onLocationSelect) {
            onLocationSelect({ lat: latitude, lng: longitude });
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    }
  }, [onLocationSelect]);

  const handleResetView = useCallback(() => {
    // Reset to default center and zoom
    // This would need to be implemented in the InteractiveMap component
    console.log('Reset view to default');
  }, []);

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <InteractiveMap
        center={center}
        zoom={zoom}
        height={height}
        width={width}
        onLocationSelect={onLocationSelect}
        selectedLocation={selectedLocation}
        showControls={showControls}
        layers={[
          <MapLayers
            key="map-layers"
            waterBodies={data.waterBodies}
            outbreakAreas={data.outbreakAreas}
            facilities={data.facilities}
            ngos={data.ngos}
            visibleLayers={visibleLayers}
          />
        ]}
      />

      {showLayerControls && (
        <MapControls
          visibleLayers={visibleLayers}
          onLayerToggle={handleLayerToggle}
          onZoomToLocation={handleZoomToLocation}
          onResetView={handleResetView}
        />
      )}
    </div>
  );
};

export default ComprehensiveMap;