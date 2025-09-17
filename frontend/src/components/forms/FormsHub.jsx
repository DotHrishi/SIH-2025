import { useState } from 'react';
import FormSelection from './FormSelection';
import WaterQualityForm from '../reports/WaterQualityForm';
import PatientReportForm from '../reports/PatientReportForm';

const FormsHub = () => {
  const [currentView, setCurrentView] = useState('selection'); // 'selection', 'water', 'patient', 'success'
  const [submittedReport, setSubmittedReport] = useState(null);

  const handleFormSelection = (formType) => {
    setCurrentView(formType);
  };

  const handleSubmitSuccess = (reportData) => {
    setSubmittedReport(reportData);
    setCurrentView('success');
  };

  const handleBackToSelection = () => {
    setCurrentView('selection');
    setSubmittedReport(null);
  };

  const handleNewForm = () => {
    setCurrentView('selection');
    setSubmittedReport(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'water':
        return (
          <WaterQualityForm
            onSubmitSuccess={handleSubmitSuccess}
            onCancel={handleBackToSelection}
          />
        );
      
      case 'patient':
        return (
          <PatientReportForm
            onSubmitSuccess={handleSubmitSuccess}
            onCancel={handleBackToSelection}
          />
        );
      
      case 'success':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <span className="text-2xl">✅</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Form Submitted Successfully
                </h2>
                <p className="text-gray-600">
                  Your form has been submitted and will be reviewed by the appropriate team.
                </p>
              </div>

              {submittedReport && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-gray-800 mb-2">Submission Details:</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    {submittedReport.reportId && (
                      <p><span className="font-medium">Report ID:</span> {submittedReport.reportId}</p>
                    )}
                    {submittedReport.caseId && (
                      <p><span className="font-medium">Case ID:</span> {submittedReport.caseId}</p>
                    )}
                    <p><span className="font-medium">Submitted:</span> {new Date().toLocaleString()}</p>
                    <p><span className="font-medium">Status:</span> Pending Review</p>
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleNewForm}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Submit Another Form
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <FormSelection onSelectForm={handleFormSelection} />
        );
    }
  };

  return (
    <div className="space-y-6">
      {currentView === 'selection' && (
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Forms</h1>
          <p className="text-gray-600 mb-8">
            Choose the type of form you want to submit to the surveillance system
          </p>
        </div>
      )}
      
      {renderCurrentView()}
    </div>
  );
};

export default FormsHub;