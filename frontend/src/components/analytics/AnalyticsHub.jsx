import { useState, useEffect } from 'react';
import DataExplorer from './DataExplorer';
import TrendAnalysis from './TrendAnalysis';
import AnalyticsMap from '../maps/AnalyticsMap';
import MapFilter from '../maps/MapFilter';
import ExportModal from './ExportModal';
import FilterPanel from './FilterPanel';
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
  const [showExportModal, setShowExportModal] = useState(false);
  const [mapData, setMapData] = useState({
    waterReports: [],
    patientReports: []
  });
  const [loadingMapData, setLoadingMapData] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

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
            {isExporting ? 'Exporting...' : 'Quick CSV'}
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Options
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        isCollapsed={filtersCollapsed}
        onToggleCollapse={() => setFiltersCollapsed(!filtersCollapsed)}
      />

      {/* Location Filter Map */}
      {!filtersCollapsed && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Filter</h3>
          <MapFilter
            onAreaSelect={handleLocationFilter}
            selectedArea={filters.locationBounds}
            height="250px"
          />
        </div>
      )}

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

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        filters={filters}
      />
    </div>
  );
};

export default AnalyticsHub;