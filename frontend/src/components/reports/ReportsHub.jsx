import { useState, useEffect } from 'react';
import ReportsList from './ReportsList';
import ReportDetails from './ReportDetails';
import api from '../../services/api';

const ReportsHub = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'details'
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: 'all'
  });

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - replace with actual API call
      const mockReports = [
        {
          id: 'WR-2024-001',
          type: 'water',
          title: 'Water Quality Test - Downtown Area',
          status: 'reviewed',
          submittedDate: '2024-01-15T10:30:00Z',
          location: 'Downtown Water Treatment Plant',
          submittedBy: 'Dr. Sarah Johnson',
          priority: 'medium',
          summary: 'Routine water quality testing showing elevated chlorine levels'
        },
        {
          id: 'PR-2024-002',
          type: 'patient',
          title: 'Waterborne Illness Case',
          status: 'pending',
          submittedDate: '2024-01-14T14:20:00Z',
          location: 'City General Hospital',
          submittedBy: 'Dr. Michael Chen',
          priority: 'high',
          summary: 'Patient presenting with symptoms consistent with waterborne illness'
        },
        {
          id: 'WR-2024-003',
          type: 'water',
          title: 'Contamination Alert - River Source',
          status: 'under_investigation',
          submittedDate: '2024-01-13T09:15:00Z',
          location: 'River Intake Point A',
          submittedBy: 'Environmental Team',
          priority: 'high',
          summary: 'Potential contamination detected in primary water source'
        }
      ];
      
      setReports(mockReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setCurrentView('details');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedReport(null);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'details':
        return (
          <ReportDetails
            report={selectedReport}
            onBack={handleBackToList}
          />
        );
      
      default:
        return (
          <ReportsList
            reports={reports}
            loading={loading}
            error={error}
            filters={filters}
            onViewReport={handleViewReport}
            onFilterChange={handleFilterChange}
            onRefresh={fetchReports}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">
            View and manage submitted surveillance reports
          </p>
        </div>
        
        {currentView === 'list' && (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.location.href = '/forms'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Submit New Report
            </button>
          </div>
        )}
      </div>
      
      {renderCurrentView()}
    </div>
  );
};

export default ReportsHub;