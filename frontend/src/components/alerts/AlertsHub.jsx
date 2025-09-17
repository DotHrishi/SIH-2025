import { useState, useEffect } from 'react';
import { alertsAPI } from '../../services/api';
import { ALERT_TYPES, ALERT_SEVERITY, ALERT_STATUS } from '../../utils/constants';
import AlertCard from './AlertCard';
import AlertDetail from './AlertDetail';
import FilterPanel from './FilterPanel';

const AlertsHub = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    status: '',
    district: '',
    startDate: '',
    endDate: '',
    assignedTo: '',
    sortBy: 'priority',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    critical: 0,
    resolved: 0,
  });

  useEffect(() => {
    fetchAlerts();
    fetchStatistics();
  }, [filters, pagination.page, activeCategory]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      };

      // Apply category filter
      if (activeCategory !== 'all') {
        params.type = activeCategory;
      }

      const response = await alertsAPI.getAlerts(params);
      const responseData = response.data;
      
      // Handle different response structures
      let alertsData = [];
      let paginationData = { total: 0, totalPages: 0 };
      
      if (responseData.success) {
        // If response has success flag, extract from data property
        alertsData = responseData.data?.alerts || responseData.data || [];
        paginationData = responseData.data?.pagination || { total: alertsData.length, totalPages: 1 };
      } else {
        // Direct data response
        alertsData = Array.isArray(responseData) ? responseData : [];
        paginationData = { total: alertsData.length, totalPages: 1 };
      }
      
      setAlerts(alertsData);
      setPagination(prev => ({
        ...prev,
        total: paginationData.total,
        totalPages: paginationData.totalPages,
      }));
    } catch (err) {
      setError('Failed to fetch alerts');
      console.error('Error fetching alerts:', err);
      setAlerts([]); // Ensure alerts is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await alertsAPI.getStatistics();
      const statsData = response.data?.data || response.data || {
        total: 0,
        active: 0,
        critical: 0,
        resolved: 0,
      };
      setStatistics(statsData);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      // Set default statistics on error
      setStatistics({
        total: 0,
        active: 0,
        critical: 0,
        resolved: 0,
      });
    }
  };

  const handleStatusUpdate = async (alertId, newStatus) => {
    try {
      await alertsAPI.updateAlertStatus(alertId, {
        status: newStatus,
        performedBy: 'Current User', // This should come from auth context
        notes: `Status updated to ${newStatus}`,
      });
      await fetchAlerts();
      await fetchStatistics();
    } catch (err) {
      setError('Failed to update alert status');
      console.error('Error updating status:', err);
    }
  };

  const handleViewDetails = (alertId) => {
    setSelectedAlert(alertId);
  };

  const handleAssignTeam = (alertId) => {
    setSelectedAlert(alertId);
  };

  const handleEscalate = async (alertId) => {
    setSelectedAlert(alertId);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      severity: '',
      status: '',
      district: '',
      startDate: '',
      endDate: '',
      assignedTo: '',
      sortBy: 'priority',
      sortOrder: 'desc',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getCategoryAlerts = (category) => {
    if (!Array.isArray(alerts)) return [];
    if (category === 'all') return alerts;
    return alerts.filter(alert => alert.type === category);
  };

  const getCategoryCount = (category) => {
    if (category === 'all') return statistics.total || 0;
    if (!Array.isArray(alerts)) return 0;
    return alerts.filter(alert => alert.type === category).length;
  };

  const categories = [
    { id: 'all', label: 'All Alerts', icon: '📋', type: null },
    { id: ALERT_TYPES.WATER_QUALITY, label: 'Water Quality', icon: '💧', type: ALERT_TYPES.WATER_QUALITY },
    { id: ALERT_TYPES.HEALTH_CLUSTER, label: 'Health Clusters', icon: '🏥', type: ALERT_TYPES.HEALTH_CLUSTER },
    { id: ALERT_TYPES.EMERGENCY, label: 'Emergency', icon: '🚨', type: ALERT_TYPES.EMERGENCY },
    { id: ALERT_TYPES.OUTBREAK, label: 'Outbreak', icon: '⚠️', type: ALERT_TYPES.OUTBREAK },
  ];

  if (loading && alerts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Alerts & Actions Hub</h1>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center text-gray-500 mt-2">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Alerts & Actions Hub</h1>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Create Alert
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
            </div>
            <div className="text-2xl">📋</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-red-600">{statistics.active}</p>
            </div>
            <div className="text-2xl">🚨</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
              <p className="text-2xl font-bold text-orange-600">{statistics.critical}</p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{statistics.resolved}</p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeCategory === category.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {getCategoryCount(category.id)}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-center text-gray-500 mt-2">Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-500">
              {Object.values(filters).some(v => v) 
                ? 'Try adjusting your filters to see more results.'
                : 'There are no alerts matching your current category.'}
            </p>
          </div>
        ) : (
          <>
            {alerts.map((alert) => (
              <AlertCard
                key={alert._id}
                alert={alert}
                onStatusUpdate={handleStatusUpdate}
                onViewDetails={handleViewDetails}
                onAssignTeam={handleAssignTeam}
                onEscalate={handleEscalate}
              />
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(pagination.page - 1) * pagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === pagination.totalPages || 
                          Math.abs(page - pagination.page) <= 2
                        )
                        .map((page, index, array) => (
                          <div key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === pagination.page
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        ))}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetail
          alertId={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onUpdate={() => {
            fetchAlerts();
            fetchStatistics();
          }}
        />
      )}

      {/* Create Alert Modal - Placeholder for future implementation */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Alert</h3>
            <p className="text-gray-600 mb-4">
              Alert creation form will be implemented in a future task.
            </p>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsHub;