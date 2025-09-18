import { useState, useEffect, useCallback, useRef } from 'react';
import clusterService from '../services/clusterService';

/**
 * Custom hook for managing patient case clusters
 * Provides clustering functionality, real-time updates, and filtering
 */
const usePatientClusters = (options = {}) => {
  const {
    clusterRadius = 1000,
    autoUpdate = true,
    updateInterval = 30000,
    initialFilters = {},
    enableRealTime = true
  } = options;

  // State management
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [statistics, setStatistics] = useState({
    totalClusters: 0,
    totalCases: 0,
    severityBreakdown: { mild: 0, moderate: 0, severe: 0 },
    averageCasesPerCluster: 0
  });

  // Refs for cleanup
  const updateSubscriptionRef = useRef(null);
  const mountedRef = useRef(true);

  /**
   * Fetch and cluster patient data
   */
  const fetchClusters = useCallback(async (customFilters = null) => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const filterParams = customFilters || filters;
      const clusterData = await clusterService.getAndClusterPatientReports(
        filterParams, 
        clusterRadius
      );

      if (mountedRef.current) {
        const filteredClusters = clusterService.filterClusters(
          clusterData.clusters, 
          filterParams
        );
        
        setClusters(filteredClusters);
        setStatistics(clusterService.getClusterStatistics(filteredClusters));
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Failed to fetch patient clusters');
        console.error('Error fetching clusters:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [filters, clusterRadius]);

  /**
   * Update filters and refetch data
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Refresh cluster data
   */
  const refresh = useCallback(() => {
    fetchClusters();
  }, [fetchClusters]);

  /**
   * Create alert for a specific cluster
   */
  const createClusterAlert = useCallback(async (cluster, alertData = {}) => {
    try {
      setLoading(true);
      const alert = await clusterService.createClusterAlert(cluster, alertData);
      
      // Optionally refresh clusters after creating alert
      await fetchClusters();
      
      return alert;
    } catch (err) {
      setError(err.message || 'Failed to create cluster alert');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchClusters]);

  /**
   * Get cluster by ID
   */
  const getClusterById = useCallback((clusterId) => {
    return clusters.find(cluster => cluster.id === clusterId);
  }, [clusters]);

  /**
   * Filter clusters by severity
   */
  const filterBySeverity = useCallback((severityLevels) => {
    updateFilters({ severity: severityLevels });
  }, [updateFilters]);

  /**
   * Filter clusters by case count
   */
  const filterByCaseCount = useCallback((minCaseCount) => {
    updateFilters({ minCaseCount });
  }, [updateFilters]);

  /**
   * Filter clusters by date range
   */
  const filterByDateRange = useCallback((dateFrom, dateTo) => {
    updateFilters({ dateFrom, dateTo });
  }, [updateFilters]);

  /**
   * Filter clusters by geographic bounds
   */
  const filterByBounds = useCallback((bounds) => {
    updateFilters({ bounds });
  }, [updateFilters]);

  // Initial data fetch
  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  // Set up real-time updates
  useEffect(() => {
    if (!enableRealTime || !autoUpdate) return;

    const handleClusterUpdate = (clusterData) => {
      if (mountedRef.current) {
        const filteredClusters = clusterService.filterClusters(
          clusterData.clusters, 
          filters
        );
        setClusters(filteredClusters);
        setStatistics(clusterService.getClusterStatistics(filteredClusters));
      }
    };

    updateSubscriptionRef.current = clusterService.subscribeToClusterUpdates(
      handleClusterUpdate,
      filters
    );

    return () => {
      if (updateSubscriptionRef.current) {
        updateSubscriptionRef.current();
      }
    };
  }, [enableRealTime, autoUpdate, filters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (updateSubscriptionRef.current) {
        updateSubscriptionRef.current();
      }
    };
  }, []);

  return {
    // Data
    clusters,
    statistics,
    loading,
    error,
    filters,

    // Actions
    refresh,
    updateFilters,
    clearFilters,
    createClusterAlert,
    getClusterById,

    // Filter helpers
    filterBySeverity,
    filterByCaseCount,
    filterByDateRange,
    filterByBounds,

    // Utilities
    fetchClusters
  };
};

export default usePatientClusters;