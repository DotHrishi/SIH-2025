const PatientReport = require('../models/PatientReport');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Array} coord1 - [longitude, latitude]
 * @param {Array} coord2 - [longitude, latitude]
 * @returns {number} Distance in meters
 */
const calculateDistance = (coord1, coord2) => {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = coord1[1] * Math.PI / 180;
  const lat2Rad = coord2[1] * Math.PI / 180;
  const deltaLatRad = (coord2[1] - coord1[1]) * Math.PI / 180;
  const deltaLonRad = (coord2[0] - coord1[0]) * Math.PI / 180;

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calculate centroid of multiple coordinates
 * @param {Array} coordinates - Array of [longitude, latitude] pairs
 * @returns {Array} Centroid [longitude, latitude]
 */
const calculateCentroid = (coordinates) => {
  if (coordinates.length === 0) return [0, 0];
  if (coordinates.length === 1) return coordinates[0];

  let totalLat = 0;
  let totalLon = 0;
  
  coordinates.forEach(coord => {
    totalLon += coord[0];
    totalLat += coord[1];
  });

  return [totalLon / coordinates.length, totalLat / coordinates.length];
};

/**
 * Determine cluster severity based on cases
 * @param {Array} cases - Array of patient reports
 * @returns {string} Severity level (mild, moderate, severe)
 */
const calculateClusterSeverity = (cases) => {
  if (cases.length === 0) return 'mild';

  const severityWeights = { mild: 1, moderate: 2, severe: 3, critical: 4 };
  let totalWeight = 0;
  let severeCases = 0;
  let criticalCases = 0;

  cases.forEach(case_ => {
    totalWeight += severityWeights[case_.severity] || 1;
    if (case_.severity === 'severe') severeCases++;
    if (case_.severity === 'critical') criticalCases++;
  });

  const avgWeight = totalWeight / cases.length;
  const severeRatio = (severeCases + criticalCases) / cases.length;

  // Determine cluster severity
  if (criticalCases > 0 || severeRatio > 0.5 || avgWeight >= 3.5) {
    return 'severe';
  } else if (severeRatio > 0.2 || avgWeight >= 2.5) {
    return 'moderate';
  } else {
    return 'mild';
  }
};

/**
 * Cluster patient cases by geographic proximity
 * @param {Array} cases - Array of patient reports with coordinates
 * @param {number} radiusMeters - Clustering radius in meters
 * @returns {Array} Array of clusters
 */
const clusterPatientCases = (cases, radiusMeters = 1000) => {
  const clusters = [];
  const processedCases = new Set();

  cases.forEach(case_ => {
    if (processedCases.has(case_._id.toString())) return;
    if (!case_.patientInfo.coordinates || case_.patientInfo.coordinates.length !== 2) return;

    // Find all cases within radius
    const clusterCases = [case_];
    processedCases.add(case_._id.toString());

    cases.forEach(otherCase => {
      if (processedCases.has(otherCase._id.toString())) return;
      if (!otherCase.patientInfo.coordinates || otherCase.patientInfo.coordinates.length !== 2) return;

      const distance = calculateDistance(
        case_.patientInfo.coordinates,
        otherCase.patientInfo.coordinates
      );

      if (distance <= radiusMeters) {
        clusterCases.push(otherCase);
        processedCases.add(otherCase._id.toString());
      }
    });

    // Create cluster
    const coordinates = clusterCases.map(c => c.patientInfo.coordinates);
    const center = calculateCentroid(coordinates);
    const severity = calculateClusterSeverity(clusterCases);

    // Calculate severity breakdown
    const severityBreakdown = {
      mild: clusterCases.filter(c => c.severity === 'mild').length,
      moderate: clusterCases.filter(c => c.severity === 'moderate').length,
      severe: clusterCases.filter(c => c.severity === 'severe').length,
      critical: clusterCases.filter(c => c.severity === 'critical').length
    };

    clusters.push({
      id: `cluster_${clusters.length + 1}`,
      center,
      caseCount: clusterCases.length,
      severity,
      severityBreakdown,
      radius: Math.max(50, Math.min(500, clusterCases.length * 15)), // Dynamic radius
      cases: clusterCases.map(c => ({
        caseId: c.caseId,
        severity: c.severity,
        reportDate: c.reportDate,
        suspectedDisease: c.diseaseIdentification.suspectedDisease,
        coordinates: c.patientInfo.coordinates,
        location: c.patientInfo.location
      })),
      recentCases: clusterCases
        .sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate))
        .slice(0, 5)
        .map(c => ({
          caseId: c.caseId,
          severity: c.severity,
          reportDate: c.reportDate,
          suspectedDisease: c.diseaseIdentification.suspectedDisease
        }))
    });
  });

  return clusters.sort((a, b) => b.caseCount - a.caseCount);
};

/**
 * Get patient case clusters for map visualization
 * GET /api/maps/patient-clusters
 */
const getPatientClusters = async (req, res) => {
  try {
    const {
      radius = 1000,
      startDate,
      endDate,
      severity,
      disease,
      location,
      minCases = 1
    } = req.query;

    // Build filter for patient reports
    const filter = {
      'patientInfo.coordinates': { $exists: true, $ne: null }
    };

    // Date range filter
    if (startDate || endDate) {
      filter.reportDate = {};
      if (startDate) {
        filter.reportDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.reportDate.$lte = new Date(endDate);
      }
    }

    // Severity filter
    if (severity) {
      filter.severity = severity;
    }

    // Disease filter
    if (disease) {
      filter['diseaseIdentification.suspectedDisease'] = disease;
    }

    // Location filter
    if (location) {
      filter['patientInfo.location'] = new RegExp(location, 'i');
    }

    // Fetch patient reports with coordinates
    const patientReports = await PatientReport.find(filter)
      .select('caseId patientInfo severity diseaseIdentification reportDate emergencyAlert')
      .lean();

    if (patientReports.length === 0) {
      return res.json({
        success: true,
        data: {
          clusters: [],
          totalCases: 0,
          totalClusters: 0
        }
      });
    }

    // Perform clustering
    const clusters = clusterPatientCases(patientReports, parseInt(radius));

    // Filter clusters by minimum case count
    const filteredClusters = clusters.filter(cluster => cluster.caseCount >= parseInt(minCases));

    res.json({
      success: true,
      data: {
        clusters: filteredClusters,
        totalCases: patientReports.length,
        totalClusters: filteredClusters.length,
        parameters: {
          radius: parseInt(radius),
          minCases: parseInt(minCases),
          filters: { startDate, endDate, severity, disease, location }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching patient clusters:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch patient clusters',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get detailed information about a specific cluster
 * GET /api/maps/cluster-details/:clusterId
 */
const getClusterDetails = async (req, res) => {
  try {
    const { clusterId } = req.params;
    const {
      radius = 1000,
      centerLat,
      centerLon,
      startDate,
      endDate
    } = req.query;

    if (!centerLat || !centerLon) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Center coordinates (centerLat, centerLon) are required'
        }
      });
    }

    const center = [parseFloat(centerLon), parseFloat(centerLat)];

    // Build filter for cases within radius
    const filter = {
      'patientInfo.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: center
          },
          $maxDistance: parseInt(radius)
        }
      }
    };

    // Date range filter
    if (startDate || endDate) {
      filter.reportDate = {};
      if (startDate) {
        filter.reportDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.reportDate.$lte = new Date(endDate);
      }
    }

    // Fetch detailed case information
    const cases = await PatientReport.find(filter)
      .populate('suspectedWaterSource.relatedWaterReport', 'reportId location.address')
      .sort({ reportDate: -1 })
      .lean();

    if (cases.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No cases found in the specified cluster area'
        }
      });
    }

    // Calculate cluster statistics
    const severityBreakdown = {
      mild: cases.filter(c => c.severity === 'mild').length,
      moderate: cases.filter(c => c.severity === 'moderate').length,
      severe: cases.filter(c => c.severity === 'severe').length,
      critical: cases.filter(c => c.severity === 'critical').length
    };

    const diseaseBreakdown = {};
    cases.forEach(case_ => {
      const disease = case_.diseaseIdentification.suspectedDisease;
      diseaseBreakdown[disease] = (diseaseBreakdown[disease] || 0) + 1;
    });

    const ageGroupBreakdown = {};
    cases.forEach(case_ => {
      const ageGroup = case_.patientInfo.ageGroup;
      ageGroupBreakdown[ageGroup] = (ageGroupBreakdown[ageGroup] || 0) + 1;
    });

    // Calculate timeline data (cases per day)
    const timeline = {};
    cases.forEach(case_ => {
      const date = new Date(case_.reportDate).toISOString().split('T')[0];
      timeline[date] = (timeline[date] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        clusterId,
        center,
        radius: parseInt(radius),
        totalCases: cases.length,
        severityBreakdown,
        diseaseBreakdown,
        ageGroupBreakdown,
        timeline,
        emergencyAlerts: cases.filter(c => c.emergencyAlert).length,
        cases: cases.map(case_ => ({
          caseId: case_.caseId,
          reportDate: case_.reportDate,
          severity: case_.severity,
          suspectedDisease: case_.diseaseIdentification.suspectedDisease,
          patientAge: case_.patientInfo.age,
          patientAgeGroup: case_.patientInfo.ageGroup,
          location: case_.patientInfo.location,
          coordinates: case_.patientInfo.coordinates,
          emergencyAlert: case_.emergencyAlert,
          waterSource: case_.suspectedWaterSource.source,
          relatedWaterReport: case_.suspectedWaterSource.relatedWaterReport
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching cluster details:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch cluster details',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get real-time cluster updates (for WebSocket or polling)
 * GET /api/maps/cluster-updates
 */
const getClusterUpdates = async (req, res) => {
  try {
    const {
      lastUpdate,
      radius = 1000
    } = req.query;

    if (!lastUpdate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'lastUpdate timestamp is required'
        }
      });
    }

    const lastUpdateDate = new Date(lastUpdate);

    // Find new or updated patient reports since last update
    const newReports = await PatientReport.find({
      'patientInfo.coordinates': { $exists: true, $ne: null },
      $or: [
        { createdAt: { $gt: lastUpdateDate } },
        { updatedAt: { $gt: lastUpdateDate } }
      ]
    })
    .select('caseId patientInfo severity diseaseIdentification reportDate emergencyAlert')
    .lean();

    if (newReports.length === 0) {
      return res.json({
        success: true,
        data: {
          hasUpdates: false,
          newCases: 0,
          updatedClusters: []
        }
      });
    }

    // Get all recent reports for clustering context
    const recentReports = await PatientReport.find({
      'patientInfo.coordinates': { $exists: true, $ne: null },
      reportDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    })
    .select('caseId patientInfo severity diseaseIdentification reportDate emergencyAlert')
    .lean();

    // Perform clustering on recent data
    const clusters = clusterPatientCases(recentReports, parseInt(radius));

    // Find clusters that contain new reports
    const updatedClusters = clusters.filter(cluster => 
      cluster.cases.some(case_ => 
        newReports.some(newReport => newReport.caseId === case_.caseId)
      )
    );

    res.json({
      success: true,
      data: {
        hasUpdates: true,
        newCases: newReports.length,
        updatedClusters,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching cluster updates:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch cluster updates',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

module.exports = {
  getPatientClusters,
  getClusterDetails,
  getClusterUpdates
};