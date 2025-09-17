import { useState } from 'react';
import { ALERT_SEVERITY, ALERT_STATUS, ALERT_TYPES } from '../../utils/constants';

const FilterPanel = ({ filters, onFiltersChange, onClearFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleDateChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value !== '' && value !== null && value !== undefined
    ).length;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {getActiveFilterCount() > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {getActiveFilterCount()} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {getActiveFilterCount() > 0 && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Quick Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Alert Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Type
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="">All Types</option>
                <option value={ALERT_TYPES.WATER_QUALITY}>Water Quality</option>
                <option value={ALERT_TYPES.HEALTH_CLUSTER}>Health Cluster</option>
                <option value={ALERT_TYPES.EMERGENCY}>Emergency</option>
                <option value={ALERT_TYPES.OUTBREAK}>Outbreak</option>
                <option value={ALERT_TYPES.SYSTEM_MAINTENANCE}>System Maintenance</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={filters.severity || ''}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="">All Severities</option>
                <option value={ALERT_SEVERITY.CRITICAL}>Critical</option>
                <option value={ALERT_SEVERITY.HIGH}>High</option>
                <option value={ALERT_SEVERITY.MEDIUM}>Medium</option>
                <option value={ALERT_SEVERITY.LOW}>Low</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value={ALERT_STATUS.ACTIVE}>Active</option>
                <option value={ALERT_STATUS.ACKNOWLEDGED}>Acknowledged</option>
                <option value={ALERT_STATUS.INVESTIGATING}>Investigating</option>
                <option value={ALERT_STATUS.RESOLVED}>Resolved</option>
                <option value={ALERT_STATUS.FALSE_ALARM}>False Alarm</option>
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <input
                type="text"
                value={filters.district || ''}
                onChange={(e) => handleFilterChange('district', e.target.value)}
                placeholder="Enter district name..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Date Range and Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <input
                type="text"
                value={filters.assignedTo || ''}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                placeholder="Team member name..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy || 'priority'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="priority">Priority</option>
                <option value="urgency">Urgency</option>
                <option value="createdAt">Created Date</option>
                <option value="severity">Severity</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <select
                value={filters.sortOrder || 'desc'}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Filters
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  status: ALERT_STATUS.ACTIVE, 
                  severity: ALERT_SEVERITY.CRITICAL 
                })}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200 transition-colors"
              >
                Critical Active
              </button>
              <button
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  status: ALERT_STATUS.ACTIVE 
                })}
                className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm hover:bg-orange-200 transition-colors"
              >
                All Active
              </button>
              <button
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  type: ALERT_TYPES.WATER_QUALITY 
                })}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
              >
                Water Quality
              </button>
              <button
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  type: ALERT_TYPES.HEALTH_CLUSTER 
                })}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors"
              >
                Health Clusters
              </button>
              <button
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
                })}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm hover:bg-purple-200 transition-colors"
              >
                Last 24 Hours
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;