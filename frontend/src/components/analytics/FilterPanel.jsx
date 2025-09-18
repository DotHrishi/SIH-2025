import { useState } from 'react';

const FilterPanel = ({ filters, onFilterChange, onClearFilters, isCollapsed, onToggleCollapse }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleLocalFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(key, value);
  };

  const handleClearAll = () => {
    const clearedFilters = {
      startDate: '',
      endDate: '',
      district: '',
      severity: '',
      ageGroup: '',
      symptoms: '',
      waterSource: '',
      locationBounds: null
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value && value !== '' && value !== null
    ).length;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {getActiveFilterCount() > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {getActiveFilterCount()} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClearAll}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg 
              className={`w-5 h-5 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Content */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={localFilters.startDate}
                onChange={(e) => handleLocalFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={localFilters.endDate}
                onChange={(e) => handleLocalFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input
                type="text"
                placeholder="Enter district name"
                value={localFilters.district}
                onChange={(e) => handleLocalFilterChange('district', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={localFilters.severity}
                onChange={(e) => handleLocalFilterChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Severities</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Age Group Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
              <select
                value={localFilters.ageGroup}
                onChange={(e) => handleLocalFilterChange('ageGroup', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Ages</option>
                <option value="0-5">0-5 years</option>
                <option value="5-15">5-15 years</option>
                <option value="15-25">15-25 years</option>
                <option value="25-35">25-35 years</option>
                <option value="35-45">35-45 years</option>
                <option value="45+">45+ years</option>
              </select>
            </div>

            {/* Symptoms Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
              <input
                type="text"
                placeholder="Enter symptoms"
                value={localFilters.symptoms}
                onChange={(e) => handleLocalFilterChange('symptoms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Water Source Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Water Source</label>
              <select
                value={localFilters.waterSource}
                onChange={(e) => handleLocalFilterChange('waterSource', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Sources</option>
                <option value="River">River</option>
                <option value="Lake">Lake</option>
                <option value="Pond">Pond</option>
                <option value="Well">Well</option>
                <option value="Borehole">Borehole</option>
                <option value="Spring">Spring</option>
                <option value="Tap Water">Tap Water</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Disease Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disease</label>
              <select
                value={localFilters.disease || ''}
                onChange={(e) => handleLocalFilterChange('disease', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Diseases</option>
                <option value="Cholera">Cholera</option>
                <option value="Diarrhea">Diarrhea</option>
                <option value="Typhoid">Typhoid</option>
                <option value="Hepatitis A">Hepatitis A</option>
                <option value="Gastroenteritis">Gastroenteritis</option>
                <option value="Dysentery">Dysentery</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  handleLocalFilterChange('startDate', lastWeek.toISOString().split('T')[0]);
                  handleLocalFilterChange('endDate', today.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Last 7 days
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  handleLocalFilterChange('startDate', lastMonth.toISOString().split('T')[0]);
                  handleLocalFilterChange('endDate', today.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Last 30 days
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const lastQuarter = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                  handleLocalFilterChange('startDate', lastQuarter.toISOString().split('T')[0]);
                  handleLocalFilterChange('endDate', today.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Last 3 months
              </button>
              <button
                onClick={() => handleLocalFilterChange('severity', 'severe')}
                className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
              >
                Severe cases only
              </button>
              <button
                onClick={() => handleLocalFilterChange('severity', 'critical')}
                className="px-3 py-1 text-sm bg-red-200 hover:bg-red-300 text-red-800 rounded-md transition-colors"
              >
                Critical cases only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;