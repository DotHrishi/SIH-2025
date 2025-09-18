import React from 'react';
import { Popup } from 'react-leaflet';
import { formatCoordinates, getRecentCases, getSeverityColor } from '../../utils/geoUtils';

/**
 * CaseClusterPopup component for displaying detailed information about patient case clusters
 * Shows case count, severity breakdown, and recent cases
 */
const CaseClusterPopup = ({ cluster, onClose }) => {
  if (!cluster) return null;

  const { 
    caseCount, 
    severity, 
    severityBreakdown, 
    cases, 
    center 
  } = cluster;

  const recentCases = getRecentCases(cases, 3);
  const severityColor = getSeverityColor(severity);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get severity badge styling
  const getSeverityBadge = (severityLevel) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    const severityClasses = {
      mild: "bg-green-100 text-green-800",
      moderate: "bg-yellow-100 text-yellow-800", 
      severe: "bg-red-100 text-red-800"
    };
    
    return `${baseClasses} ${severityClasses[severityLevel] || severityClasses.mild}`;
  };

  return (
    <Popup
      closeButton={true}
      closeOnClick={false}
      onClose={onClose}
      maxWidth={350}
      className="case-cluster-popup"
    >
      <div className="p-4 min-w-[300px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Patient Case Cluster
          </h3>
          <div 
            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: severityColor }}
            title={`${severity} severity cluster`}
          />
        </div>

        {/* Cluster Statistics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{caseCount}</div>
            <div className="text-sm text-gray-600">Total Cases</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className={getSeverityBadge(severity)}>
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Overall Severity</div>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Severity Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(severityBreakdown).map(([level, count]) => (
              count > 0 && (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getSeverityColor(level) }}
                    />
                    <span className="text-sm text-gray-600 capitalize">{level}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{count}</span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Recent Cases */}
        {recentCases.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Recent Cases ({recentCases.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentCases.map((case_, index) => (
                <div key={case_._id || index} className="bg-gray-50 p-2 rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">
                      {case_.caseId || `Case ${index + 1}`}
                    </span>
                    <span className={getSeverityBadge(case_.severity || 'mild')}>
                      {(case_.severity || 'mild').charAt(0).toUpperCase() + (case_.severity || 'mild').slice(1)}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    <div>Age: {case_.patientInfo?.ageGroup || 'N/A'}</div>
                    <div>Date: {formatDate(case_.reportDate || case_.createdAt)}</div>
                    {case_.diseaseIdentification?.suspectedDisease && (
                      <div>Disease: {case_.diseaseIdentification.suspectedDisease}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Information */}
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Location</h4>
          <div className="text-xs text-gray-600">
            <div>Coordinates: {formatCoordinates([center.lng, center.lat])}</div>
            {cases[0]?.patientInfo?.location && (
              <div>Area: {cases[0].patientInfo.location}</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-3 border-t">
          <button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
            onClick={() => {
              // Handle view details action
              console.log('View cluster details:', cluster);
            }}
          >
            View Details
          </button>
          <button 
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs py-2 px-3 rounded transition-colors"
            onClick={() => {
              // Handle create alert action
              console.log('Create alert for cluster:', cluster);
            }}
          >
            Create Alert
          </button>
        </div>
      </div>
    </Popup>
  );
};

export default CaseClusterPopup;