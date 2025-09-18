import React, { useState, useCallback } from 'react';
import InteractiveMap from './InteractiveMap';
import PatientCaseCircles from './PatientCaseCircles';
import MapLayers from './MapLayers';
import usePatientClusters from '../../hooks/usePatientClusters';

/**
 * PatientClusterMap component that combines the interactive map with patient case clustering
 * Demonstrates the full functionality of the clustering system
 */
const PatientClusterMap = ({
  center = [20.5937, 78.9629], // Default to India center
  zoom = 6,
  height = '600px',
  width = '100%',
  clusterRadius = 1000,
  showOtherLayers = true,
  className = ''
}) => {
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [mapFilters, setMapFilters] = useState({
    severity: [],
    minCaseCount: 1,
    dateFrom: null,
    dateTo: null
  });

  // Use the patient clusters hook
  const {
    clusters,
    statistics,
    loading,
    error,
    refresh,
    updateFilters,
    createClusterAlert,
    filterBySeverity,
    filterByCaseCount,
    filterByDateRange
  } = usePatientClusters({
    clusterRadius,
    autoUpdate: true,
    enableRealTime: true,
    initialFilters: mapFilters
  });

  // Handle cluster click events
  const handleClusterClick = useCallback((cluster, event) => {
    setSelectedCluster(cluster);
    console.log('Cluster clicked:', cluster);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value) => {
    const newFilters = { ...mapFilters, [filterType]: value };
    setMapFilters(newFilters);
    updateFilters(newFilters);
  }, [mapFilters, updateFilters]);

  // Handle alert creation
  const handleCreateAlert = useCallback(async (cluster) => {
    try {
      await createClusterAlert(cluster, {
        priority: cluster.severity === 'severe' ? 'high' : 'medium'
      });
      alert(`Alert created for cluster with ${cluster.caseCount} cases`);
    } catch (error) {
      alert(`Failed to create alert: ${error.message}`);
    }
  }, [createClusterAlert]);

  // Sample data for other layers (in a real app, this would come from APIs)
  const sampleWaterBodies = [
    {
      id: 'wb1',
      name: 'Ganges River',
      type: 'River',
      lat: 25.3176,
      lng: 82.9739,
      status: 'contaminated',
      lastTested: '2024-01-15',
      reports: 12
    }
  ];

  const sampleFacilities = [
    {
      id: 'f1',
      name: 'District Hospital',
      type: 'hospital',
      lat: 25.3376,
      lng: 82.9939,
      status: 'operational',
      capacity: 200,
      services: ['Emergency', 'ICU', 'Laboratory']
    }
  ];

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      {/* Map Controls Panel */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Patient Clusters</h3>
        
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="bg-blue-50 p-2 rounded">
            <div className="font-semibold text-blue-800">{statistics.totalClusters}</div>
            <div className="text-blue-600">Clusters</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="font-semibold text-green-800">{statistics.totalCases}</div>
            <div className="text-green-600">Cases</div>
          </div>
        </div>

        {/* Severity Filter */}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-700 block mb-1">
            Filter by Severity
          </label>
          <div className="space-y-1">
            {['mild', 'moderate', 'severe'].map(severity => (
              <label key={severity} className="flex items-center text-xs">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={mapFilters.severity.includes(severity)}
                  onChange={(e) => {
                    const newSeverity = e.target.checked
                      ? [...mapFilters.severity, severity]
                      : mapFilters.severity.filter(s => s !== severity);
                    handleFilterChange('severity', newSeverity);
                  }}
                />
                <span className="capitalize">{severity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Case Count Filter */}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-700 block mb-1">
            Min Cases: {mapFilters.minCaseCount}
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={mapFilters.minCaseCount}
            onChange={(e) => handleFilterChange('minCaseCount', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Refresh Button */}
        <button
          onClick={refresh}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs py-2 px-3 rounded transition-colors"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
        <h4 className="text-xs font-semibold text-gray-800 mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Mild Cases</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Moderate Cases</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Severe Cases</span>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <InteractiveMap
        center={center}
        zoom={zoom}
        height="100%"
        width="100%"
        showControls={true}
        layers={[
          // Patient case clusters layer
          <PatientCaseCircles
            key="patient-clusters"
            patientReports={[]} // This would be populated by the hook
            visible={true}
            clusterRadius={clusterRadius}
            onClusterClick={handleClusterClick}
            realTimeUpdates={true}
          />,
          
          // Other map layers (if enabled)
          ...(showOtherLayers ? [
            <MapLayers
              key="other-layers"
              waterBodies={sampleWaterBodies}
              facilities={sampleFacilities}
              visibleLayers={{
                waterBodies: true,
                facilities: true,
                outbreakAreas: false,
                ngos: false
              }}
            />
          ] : [])
        ]}
      />

      {/* Cluster Details Modal (if needed) */}
      {selectedCluster && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Cluster Details</h3>
            <div className="space-y-2 text-sm">
              <div>Cases: {selectedCluster.caseCount}</div>
              <div>Severity: {selectedCluster.severity}</div>
              <div>Location: {selectedCluster.center.lat.toFixed(4)}, {selectedCluster.center.lng.toFixed(4)}</div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleCreateAlert(selectedCluster)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm"
              >
                Create Alert
              </button>
              <button
                onClick={() => setSelectedCluster(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientClusterMap;