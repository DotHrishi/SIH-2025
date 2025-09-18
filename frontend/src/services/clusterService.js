import api from './api';
import { clusterPatientCases } from '../utils/geoUtils';

/**
 * Service for handling patient case clustering operations
 */
class ClusterService {
  /**
   * Get patient clusters from the backend API
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise} API response with cluster data
   */
  async getPatientClusters(params = {}) {
    try {
      const response = await api.get('/maps/patient-clusters', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching patient clusters:', error);
      throw error;
    }
  }

  /**
   * Get patient reports and cluster them on the frontend
   * @param {Object} params - Query parameters for filtering patient reports
   * @param {number} clusterRadius - Clustering radius in meters
   * @returns {Promise} Clustered patient data
   */
  async getAndClusterPatientReports(params = {}, clusterRadius = 1000) {
    try {
      // Fetch patient reports from API
      const response = await api.get('/reports/patient', { params });
      const patientReports = response.data.reports || response.data;

      // Cluster the reports on the frontend
      const clusters = clusterPatientCases(patientReports, clusterRadius);

      return {
        success: true,
        clusters,
        totalReports: patientReports.length,
        totalClusters: clusters.length,
        clusterRadius
      };
    } catch (error) {
      console.error('Error fetching and clustering patient reports:', error);
      throw error;
    }
  }

  /**
   * Get cluster details by cluster ID
   * @param {string} clusterId - Cluster identifier
   * @returns {Promise} Cluster details
   */
  async getClusterDetails(clusterId) {
    try {
      const response = await api.get(`/maps/patient-clusters/${clusterId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cluster details:', error);
      throw error;
    }
  }

  /**
   * Create an alert for a patient cluster
   * @param {Object} cluster - Cluster data
   * @param {Object} alertData - Additional alert information
   * @returns {Promise} Created alert response
   */
  async createClusterAlert(cluster, alertData = {}) {
    try {
      const alertPayload = {
        type: 'health_cluster',
        severity: this.mapClusterSeverityToAlertSeverity(cluster.severity),
        title: `Health Cluster Alert - ${cluster.caseCount} cases`,
        description: `Patient case cluster detected with ${cluster.caseCount} cases. Overall severity: ${cluster.severity}`,
        location: {
          coordinates: [cluster.center.lng, cluster.center.lat],
          address: cluster.cases[0]?.patientInfo?.location || 'Unknown location'
        },
        source: {
          type: 'patient_cluster',
          sourceId: cluster.id,
          metadata: {
            caseCount: cluster.caseCount,
            severity: cluster.severity,
            severityBreakdown: cluster.severityBreakdown,
            clusterRadius: cluster.radius
          }
        },
        ...alertData
      };

      const response = await api.post('/alerts', alertPayload);
      return response.data;
    } catch (error) {
      console.error('Error creating cluster alert:', error);
      throw error;
    }
  }

  /**
   * Map cluster severity to alert severity
   * @param {string} clusterSeverity - Cluster severity level
   * @returns {string} Alert severity level
   */
  mapClusterSeverityToAlertSeverity(clusterSeverity) {
    const severityMap = {
      mild: 'low',
      moderate: 'medium',
      severe: 'high'
    };
    return severityMap[clusterSeverity] || 'low';
  }

  /**
   * Get real-time cluster updates
   * @param {Function} callback - Callback function for updates
   * @param {Object} params - Filter parameters
   * @returns {Function} Cleanup function to stop updates
   */
  subscribeToClusterUpdates(callback, params = {}) {
    // For now, implement polling. In a real application, this would use WebSockets
    const interval = setInterval(async () => {
      try {
        const clusterData = await this.getAndClusterPatientReports(params);
        callback(clusterData);
      } catch (error) {
        console.error('Error in cluster update subscription:', error);
      }
    }, 30000); // Update every 30 seconds

    // Return cleanup function
    return () => clearInterval(interval);
  }

  /**
   * Filter clusters by various criteria
   * @param {Array} clusters - Array of clusters to filter
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered clusters
   */
  filterClusters(clusters, filters = {}) {
    let filteredClusters = [...clusters];

    // Filter by severity
    if (filters.severity && filters.severity.length > 0) {
      filteredClusters = filteredClusters.filter(cluster => 
        filters.severity.includes(cluster.severity)
      );
    }

    // Filter by minimum case count
    if (filters.minCaseCount) {
      filteredClusters = filteredClusters.filter(cluster => 
        cluster.caseCount >= filters.minCaseCount
      );
    }

    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      filteredClusters = filteredClusters.filter(cluster => {
        const clusterDate = new Date(cluster.createdAt);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

        if (fromDate && clusterDate < fromDate) return false;
        if (toDate && clusterDate > toDate) return false;
        return true;
      });
    }

    // Filter by geographic bounds
    if (filters.bounds) {
      const { north, south, east, west } = filters.bounds;
      filteredClusters = filteredClusters.filter(cluster => {
        const { lat, lng } = cluster.center;
        return lat <= north && lat >= south && lng <= east && lng >= west;
      });
    }

    return filteredClusters;
  }

  /**
   * Get cluster statistics
   * @param {Array} clusters - Array of clusters
   * @returns {Object} Cluster statistics
   */
  getClusterStatistics(clusters) {
    if (!clusters || clusters.length === 0) {
      return {
        totalClusters: 0,
        totalCases: 0,
        severityBreakdown: { mild: 0, moderate: 0, severe: 0 },
        averageCasesPerCluster: 0
      };
    }

    const totalCases = clusters.reduce((sum, cluster) => sum + cluster.caseCount, 0);
    const severityBreakdown = clusters.reduce((acc, cluster) => {
      acc[cluster.severity] = (acc[cluster.severity] || 0) + 1;
      return acc;
    }, { mild: 0, moderate: 0, severe: 0 });

    return {
      totalClusters: clusters.length,
      totalCases,
      severityBreakdown,
      averageCasesPerCluster: Math.round(totalCases / clusters.length * 100) / 100
    };
  }
}

// Export singleton instance
export default new ClusterService();