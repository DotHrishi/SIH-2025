import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import MapLayers from './MapLayers';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons for analytics data
const createAnalyticsIcon = (color, symbol, size = 'medium') => {
  const sizeMap = {
    small: { width: 20, height: 20, fontSize: 10 },
    medium: { width: 28, height: 28, fontSize: 12 },
    large: { width: 36, height: 36, fontSize: 14 }
  };
  
  const { width, height, fontSize } = sizeMap[size];
  
  return L.divIcon({
    className: 'analytics-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${width}px;
        height: ${height}px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${fontSize}px;
        color: white;
        font-weight: bold;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      ">
        ${symbol}
      </div>
    `,
    iconSize: [width, height],
    iconAnchor: [width/2, height/2],
    popupAnchor: [0, -height/2]
  });
};

// Analytics-specific icons
const ANALYTICS_ICONS = {
  waterReport: (severity = 'normal') => {
    const colors = {
      safe: '#10B981',
      warning: '#F59E0B', 
      danger: '#EF4444',
      normal: '#3B82F6'
    };
    return createAnalyticsIcon(colors[severity] || colors.normal, '💧');
  },
  patientReport: (severity = 'mild') => {
    const colors = {
      mild: '#10B981',
      moderate: '#F59E0B',
      severe: '#EF4444'
    };
    const size = severity === 'severe' ? 'large' : severity === 'moderate' ? 'medium' : 'small';
    return createAnalyticsIcon(colors[severity], '🏥', size);
  },
  cluster: (count) => {
    const color = count > 10 ? '#EF4444' : count > 5 ? '#F59E0B' : '#10B981';
    const size = count > 10 ? 'large' : count > 5 ? 'medium' : 'small';
    return createAnalyticsIcon(color, count.toString(), size);
  }
};

const AnalyticsMap = ({
  waterReports = [],
  patientReports = [],
  filters = {},
  onLocationFilter,
  height = '500px',
  showControls = true,
  className = ''
}) => {
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default to India center
  const [mapZoom, setMapZoom] = useState(6);
  const [visibleLayers, setVisibleLayers] = useState({
    waterReports: true,
    patientReports: true,
    clusters: true,
    heatmap: false
  });
  const [selectedArea, setSelectedArea] = useState(null);

  // Process data for clustering
  const processDataForClustering = () => {
    const clusters = new Map();
    const clusterRadius = 0.01; // Approximately 1km

    // Cluster patient reports by location
    patientReports.forEach(report => {
      if (!report.location?.coordinates) return;
      
      const [lng, lat] = report.location.coordinates;
      const clusterKey = `${Math.round(lat / clusterRadius) * clusterRadius}_${Math.round(lng / clusterRadius) * clusterRadius}`;
      
      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, {
          lat: Math.round(lat / clusterRadius) * clusterRadius,
          lng: Math.round(lng / clusterRadius) * clusterRadius,
          reports: [],
          severeCases: 0,
          moderateCases: 0,
          mildCases: 0
        });
      }
      
      const cluster = clusters.get(clusterKey);
      cluster.reports.push(report);
      
      if (report.severity === 'severe') cluster.severeCases++;
      else if (report.severity === 'moderate') cluster.moderateCases++;
      else cluster.mildCases++;
    });

    return Array.from(clusters.values()).filter(cluster => cluster.reports.length > 1);
  };

  const clusters = processDataForClustering();

  // Handle area selection for filtering
  const handleAreaSelect = (bounds) => {
    setSelectedArea(bounds);
    if (onLocationFilter) {
      onLocationFilter(bounds);
    }
  };

  // Get severity color for water reports
  const getWaterReportSeverity = (report) => {
    const { testingParameters } = report;
    
    // Simple severity assessment based on parameters
    if (testingParameters.pH < 6.5 || testingParameters.pH > 8.5) return 'danger';
    if (testingParameters.turbidity > 5) return 'warning';
    if (testingParameters.dissolvedOxygen < 5) return 'warning';
    
    return 'safe';
  };

  // Filter reports based on current filters
  const filteredWaterReports = waterReports.filter(report => {
    if (filters.district && !report.location?.district?.toLowerCase().includes(filters.district.toLowerCase())) {
      return false;
    }
    if (filters.waterSource && report.location?.waterSource !== filters.waterSource) {
      return false;
    }
    if (filters.startDate && new Date(report.createdAt) < new Date(filters.startDate)) {
      return false;
    }
    if (filters.endDate && new Date(report.createdAt) > new Date(filters.endDate)) {
      return false;
    }
    return true;
  });

  const filteredPatientReports = patientReports.filter(report => {
    if (filters.district && !report.patientInfo?.location?.toLowerCase().includes(filters.district.toLowerCase())) {
      return false;
    }
    if (filters.severity && report.severity !== filters.severity) {
      return false;
    }
    if (filters.ageGroup && report.patientInfo?.ageGroup !== filters.ageGroup) {
      return false;
    }
    if (filters.startDate && new Date(report.reportDate) < new Date(filters.startDate)) {
      return false;
    }
    if (filters.endDate && new Date(report.reportDate) > new Date(filters.endDate)) {
      return false;
    }
    return true;
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Controls */}
      {showControls && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Map Visualization</h3>
            <div className="text-sm text-gray-600">
              {filteredWaterReports.length} water reports • {filteredPatientReports.length} patient reports
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={visibleLayers.waterReports}
                onChange={(e) => setVisibleLayers(prev => ({ ...prev, waterReports: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Water Reports</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {filteredWaterReports.length}
              </span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={visibleLayers.patientReports}
                onChange={(e) => setVisibleLayers(prev => ({ ...prev, patientReports: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Patient Reports</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {filteredPatientReports.length}
              </span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={visibleLayers.clusters}
                onChange={(e) => setVisibleLayers(prev => ({ ...prev, clusters: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Disease Clusters</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {clusters.length}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow border overflow-hidden" style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Water Reports Layer */}
          {visibleLayers.waterReports && (
            <LayerGroup>
              {filteredWaterReports.map((report, index) => {
                if (!report.location?.coordinates) return null;
                
                const [lng, lat] = report.location.coordinates;
                const severity = getWaterReportSeverity(report);
                
                return (
                  <Marker
                    key={report._id || index}
                    position={[lat, lng]}
                    icon={ANALYTICS_ICONS.waterReport(severity)}
                  >
                    <Popup>
                      <div className="p-2 max-w-xs">
                        <h4 className="font-semibold text-blue-800 mb-2">Water Quality Report</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>ID:</strong> {report.reportId}</p>
                          <p><strong>Location:</strong> {report.location.address}</p>
                          <p><strong>District:</strong> {report.location.district}</p>
                          <p><strong>Water Source:</strong> {report.location.waterSource}</p>
                          <p><strong>Date:</strong> {new Date(report.createdAt).toLocaleDateString()}</p>
                          
                          {report.testingParameters && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="font-medium">Test Results:</p>
                              {report.testingParameters.pH && (
                                <p>pH: {report.testingParameters.pH}</p>
                              )}
                              {report.testingParameters.turbidity && (
                                <p>Turbidity: {report.testingParameters.turbidity} NTU</p>
                              )}
                              {report.testingParameters.dissolvedOxygen && (
                                <p>DO: {report.testingParameters.dissolvedOxygen} mg/L</p>
                              )}
                            </div>
                          )}
                          
                          <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${
                            severity === 'safe' ? 'bg-green-100 text-green-800' :
                            severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Status: {severity.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </LayerGroup>
          )}

          {/* Patient Reports Layer */}
          {visibleLayers.patientReports && (
            <LayerGroup>
              {filteredPatientReports.map((report, index) => {
                if (!report.location?.coordinates) return null;
                
                const [lng, lat] = report.location.coordinates;
                
                return (
                  <Marker
                    key={report._id || index}
                    position={[lat, lng]}
                    icon={ANALYTICS_ICONS.patientReport(report.severity)}
                  >
                    <Popup>
                      <div className="p-2 max-w-xs">
                        <h4 className="font-semibold text-green-800 mb-2">Patient Report</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Case ID:</strong> {report.caseId}</p>
                          <p><strong>Age Group:</strong> {report.patientInfo?.ageGroup}</p>
                          <p><strong>Gender:</strong> {report.patientInfo?.gender}</p>
                          <p><strong>Location:</strong> {report.patientInfo?.location}</p>
                          <p><strong>Date:</strong> {new Date(report.reportDate).toLocaleDateString()}</p>
                          
                          {report.symptoms && report.symptoms.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="font-medium">Symptoms:</p>
                              <p>{report.symptoms.join(', ')}</p>
                            </div>
                          )}
                          
                          {report.suspectedWaterSource && (
                            <div className="mt-2 pt-2 border-t">
                              <p><strong>Water Source:</strong> {report.suspectedWaterSource.source}</p>
                            </div>
                          )}
                          
                          <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${
                            report.severity === 'mild' ? 'bg-green-100 text-green-800' :
                            report.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Severity: {report.severity?.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </LayerGroup>
          )}

          {/* Disease Clusters Layer */}
          {visibleLayers.clusters && (
            <LayerGroup>
              {clusters.map((cluster, index) => (
                <React.Fragment key={index}>
                  {/* Cluster circle */}
                  <Circle
                    center={[cluster.lat, cluster.lng]}
                    radius={cluster.reports.length * 200} // Radius based on case count
                    pathOptions={{
                      color: cluster.severeCases > 0 ? '#EF4444' : cluster.moderateCases > 0 ? '#F59E0B' : '#10B981',
                      fillColor: cluster.severeCases > 0 ? '#EF4444' : cluster.moderateCases > 0 ? '#F59E0B' : '#10B981',
                      fillOpacity: 0.2,
                      weight: 2
                    }}
                  />
                  
                  {/* Cluster marker */}
                  <Marker
                    position={[cluster.lat, cluster.lng]}
                    icon={ANALYTICS_ICONS.cluster(cluster.reports.length)}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-semibold text-red-800 mb-2">Disease Cluster</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Total Cases:</strong> {cluster.reports.length}</p>
                          <p><strong>Severe:</strong> {cluster.severeCases}</p>
                          <p><strong>Moderate:</strong> {cluster.moderateCases}</p>
                          <p><strong>Mild:</strong> {cluster.mildCases}</p>
                          
                          <div className="mt-2 pt-2 border-t">
                            <p className="font-medium">Recent Cases:</p>
                            {cluster.reports.slice(0, 3).map((report, idx) => (
                              <p key={idx} className="text-xs">
                                {report.caseId} - {new Date(report.reportDate).toLocaleDateString()}
                              </p>
                            ))}
                            {cluster.reports.length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{cluster.reports.length - 3} more cases
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              ))}
            </LayerGroup>
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Map Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">💧</div>
            <span>Water Reports</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">🏥</div>
            <span>Patient Reports</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">5</div>
            <span>Disease Clusters</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-100"></div>
            <span>High Risk Areas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsMap;