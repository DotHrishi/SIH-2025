import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/api';

const PatientReportDetails = ({ reportId, onClose, isModal = true }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (reportId) {
      fetchReportDetails();
    }
  }, [reportId]);

  const fetchReportDetails = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getPatientReportById(reportId);
      
      if (response.data.success) {
        setReport(response.data.data);
      } else {
        setError('Failed to load report details');
      }
    } catch (err) {
      console.error('Error fetching report details:', err);
      setError('Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      mild: 'text-green-600 bg-green-100 border-green-200',
      moderate: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      severe: 'text-red-600 bg-red-100 border-red-200',
      critical: 'text-red-800 bg-red-200 border-red-300'
    };
    return colors[severity] || colors.mild;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCoordinates = (coordinates) => {
    if (!coordinates || coordinates.length < 2) return 'N/A';
    return `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`;
  };

  if (loading) {
    const content = (
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );

    return isModal ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {content}
      </div>
    ) : content;
  }

  if (error) {
    const content = (
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Report</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );

    return isModal ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {content}
      </div>
    ) : content;
  }

  if (!report) {
    return null;
  }

  const content = (
    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Patient Report Details</h2>
            <p className="text-sm text-gray-600">Case ID: {report.caseId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Emergency Alert */}
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(report.severity)}`}>
              {report.severity?.charAt(0).toUpperCase() + report.severity?.slice(1)} Severity
            </span>
            {report.emergencyAlert && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white">
                🚨 Emergency Alert
              </span>
            )}
          </div>

          {/* Patient Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Age</label>
                <p className="text-gray-900">{report.patientInfo?.age || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Age Group</label>
                <p className="text-gray-900">{report.patientInfo?.ageGroup || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Gender</label>
                <p className="text-gray-900 capitalize">{report.patientInfo?.gender || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Contact Number</label>
                <p className="text-gray-900">{report.patientInfo?.contactNumber || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <p className="text-gray-900">{report.patientInfo?.location || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Coordinates</label>
                <p className="text-gray-900">{formatCoordinates(report.patientInfo?.coordinates)}</p>
              </div>
            </div>
          </div>

          {/* Health Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Health Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Symptoms</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {report.symptoms?.map((symptom, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {symptom.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  )) || <span className="text-gray-500">No symptoms recorded</span>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Suspected Disease</label>
                  <p className="text-gray-900 capitalize">
                    {report.diseaseIdentification?.suspectedDisease?.replace('_', ' ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Confirmation Status</label>
                  <p className="text-gray-900 capitalize">
                    {report.diseaseIdentification?.confirmationStatus?.replace('_', ' ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Onset Date</label>
                  <p className="text-gray-900">{formatDate(report.onsetDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Report Date</label>
                  <p className="text-gray-900">{formatDate(report.reportDate)}</p>
                </div>
              </div>

              {report.diseaseIdentification?.labTestsOrdered?.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Lab Tests Ordered</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {report.diseaseIdentification.labTestsOrdered.map((test, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                        {test.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {report.diseaseIdentification?.labResults && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Lab Results</label>
                  <p className="text-gray-900 bg-white p-3 rounded border">
                    {report.diseaseIdentification.labResults}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Water Source Information */}
          <div className="bg-cyan-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Suspected Water Source</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Water Source</label>
                <p className="text-gray-900 capitalize">
                  {report.suspectedWaterSource?.source?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Source Location</label>
                <p className="text-gray-900">{report.suspectedWaterSource?.location || 'N/A'}</p>
              </div>
              {report.suspectedWaterSource?.sourceDescription && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Source Description</label>
                  <p className="text-gray-900 bg-white p-3 rounded border">
                    {report.suspectedWaterSource.sourceDescription}
                  </p>
                </div>
              )}
              {report.suspectedWaterSource?.relatedWaterReport && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Related Water Report</label>
                  <p className="text-blue-600">
                    Report ID: {report.suspectedWaterSource.relatedWaterReport.reportId || 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Hospital Admission */}
          {report.hospitalAdmission?.required && (
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Hospital Admission</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Hospital Name</label>
                  <p className="text-gray-900">{report.hospitalAdmission?.hospitalName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Admission Date</label>
                  <p className="text-gray-900">{formatDate(report.hospitalAdmission?.admissionDate)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submission Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Submission Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Submitted By</label>
                <p className="text-gray-900">{report.submittedBy || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Submitter Role</label>
                <p className="text-gray-900 capitalize">
                  {report.submitterRole?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Submitted At</label>
                <p className="text-gray-900">{formatDate(report.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <p className="text-gray-900">{formatDate(report.updatedAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Outcome</label>
                <p className="text-gray-900 capitalize">
                  {report.outcome?.replace('_', ' ') || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Follow-up Required</label>
                <p className="text-gray-900">{report.followUpRequired ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          {report.notes && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Notes</h3>
              <p className="text-gray-900 bg-white p-3 rounded border whitespace-pre-wrap">
                {report.notes}
              </p>
            </div>
          )}

          {/* Review Information */}
          {report.reviewedBy && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Review Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Reviewed By</label>
                  <p className="text-gray-900">{report.reviewedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Reviewed At</label>
                  <p className="text-gray-900">{formatDate(report.reviewedAt)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Print Report
          </button>
        </div>
      </div>
  );

  return isModal ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {content}
    </div>
  ) : content;
};

export default PatientReportDetails;