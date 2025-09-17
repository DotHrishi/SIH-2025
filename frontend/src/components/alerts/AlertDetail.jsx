import { useState, useEffect } from 'react';
import { alertsAPI } from '../../services/api';
import { ALERT_SEVERITY, ALERT_STATUS, ALERT_ACTIONS } from '../../utils/constants';

const AlertDetail = ({ alertId, onClose, onUpdate }) => {
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionForm, setActionForm] = useState({
    action: '',
    notes: '',
    performedBy: 'Current User', // This should come from auth context
  });
  const [teamForm, setTeamForm] = useState({
    members: [{ memberName: '', role: '', contact: '' }],
  });
  const [escalationForm, setEscalationForm] = useState({
    reason: '',
    performedBy: 'Current User',
  });
  const [activeTab, setActiveTab] = useState('details');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAlertDetails();
  }, [alertId]);

  const fetchAlertDetails = async () => {
    try {
      setLoading(true);
      const response = await alertsAPI.getAlertById(alertId);
      setAlert(response.data.data);
    } catch (err) {
      setError('Failed to fetch alert details');
      console.error('Error fetching alert:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setSubmitting(true);
      await alertsAPI.updateAlertStatus(alertId, {
        status: newStatus,
        performedBy: 'Current User',
        notes: `Status updated to ${newStatus}`,
      });
      await fetchAlertDetails();
      onUpdate?.();
    } catch (err) {
      setError('Failed to update status');
      console.error('Error updating status:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAction = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await alertsAPI.addAction(alertId, actionForm);
      setActionForm({ action: '', notes: '', performedBy: 'Current User' });
      await fetchAlertDetails();
      onUpdate?.();
    } catch (err) {
      setError('Failed to add action');
      console.error('Error adding action:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTeam = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const validMembers = teamForm.members.filter(m => m.memberName && m.role);
      await alertsAPI.assignTeam(alertId, {
        teamMembers: validMembers,
        assignedBy: 'Current User',
      });
      setTeamForm({ members: [{ memberName: '', role: '', contact: '' }] });
      await fetchAlertDetails();
      onUpdate?.();
    } catch (err) {
      setError('Failed to assign team');
      console.error('Error assigning team:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await alertsAPI.escalateAlert(alertId, escalationForm);
      setEscalationForm({ reason: '', performedBy: 'Current User' });
      await fetchAlertDetails();
      onUpdate?.();
    } catch (err) {
      setError('Failed to escalate alert');
      console.error('Error escalating alert:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const addTeamMember = () => {
    setTeamForm({
      ...teamForm,
      members: [...teamForm.members, { memberName: '', role: '', contact: '' }],
    });
  };

  const removeTeamMember = (index) => {
    setTeamForm({
      ...teamForm,
      members: teamForm.members.filter((_, i) => i !== index),
    });
  };

  const updateTeamMember = (index, field, value) => {
    const updatedMembers = [...teamForm.members];
    updatedMembers[index][field] = value;
    setTeamForm({ ...teamForm, members: updatedMembers });
  };

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

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading alert details...</p>
        </div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-700 mb-4">{error || 'Alert not found'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">{alert.title}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(alert.severity)}`}>
              {alert.severity?.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['details', 'actions', 'team', 'escalate'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alert ID</label>
                  <p className="mt-1 text-sm text-gray-900">{alert.alertId || alert._id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{alert.status?.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{alert.type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(alert.createdAt)}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{alert.description}</p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <div className="mt-1 text-sm text-gray-900">
                  <p>{alert.location?.address}</p>
                  <p>{alert.location?.district}</p>
                  {alert.location?.coordinates && (
                    <p>Coordinates: {alert.location.coordinates.join(', ')}</p>
                  )}
                </div>
              </div>

              {/* Parameters */}
              {alert.parameters && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parameters</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded">
                    <p><strong>Parameter:</strong> {alert.parameters.parameterName}</p>
                    <p><strong>Measured Value:</strong> {alert.parameters.measuredValue} {alert.parameters.unit}</p>
                    <p><strong>Threshold:</strong> {alert.parameters.threshold} {alert.parameters.unit}</p>
                    <p><strong>Comparison:</strong> {alert.parameters.comparisonType}</p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Actions</label>
                <div className="flex space-x-2">
                  {alert.status === ALERT_STATUS.ACTIVE && (
                    <button
                      onClick={() => handleStatusUpdate(ALERT_STATUS.ACKNOWLEDGED)}
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Acknowledge
                    </button>
                  )}
                  {[ALERT_STATUS.ACTIVE, ALERT_STATUS.ACKNOWLEDGED].includes(alert.status) && (
                    <button
                      onClick={() => handleStatusUpdate(ALERT_STATUS.INVESTIGATING)}
                      disabled={submitting}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      Start Investigation
                    </button>
                  )}
                  {[ALERT_STATUS.ACKNOWLEDGED, ALERT_STATUS.INVESTIGATING].includes(alert.status) && (
                    <button
                      onClick={() => handleStatusUpdate(ALERT_STATUS.RESOLVED)}
                      disabled={submitting}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-6">
              {/* Add Action Form */}
              <form onSubmit={handleAddAction} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Add Action</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action Type</label>
                  <select
                    value={actionForm.action}
                    onChange={(e) => setActionForm({ ...actionForm, action: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select action...</option>
                    <option value="investigated">Investigation</option>
                    <option value="contacted_team">Contacted Team</option>
                    <option value="field_visit">Field Visit</option>
                    <option value="sample_collected">Sample Collected</option>
                    <option value="notification_sent">Notification Sent</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={actionForm.notes}
                    onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Describe the action taken..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Action
                </button>
              </form>

              {/* Action History */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Action History</h3>
                <div className="space-y-3">
                  {alert.actions?.map((action, index) => (
                    <div key={index} className="border border-gray-200 rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {action.action?.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-600">{action.notes}</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{action.performedBy}</p>
                          <p>{formatDate(action.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Current Team */}
              {alert.assignedTeam?.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Current Team</h3>
                  <div className="space-y-2">
                    {alert.assignedTeam.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <p className="font-medium text-gray-900">{member.memberName}</p>
                          <p className="text-sm text-gray-600">{member.role}</p>
                          {member.contact && <p className="text-sm text-gray-600">{member.contact}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assign Team Form */}
              <form onSubmit={handleAssignTeam} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Assign Team</h3>
                {teamForm.members.map((member, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={member.memberName}
                        onChange={(e) => updateTeamMember(index, 'memberName', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact</label>
                      <input
                        type="text"
                        value={member.contact}
                        onChange={(e) => updateTeamMember(index, 'contact', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      {teamForm.members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTeamMember(index)}
                          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={addTeamMember}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Add Member
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Assign Team
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'escalate' && (
            <div className="space-y-6">
              <form onSubmit={handleEscalate} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Escalate Alert</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Level</label>
                  <p className="mt-1 text-sm text-gray-900">Level {alert.escalationLevel || 1}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Escalation Reason</label>
                  <textarea
                    value={escalationForm.reason}
                    onChange={(e) => setEscalationForm({ ...escalationForm, reason: e.target.value })}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Explain why this alert needs to be escalated..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Escalate Alert
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDetail;