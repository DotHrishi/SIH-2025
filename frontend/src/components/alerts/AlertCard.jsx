import { useState } from 'react';
import { ALERT_SEVERITY, ALERT_STATUS } from '../../utils/constants';

const AlertCard = ({ alert, onStatusUpdate, onViewDetails, onAssignTeam, onEscalate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case ALERT_SEVERITY.CRITICAL:
        return 'bg-red-100 text-red-800 border-red-200';
      case ALERT_SEVERITY.HIGH:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case ALERT_SEVERITY.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ALERT_SEVERITY.LOW:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ALERT_STATUS.ACTIVE:
        return 'bg-red-100 text-red-800';
      case ALERT_STATUS.ACKNOWLEDGED:
        return 'bg-blue-100 text-blue-800';
      case ALERT_STATUS.INVESTIGATING:
        return 'bg-purple-100 text-purple-800';
      case ALERT_STATUS.RESOLVED:
        return 'bg-green-100 text-green-800';
      case ALERT_STATUS.FALSE_ALARM:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'water_quality':
        return '💧';
      case 'health_cluster':
        return '🏥';
      case 'emergency':
        return '🚨';
      case 'outbreak':
        return '⚠️';
      case 'system_maintenance':
        return '🔧';
      default:
        return '📋';
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setIsUpdating(true);
    try {
      await onStatusUpdate(alert._id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getActionButtons = () => {
    const buttons = [];

    if (alert.status === ALERT_STATUS.ACTIVE) {
      buttons.push(
        <button
          key="acknowledge"
          onClick={() => handleStatusUpdate(ALERT_STATUS.ACKNOWLEDGED)}
          disabled={isUpdating}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Acknowledge
        </button>
      );
    }

    if ([ALERT_STATUS.ACTIVE, ALERT_STATUS.ACKNOWLEDGED].includes(alert.status)) {
      buttons.push(
        <button
          key="investigate"
          onClick={() => handleStatusUpdate(ALERT_STATUS.INVESTIGATING)}
          disabled={isUpdating}
          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Investigate
        </button>
      );
    }

    if ([ALERT_STATUS.ACKNOWLEDGED, ALERT_STATUS.INVESTIGATING].includes(alert.status)) {
      buttons.push(
        <button
          key="resolve"
          onClick={() => handleStatusUpdate(ALERT_STATUS.RESOLVED)}
          disabled={isUpdating}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Resolve
        </button>
      );
    }

    if (alert.status !== ALERT_STATUS.RESOLVED && alert.status !== ALERT_STATUS.FALSE_ALARM) {
      buttons.push(
        <button
          key="escalate"
          onClick={() => onEscalate(alert._id)}
          disabled={isUpdating}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          Escalate
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getTypeIcon(alert.type)}</span>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{alert.title}</h3>
            <p className="text-sm text-gray-500">ID: {alert.alertId || alert._id}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
            {alert.severity?.toUpperCase()}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
            {alert.status?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-3 line-clamp-2">{alert.description}</p>

      {/* Location and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-sm text-gray-600">
        <div className="flex items-center">
          <span className="font-medium">Location:</span>
          <span className="ml-1">{alert.location?.district || alert.location?.address || 'Unknown'}</span>
        </div>
        <div className="flex items-center">
          <span className="font-medium">Created:</span>
          <span className="ml-1">{formatDate(alert.createdAt)}</span>
        </div>
      </div>

      {/* Parameters (if available) */}
      {alert.parameters && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
          <span className="font-medium">Parameter:</span> {alert.parameters.parameterName} - 
          <span className="ml-1">
            {alert.parameters.measuredValue} {alert.parameters.unit} 
            ({alert.parameters.comparisonType} threshold: {alert.parameters.threshold})
          </span>
        </div>
      )}

      {/* Assigned Team */}
      {alert.assignedTeam && alert.assignedTeam.length > 0 && (
        <div className="mb-3 text-sm">
          <span className="font-medium text-gray-700">Assigned to:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {alert.assignedTeam.map((member, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {member.memberName} ({member.role})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex space-x-2">
          {getActionButtons()}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onAssignTeam(alert._id)}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Assign Team
          </button>
          <button
            onClick={() => onViewDetails(alert._id)}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertCard;