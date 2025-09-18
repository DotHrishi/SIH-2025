import { useState } from 'react';
import { analyticsAPI } from '../../services/api';

const ExportModal = ({ isOpen, onClose, filters }) => {
  const [exportConfig, setExportConfig] = useState({
    type: 'cases', // cases, water-quality
    format: 'pdf', // csv, excel, pdf
    email: '',
    subject: '',
    message: '',
    includeCharts: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      const filterParams = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'locationBounds') filterParams[key] = value;
      });

      let response;
      
      if (exportConfig.email) {
        // Email export
        response = await analyticsAPI.emailReport({
          ...exportConfig,
          ...filterParams
        });
        
        setExportStatus({
          type: 'success',
          message: `Report sent successfully to ${exportConfig.email}`
        });
      } else {
        // Direct download
        switch (exportConfig.format) {
          case 'csv':
            response = await analyticsAPI.exportCSV({ type: exportConfig.type, ...filterParams });
            break;
          case 'excel':
            response = await analyticsAPI.exportExcel({ type: exportConfig.type, ...filterParams });
            break;
          case 'pdf':
            response = await analyticsAPI.exportPDF({ type: exportConfig.type, ...filterParams });
            break;
          default:
            throw new Error('Invalid export format');
        }

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${exportConfig.type}_report_${dateStr}.${exportConfig.format}`;
        
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setExportStatus({
          type: 'success',
          message: `${exportConfig.format.toUpperCase()} file downloaded successfully`
        });
      }

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setExportStatus(null);
      }, 2000);

    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus({
        type: 'error',
        message: error.response?.data?.error?.message || 'Export failed. Please try again.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const resetForm = () => {
    setExportConfig({
      type: 'cases',
      format: 'pdf',
      email: '',
      subject: '',
      message: '',
      includeCharts: false
    });
    setExportStatus(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {exportStatus && (
            <div className={`mb-4 p-3 rounded-md ${
              exportStatus.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {exportStatus.type === 'success' ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{exportStatus.message}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleExport(); }} className="space-y-4">
            {/* Data Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="cases"
                    checked={exportConfig.type === 'cases'}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, type: e.target.value }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Patient Cases</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="water-quality"
                    checked={exportConfig.type === 'water-quality'}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, type: e.target.value }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Water Quality Reports</span>
                </label>
              </div>
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <select
                value={exportConfig.format}
                onChange={(e) => setExportConfig(prev => ({ ...prev, format: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pdf">PDF Report</option>
                <option value="excel">Excel Spreadsheet</option>
                <option value="csv">CSV File</option>
              </select>
            </div>

            {/* Email Option */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (optional - leave blank to download directly)
              </label>
              <input
                type="email"
                value={exportConfig.email}
                onChange={(e) => setExportConfig(prev => ({ ...prev, email: e.target.value }))}
                placeholder="recipient@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email Subject (only if email is provided) */}
            {exportConfig.email && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={exportConfig.subject}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Water Health Surveillance Report"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Email Message (only if email is provided) */}
            {exportConfig.email && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={exportConfig.message}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Please find the requested analytics report attached."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Applied Filters Summary */}
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Applied Filters:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                {filters.startDate && <div>Start Date: {filters.startDate}</div>}
                {filters.endDate && <div>End Date: {filters.endDate}</div>}
                {filters.district && <div>District: {filters.district}</div>}
                {filters.severity && <div>Severity: {filters.severity}</div>}
                {filters.ageGroup && <div>Age Group: {filters.ageGroup}</div>}
                {filters.waterSource && <div>Water Source: {filters.waterSource}</div>}
                {!filters.startDate && !filters.endDate && !filters.district && !filters.severity && !filters.ageGroup && !filters.waterSource && (
                  <div className="text-gray-500">No filters applied</div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isExporting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isExporting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {exportConfig.email ? 'Sending...' : 'Exporting...'}
                  </div>
                ) : (
                  exportConfig.email ? 'Send Email' : 'Export'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;