import React, { useState, useEffect, useMemo } from 'react';
import { Circle, LayerGroup } from 'react-leaflet';
import { clusterPatientCases, calculateClusterRadius, getSeverityColor } from '../../utils/geoUtils';
import CaseClusterPopup from './CaseClusterPopup';
import { mapsAPI } from '../../services/api';

/**
 * PatientCaseCircles component for displaying clustered patient cases on the map
 * Implements geographic clustering with severity-based color coding and dynamic sizing
 */
const PatientCaseCircles = ({ 
  patientReports = [], 
  visible = true,
  clusterRadius = 1000, // Clustering radius in meters
  onClusterClick = null,
  realTimeUpdates = true
}) => {
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch clusters from backend API
  const fetchClusters = async () => {
    if (!realTimeUpdates) return;
    
    try {
      setLoading(true);
      const response = await mapsAPI.getPatientClusters({
        radius: clusterRadius,
        minCases: 1
      });
      
      if (response.data.success) {
        setClusters(response.data.data.clusters);
      }
    } catch (error) {
      console.error('Error fetching patient clusters:', error);
      // Fallback to local clustering if API fails
      if (patientReports && patientReports.length > 0) {
        const localClusters = clusterPatientCases(patientReports, clusterRadius);
        setClusters(localClusters);
      }
    } finally {
      setLoading(false);
    }
  };

  // Memoize clusters to avoid unnecessary recalculations
  const clusteredData = useMemo(() => {
    if (!patientReports || patientReports.length === 0) {
      return [];
    }

    return clusterPatientCases(patientReports, clusterRadius);
  }, [patientReports, clusterRadius]);

  // Update clusters when data changes
  useEffect(() => {
    if (realTimeUpdates) {
      fetchClusters();
      // Set up polling for real-time updates
      const interval = setInterval(fetchClusters, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    } else {
      setClusters(clusteredData);
    }
  }, [clusteredData, realTimeUpdates, clusterRadius]);

  // Handle cluster click events
  const handleClusterClick = (cluster, event) => {
    setSelectedCluster(cluster);
    
    if (onClusterClick) {
      onClusterClick(cluster, event);
    }
  };

  // Handle popup close
  const handlePopupClose = () => {
    setSelectedCluster(null);
  };

  if (!visible || clusters.length === 0) {
    return null;
  }

  // Calculate dynamic radius based on case count
  const calculateDynamicRadius = (caseCount) => {
    // Base radius of 100m, with additional 50m per case, max 1000m
    const baseRadius = 100;
    const radiusPerCase = 50;
    const maxRadius = 1000;
    
    return Math.min(baseRadius + (caseCount * radiusPerCase), maxRadius);
  };

  if (!visible || clusters.length === 0) {
    return null;
  }

  return (
    <LayerGroup>
      {clusters.map((cluster) => {
        const dynamicRadius = calculateDynamicRadius(cluster.caseCount);
        const color = getSeverityColor(cluster.severity);
        
        return (
          <Circle
            key={cluster.id}
            center={[cluster.center[1], cluster.center[0]]} // Note: backend returns [lng, lat], leaflet expects [lat, lng]
            radius={dynamicRadius}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.4,
              weight: 3,
              opacity: 0.8
            }}
            eventHandlers={{
              click: (event) => handleClusterClick(cluster, event),
              mouseover: (event) => {
                event.target.setStyle({
                  fillOpacity: 0.6,
                  weight: 4
                });
              },
              mouseout: (event) => {
                event.target.setStyle({
                  fillOpacity: 0.4,
                  weight: 3
                });
              }
            }}
          >
            {selectedCluster && selectedCluster.id === cluster.id && (
              <CaseClusterPopup 
                cluster={cluster}
                onClose={handlePopupClose}
              />
            )}
          </Circle>
        );
      })}
      
      {/* Loading indicator */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          Updating clusters...
        </div>
      )}
    </LayerGroup>
  );
};

export default PatientCaseCircles;