import { useState } from 'react';

const ReportsList = ({ 
  reports, 
  loading, 
  error, 
  filters, 
  onViewReport, 
  onFilterChange, 
  onRefresh 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-green-100 text-green-800',
      under_investigation: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const priorityColors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600'
    };
    return priorityColors[priority] || 'text-gray-600';
  };

  const getTypeIcon = (type) => {
    const typeIcons = {
      water: '💧',
      patient: '🏥'
    };
    return typeIcons[type] || '📄';
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filters.type === 'all' || report.type === filters.type;
    const matchesStatus = filters.status === 'all' || report.status === filters.status;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <span className="text-red-600 text-lg mb-2 block">⚠️</span>
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Reports</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="water">Water Quality</option>
              <option value="patient">Patient Reports</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="under_investigation">Under Investigation</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={onRefresh}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Reports ({filteredReports.length})
          </h2>
        </div>
        
        {filteredReports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <span className="text-4xl mb-4 block">📄</span>
            <h3 className="text-lg font-medium mb-2">No reports found</h3>
            <p>Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewReport(report)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">{getTypeIcon(report.type)}</span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {report.title}
                      </h3>
                      <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {report.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{report.summary}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>ID: {report.id}</span>
                      <span>📍 {report.location}</span>
                      <span>👤 {report.submittedBy}</span>
                      <span>📅 {new Date(report.submittedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end ml-4">
                    <span className={`text-sm font-medium ${getPriorityColor(report.priority)}`}>
                      {report.priority.toUpperCase()} PRIORITY
                    </span>
                    <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsList;