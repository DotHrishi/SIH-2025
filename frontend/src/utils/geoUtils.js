/**
 * Geographic utility functions for patient case clustering and map operations
 */

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param {Object} point1 - First point with lat, lng properties
 * @param {Object} point2 - Second point with lat, lng properties
 * @returns {number} Distance in meters
 */
export const calculateDistance = (point1, point2) => {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (point1.lat * Math.PI) / 180;
  const lat2Rad = (point2.lat * Math.PI) / 180;
  const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a = 
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * Calculate centroid of a group of geographic points
 * @param {Array} points - Array of points with lat, lng properties
 * @returns {Object} Centroid point with lat, lng properties
 */
export const calculateCentroid = (points) => {
  if (!points || points.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sum = points.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / points.length,
    lng: sum.lng / points.length
  };
};

/**
 * Cluster patient cases based on geographic proximity
 * @param {Array} patientReports - Array of patient reports with location data
 * @param {number} clusterRadius - Clustering radius in meters (default: 1000m)
 * @returns {Array} Array of clusters with cases and metadata
 */
export const clusterPatientCases = (patientReports, clusterRadius = 1000) => {
  if (!patientReports || patientReports.length === 0) {
    return [];
  }

  const clusters = [];

  patientReports.forEach(report => {
    // Skip reports without valid location data
    if (!report.location || !report.location.coordinates || 
        report.location.coordinates.length < 2) {
      return;
    }

    const reportLocation = {
      lat: report.location.coordinates[1],
      lng: report.location.coordinates[0]
    };

    // Find existing cluster within radius
    const existingCluster = clusters.find(cluster => 
      calculateDistance(cluster.center, reportLocation) <= clusterRadius
    );

    if (existingCluster) {
      // Add to existing cluster
      existingCluster.cases.push(report);
      existingCluster.center = calculateCentroid(
        existingCluster.cases.map(c => ({
          lat: c.location.coordinates[1],
          lng: c.location.coordinates[0]
        }))
      );
      existingCluster.severity = calculateClusterSeverity(existingCluster.cases);
      existingCluster.caseCount = existingCluster.cases.length;
    } else {
      // Create new cluster
      clusters.push({
        id: `cluster_${clusters.length + 1}`,
        center: reportLocation,
        cases: [report],
        severity: report.severity || 'mild',
        caseCount: 1,
        radius: calculateClusterRadius(1),
        color: getSeverityColor(report.severity || 'mild'),
        createdAt: new Date().toISOString()
      });
    }
  });

  // Update cluster properties after all cases are processed
  clusters.forEach(cluster => {
    cluster.radius = calculateClusterRadius(cluster.caseCount);
    cluster.color = getSeverityColor(cluster.severity);
    cluster.severityBreakdown = calculateSeverityBreakdown(cluster.cases);
  });

  return clusters;
};

/**
 * Calculate cluster severity based on cases within the cluster
 * @param {Array} cases - Array of patient cases
 * @returns {string} Overall cluster severity (mild, moderate, severe)
 */
export const calculateClusterSeverity = (cases) => {
  if (!cases || cases.length === 0) return 'mild';

  const severityCounts = cases.reduce((acc, case_) => {
    const severity = case_.severity || 'mild';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});

  const severeCount = severityCounts.severe || 0;
  const moderateCount = severityCounts.moderate || 0;
  const totalCases = cases.length;

  // If more than 30% are severe, cluster is severe
  if (severeCount / totalCases > 0.3) {
    return 'severe';
  }
  
  // If more than 50% are moderate or severe, cluster is moderate
  if ((moderateCount + severeCount) / totalCases > 0.5) {
    return 'moderate';
  }

  return 'mild';
};

/**
 * Calculate cluster radius based on case count
 * @param {number} caseCount - Number of cases in cluster
 * @returns {number} Radius in pixels for map display
 */
export const calculateClusterRadius = (caseCount) => {
  const baseRadius = 50; // Minimum radius in pixels
  const scaleFactor = 15; // Additional pixels per case
  const maxRadius = 200; // Maximum radius in pixels
  
  const calculatedRadius = baseRadius + (caseCount * scaleFactor);
  return Math.min(calculatedRadius, maxRadius);
};

/**
 * Get color for severity level
 * @param {string} severity - Severity level (mild, moderate, severe)
 * @returns {string} Hex color code
 */
export const getSeverityColor = (severity) => {
  const colors = {
    mild: '#10B981',    // Green
    moderate: '#F59E0B', // Yellow
    severe: '#EF4444'    // Red
  };
  
  return colors[severity] || colors.mild;
};

/**
 * Calculate severity breakdown for a cluster
 * @param {Array} cases - Array of patient cases
 * @returns {Object} Breakdown of cases by severity
 */
export const calculateSeverityBreakdown = (cases) => {
  return cases.reduce((acc, case_) => {
    const severity = case_.severity || 'mild';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, { mild: 0, moderate: 0, severe: 0 });
};

/**
 * Get recent cases from a cluster (last 7 days)
 * @param {Array} cases - Array of patient cases
 * @param {number} limit - Maximum number of recent cases to return
 * @returns {Array} Array of recent cases
 */
export const getRecentCases = (cases, limit = 5) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return cases
    .filter(case_ => new Date(case_.reportDate || case_.createdAt) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.reportDate || b.createdAt) - new Date(a.reportDate || a.createdAt))
    .slice(0, limit);
};

/**
 * Format coordinates for display
 * @param {Array} coordinates - [longitude, latitude] array
 * @returns {string} Formatted coordinate string
 */
export const formatCoordinates = (coordinates) => {
  if (!coordinates || coordinates.length < 2) {
    return 'N/A';
  }
  
  const [lng, lat] = coordinates;
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

/**
 * Check if a point is within a circular area
 * @param {Object} point - Point with lat, lng properties
 * @param {Object} center - Center point with lat, lng properties
 * @param {number} radius - Radius in meters
 * @returns {boolean} True if point is within the area
 */
export const isPointInCircle = (point, center, radius) => {
  return calculateDistance(point, center) <= radius;
};