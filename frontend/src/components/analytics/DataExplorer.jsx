import { useState, useEffect } from 'react';
import api, { analyticsAPI } from '../../services/api';

const DataExplorer = ({ filters }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'reportDate',
    direction: 'desc'
  });

  useEffect(() => {
    fetchData();
  }, [filters, pagination.page, pagination.limit, sortConfig]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      // Add pagination
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      
      // Add sorting
      params.append('sortBy', sortConfig.key);
      params.append('sortOrder', sortConfig.direction);

      const response = await analyticsAPI.getCases({
        ...Object.fromEntries(params.entries())
      });
      
      if (response.data.success) {
        setData(response.data.data.cases);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.total,
          totalPages: response.data.data.totalPages
        }));
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      mild: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      severe: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[severity] || 'bg-gray-100 text-gray-800'}`}>
        {severity?.charAt(0).toUpperCase() + severity?.slice(1) || 'Unknown'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-red-400">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchData}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{pagination.total}</div>
          <div className="text-sm text-blue-800">Total Cases</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {data && Array.isArray(data) ? data.filter(item => item.severity === 'mild').length : 0}
          </div>
          <div className="text-sm text-green-800">Mild Cases</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {data && Array.isArray(data) ? data.filter(item => item.severity === 'moderate').length : 0}
          </div>
          <div className="text-sm text-yellow-800">Moderate Cases</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {data && Array.isArray(data) ? data.filter(item => item.severity === 'severe').length : 0}
          </div>
          <div className="text-sm text-red-800">Severe Cases</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Show</span>
          <select
            value={pagination.limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-700">entries</span>
        </div>
        
        <div className="text-sm text-gray-700">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('caseId')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Case ID {getSortIcon('caseId')}
              </th>
              <th
                onClick={() => handleSort('reportDate')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Date {getSortIcon('reportDate')}
              </th>
              <th
                onClick={() => handleSort('patientInfo.location')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Location {getSortIcon('patientInfo.location')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symptoms
              </th>
              <th
                onClick={() => handleSort('suspectedWaterSource.source')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Water Source {getSortIcon('suspectedWaterSource.source')}
              </th>
              <th
                onClick={() => handleSort('patientInfo.ageGroup')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Age Group {getSortIcon('patientInfo.ageGroup')}
              </th>
              <th
                onClick={() => handleSort('severity')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Severity {getSortIcon('severity')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data && Array.isArray(data) ? data.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.caseId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(item.reportDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.patientInfo?.location || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="max-w-xs truncate" title={item.symptoms?.join(', ')}>
                    {item.symptoms?.slice(0, 2).join(', ')}
                    {item.symptoms?.length > 2 && ` +${item.symptoms.length - 2} more`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.suspectedWaterSource?.source || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.patientInfo?.ageGroup || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getSeverityBadge(item.severity)}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-2">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    pagination.page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {data.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>
          <p className="text-gray-500">Try adjusting your filters to see more results.</p>
        </div>
      )}
    </div>
  );
};

export default DataExplorer;