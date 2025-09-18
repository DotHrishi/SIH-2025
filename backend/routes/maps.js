const express = require('express');
const router = express.Router();
const {
  getPatientClusters,
  getClusterDetails,
  getClusterUpdates
} = require('../src/controllers/mapController');

/**
 * @route GET /api/maps/patient-clusters
 * @desc Get geographic clusters of patient cases
 * @access Public
 * @query {number} radius - Clustering radius in meters (default: 1000)
 * @query {string} startDate - Filter cases from this date
 * @query {string} endDate - Filter cases until this date
 * @query {string} severity - Filter by severity (mild, moderate, severe, critical)
 * @query {string} disease - Filter by suspected disease
 * @query {string} location - Filter by location (partial match)
 * @query {number} minCases - Minimum cases per cluster (default: 1)
 */
router.get('/patient-clusters', getPatientClusters);

/**
 * @route GET /api/maps/cluster-details/:clusterId
 * @desc Get detailed information about a specific cluster
 * @access Public
 * @param {string} clusterId - Cluster identifier
 * @query {number} radius - Cluster radius in meters (default: 1000)
 * @query {number} centerLat - Cluster center latitude (required)
 * @query {number} centerLon - Cluster center longitude (required)
 * @query {string} startDate - Filter cases from this date
 * @query {string} endDate - Filter cases until this date
 */
router.get('/cluster-details/:clusterId', getClusterDetails);

/**
 * @route GET /api/maps/cluster-updates
 * @desc Get real-time cluster updates since last timestamp
 * @access Public
 * @query {string} lastUpdate - ISO timestamp of last update (required)
 * @query {number} radius - Clustering radius in meters (default: 1000)
 */
router.get('/cluster-updates', getClusterUpdates);

module.exports = router;