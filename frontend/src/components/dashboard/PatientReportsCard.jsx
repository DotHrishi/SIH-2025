import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/api';
import PatientReportDetails from '../reports/PatientReportDetails';

const PatientReportsCard = () => {
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);

  useEffect(() => {
    fetchRecentPatients();
  }, []);

  const fetchRecentPatients = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getPatientReports({
        page: 1,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (response.data.success) {
        setRecentPatients(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching recent patients:', err);
      setError('Failed to load patient reports');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      mild: 'text-green-600 bg-green-100',
      moderate: 'text-yellow-600 bg-yellow-100',
      severe: 'text-red-600 bg-red-100',
      critical: 'text-red-800 bg-red-200'
    };
    return colors[severity] || colors.mild;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Patient Reports</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Patient Reports</h2>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Patient Reports</h2>
        <button
          onClick={fetchRecentPatients}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      {recentPatients.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-8">
          No patient reports found
        </div>
      ) : (
        <div className="space-y-3">
          {recentPatients.map((patient) => (
            <div key={patient._id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {patient.caseId || 'Unknown Case'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(patient.severity)}`}>
                      {patient.severity?.charAt(0).toUpperCase() + patient.severity?.slice(1)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      Age: {patient.patientInfo?.age || 'N/A'} ({patient.patientInfo?.ageGroup || 'N/A'})
                    </div>
                    <div>
                      Disease: {patient.diseaseIdentification?.suspectedDisease?.replace('_', ' ') || 'Unknown'}
                    </div>
                    <div>
                      Location: {patient.patientInfo?.location || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-4">
                      <span>Reported: {formatDate(patient.createdAt)}</span>
                      {patient.emergencyAlert && (
                        <span className="text-red-600 font-medium">🚨 Emergency</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="text-xs text-gray-500">
                    By: {patient.submittedBy || 'Unknown'}
                  </div>
                  <button
                    onClick={() => setSelectedReportId(patient._id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patient Report Details Modal */}
      {selectedReportId && (
        <PatientReportDetails
          reportId={selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      )}
    </div>
  );
};

export default PatientReportsCard;