import { useState, useEffect } from 'react';
import DataExplorer from './DataExplorer';
import TrendAnalysis from './TrendAnalysis';
import AnalyticsMap from '../maps/AnalyticsMap';
import MapFilter from '../maps/MapFilter';
import api, { analyticsAPI } from '../../services/api';

const AnalyticsHub = () => {
  const [activeTab, setActiveTab] = useState('explorer');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    district: '',
    severity: '',
    ageGroup: '',
    symptoms: '',
    waterSource: '',
    locationBounds: null
  });
  const [isExporting, setIsExporting] = useState(false);
  const [mapData, setMapData] = useState({
    waterReports: [],
    patientReports: []
  });
  const [loadingMapData, setLoadingMapData] = useState(false);

  // Set default date range (last 30 days)
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    setFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }));
  }, []);

  // Load map data when filters change
  useEffect(() => {
    loadMapData();
  }, [filters]);

  const loadMapData = async () => {
    setLoadingMapData(true);
    try {
      const filterParams = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) filterParams[key] = value;
      });

      // Load water reports and patient reports for map visualization
      const [waterReportsResponse, patientReportsResponse] = await Promise.all([
        api.get('/reports/water', { params: filterParams }),
        api.get('/reports/patient', { params: filterParams })
      ]);

      setMapData({
        waterReports: waterReportsResponse.data.data || [],
        patientReports: patientReportsResponse.data.data || []
      });
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setLoadingMapData(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLocationFilter = (bounds) => {
    setFilters(prev => ({
      ...prev,
      locationBounds: bounds
    }));
  };

  const clearFilters = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    setFilters({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      district: '',
      severity: '',
      ageGroup: '',
      symptoms: '',
      waterSource: '',
      locationBounds: null
    });
  };

  const handleExport = async (format = 'csv') => {
    setIsExporting(true);
    try {
      const filterParams = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) filterParams[key] = value;
      });

      const response = format === 'csv' 
        ? await analyticsAPI.exportCSV(filterParams)
        : await analyticsAPI.exportExcel(filterParams);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-data-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Investigation Hub</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Clear All
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <input
              type="text"
              placeholder="Enter district name"
              value={filters.district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>

          {/* Age Group Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
            <select
              value={filters.ageGroup}
              onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              value={filters.symptoms}
              onChange={(e) => handleFilterChange('symptoms', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Water Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Water Source</label>
            <select
              value={filters.waterSource}
              onChange={(e) => handleFilterChange('waterSource', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>

        {/* Location Filter */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <MapFilter
            onAreaSelect={handleLocationFilter}
            selectedArea={filters.locationBounds}
            height="250px"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('explorer')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'explorer'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Data Explorer
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'trends'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Trend Analysis
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'map'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Map Visualization
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'explorer' && <DataExplorer filters={filters} />}
          {activeTab === 'trends' && <TrendAnalysis filters={filters} />}
          {activeTab === 'map' && (
            <div>
              {loadingMapData ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading map data...</span>
                </div>
              ) : (
                <AnalyticsMap
                  waterReports={mapData.waterReports}
                  patientReports={mapData.patientReports}
                  filters={filters}
                  onLocationFilter={handleLocationFilter}
                  height="600px"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHub;