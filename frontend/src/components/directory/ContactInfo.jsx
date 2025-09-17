import { useState } from 'react';

const ContactInfo = ({ center, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    name: center.leadWorker?.name || '',
    designation: center.leadWorker?.designation || '',
    contactNumber: center.leadWorker?.contactNumber || '',
    email: center.leadWorker?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Invalid contact number format';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onUpdate(center._id, formData);
    } catch (error) {
      console.error('Error updating contact info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Update Contact Information</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter lead worker name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Designation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Designation
          </label>
          <input
            type="text"
            value={formData.designation}
            onChange={(e) => handleChange('designation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter designation"
          />
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Number *
          </label>
          <input
            type="tel"
            value={formData.contactNumber}
            onChange={(e) => handleChange('contactNumber', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              errors.contactNumber ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter contact number"
          />
          {errors.contactNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.contactNumber}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Current Contact Info */}
        <div className="bg-gray-50 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Information</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Name:</span> {center.leadWorker?.name || 'Not set'}</p>
            <p><span className="font-medium">Designation:</span> {center.leadWorker?.designation || 'Not set'}</p>
            <p><span className="font-medium">Contact:</span> {center.leadWorker?.contactNumber || 'Not set'}</p>
            <p><span className="font-medium">Email:</span> {center.leadWorker?.email || 'Not set'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Updating...' : 'Update Contact'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactInfo;