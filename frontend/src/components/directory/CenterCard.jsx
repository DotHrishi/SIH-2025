import { useState } from 'react';
import { CENTER_STATUS } from '../../utils/constants';

const CenterCard = ({ center, onEdit, onUpdateContact, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: center.leadWorker?.name || '',
    designation: center.leadWorker?.designation || '',
    contactNumber: center.leadWorker?.contactNumber || '',
    email: center.leadWorker?.email || '',
  });

  const getStatusColor = (status) => {
    switch (status) {
      case CENTER_STATUS.ACTIVE:
        return 'bg-green-100 text-green-800';
      case CENTER_STATUS.INACTIVE:
        return 'bg-red-100 text-red-800';
      case CENTER_STATUS.MAINTENANCE:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleContactUpdate = async () => {
    try {
      await onUpdateContact(center._id, contactInfo);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating contact info:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{center.name}</h3>
            <p className="text-sm text-gray-600">{center.centerId}</p>
            <p className="text-sm text-gray-500">{center.location?.district}, {center.location?.state}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(center.status)}`}>
              {center.status}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              center.type === 'ASHA' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {center.type}
            </span>
          </div>
        </div>

        {/* Lead Worker Info */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Lead Worker</h4>
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Name"
                value={contactInfo.name}
                onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="text"
                placeholder="Designation"
                value={contactInfo.designation}
                onChange={(e) => setContactInfo({ ...contactInfo, designation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="tel"
                placeholder="Contact Number"
                value={contactInfo.contactNumber}
                onChange={(e) => setContactInfo({ ...contactInfo, contactNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="email"
                placeholder="Email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleContactUpdate}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <p><span className="font-medium">{center.leadWorker?.name || 'Not assigned'}</span></p>
              <p>{center.leadWorker?.designation || 'No designation'}</p>
              <p>📞 {center.leadWorker?.contactNumber || 'No contact'}</p>
              <p>✉️ {center.leadWorker?.email || 'No email'}</p>
              <p className="text-xs text-gray-500 mt-1">
                Last Contact: {formatDate(center.leadWorker?.lastContact)}
              </p>
            </div>
          )}
        </div>

        {/* Coverage Info */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Coverage</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Population:</span> {center.coverage?.population?.toLocaleString() || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Area:</span> {center.coverage?.area || 'N/A'}
            </div>
          </div>
          {center.coverage?.villages && center.coverage.villages.length > 0 && (
            <div className="mt-2">
              <span className="text-sm font-medium text-gray-700">Villages: </span>
              <span className="text-sm text-gray-600">
                {center.coverage.villages.slice(0, 3).join(', ')}
                {center.coverage.villages.length > 3 && ` +${center.coverage.villages.length - 3} more`}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Contact'}
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(center)}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
            >
              Edit Center
            </button>
            <button
              onClick={() => onDelete(center._id)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Details */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Location Details</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Address:</span> {center.location?.address || 'N/A'}</p>
                  <p><span className="font-medium">District:</span> {center.location?.district || 'N/A'}</p>
                  <p><span className="font-medium">State:</span> {center.location?.state || 'N/A'}</p>
                  {center.location?.coordinates && (
                    <p><span className="font-medium">Coordinates:</span> {center.location.coordinates.join(', ')}</p>
                  )}
                </div>
              </div>

              {/* Resources */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Resources</h5>
                {center.resources && center.resources.length > 0 ? (
                  <div className="space-y-1">
                    {center.resources.map((resource, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        <span className="font-medium">{resource.resourceType}:</span> {resource.quantity}
                        <span className="text-xs text-gray-500 ml-2">
                          (Updated: {formatDate(resource.lastUpdated)})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No resources recorded</p>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Created:</span> {formatDate(center.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Updated:</span> {formatDate(center.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CenterCard;