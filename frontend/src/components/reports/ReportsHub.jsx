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
      
      // Fetch real data from backend using the reportsAPI
      const { reportsAPI } = await import('../../services/api');
      const [waterReportsResponse, patientReportsResponse] = await Promise.all([
        reportsAPI.getWaterReports(),
        reportsAPI.getPatientReports()
      ]);
      
      const waterReports = waterReportsResponse.data.success ? waterReportsResponse.data.data : [];
      const patientReports = patientReportsResponse.data.success ? patientReportsResponse.data.data : [];
      
      // Transform water reports to match UI format
      const transformedWaterReports = waterReports.map(report => ({
        id: report.reportId || report._id,
        type: 'water',
        title: `Water Quality Report - ${report.location?.district || 'Unknown Location'}`,
        status: report.status || 'pending',
        submittedDate: report.createdAt || report.sampleCollection?.collectionDate,
        location: report.location?.address || 'Unknown Location',
        submittedBy: report.submittedBy || 'Unknown',
        priority: getPriorityFromWaterReport(report),
        summary: generateWaterReportSummary(report),
        rawData: report // Keep original data for details view
      }));
      
      // Transform patient reports to match UI format
      const transformedPatientReports = patientReports.map(report => ({
        id: report.caseId || report._id,
        type: 'patient',
        title: `Patient Case - ${report.healthInfo?.suspectedDisease || 'Health Issue'}`,
        status: report.status || 'pending',
        submittedDate: report.createdAt || report.reportDate,
        location: report.location?.address || 'Unknown Location',
        submittedBy: report.submittedBy || 'Unknown',
        priority: report.healthInfo?.severity === 'severe' ? 'high' : 'medium',
        summary: `Patient: ${report.patientInfo?.name || 'Unknown'}, Symptoms: ${report.healthInfo?.symptoms?.join(', ') || 'Not specified'}`,
        rawData: report // Keep original data for details view
      }));
      
      // Combine and sort by date
      const allReports = [...transformedWaterReports, ...transformedPatientReports]
        .sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
      
      setReports(allReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please check if the backend server is running.');
      
      // Fallback to mock data if API fails
      const mockReports = [
        {
          id: 'MOCK-001',
          type: 'water',
          title: 'Sample Water Quality Report',
          status: 'pending',
          submittedDate: new Date().toISOString(),
          location: 'Sample Location',
          submittedBy: 'System',
          priority: 'medium',
          summary: 'This is sample data. Start the backend server to see real reports.'
        }
      ];
      setReports(mockReports);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to determine priority from water report data
  const getPriorityFromWaterReport = (report) => {
    const params = report.testingParameters;
    if (!params) return 'low';
    
    // Check for concerning values
    const concerningFactors = [];
    if (params.pH < 6.5 || params.pH > 8.5) concerningFactors.push('pH');
    if (params.turbidity > 5) concerningFactors.push('turbidity');
    if (params.temperature > 35) concerningFactors.push('temperature');
    if (params.totalDissolvedSolids > 1000) concerningFactors.push('TDS');
    
    if (concerningFactors.length >= 2) return 'high';
    if (concerningFactors.length === 1) return 'medium';
    return 'low';
  };
  
  // Helper function to generate summary from water report
  const generateWaterReportSummary = (report) => {
    const params = report.testingParameters;
    if (!params) return 'Water quality parameters not available';
    
    const issues = [];
    if (params.pH < 6.5 || params.pH > 8.5) issues.push(`pH: ${params.pH}`);
    if (params.turbidity > 5) issues.push(`High turbidity: ${params.turbidity} NTU`);
    if (params.temperature > 35) issues.push(`High temperature: ${params.temperature}°C`);
    if (params.totalDissolvedSolids > 1000) issues.push(`High TDS: ${params.totalDissolvedSolids} mg/L`);
    
    if (issues.length > 0) {
      return `Issues detected: ${issues.join(', ')}`;
    }
    
    return `pH: ${params.pH}, Turbidity: ${params.turbidity} NTU, Temp: ${params.temperature}°C, TDS: ${params.totalDissolvedSolids} mg/L`;
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