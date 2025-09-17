import { useState } from 'react';
import ImageUpload from './ImageUpload';
import LocationPicker from '../maps/LocationPicker';
import api from '../../services/api';
import { API_ENDPOINTS, REPORT_STATUS, WATER_SOURCE_TYPES } from '../../utils/constants';

const WaterQualityForm = ({ onSubmitSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    submittedBy: '',
    location: {
      coordinates: [0, 0],
      address: '',
      district: '',
      waterSource: ''
    },
    testingParameters: {
      pH: '',
      turbidity: '',
      dissolvedOxygen: '',
      temperature: '',
      conductivity: '',
      totalDissolvedSolids: ''
    },
    sampleCollection: {
      collectionDate: '',
      collectionTime: '',
      collectorName: '',
      sampleId: ''
    }
  });
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});



  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[`${section}.${field}`] || errors[field]) {
      setErrors(prev => ({
        ...prev,
        [`${section}.${field}`]: '',
        [field]: ''
      }));
    }
  };

  const handleLocationChange = (location) => {
    if (location) {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: [location.lng, location.lat] // GeoJSON format: [longitude, latitude]
        }
      }));
      
      // Clear location-related errors
      setErrors(prev => ({
        ...prev,
        'location.coordinates': ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: [0, 0]
        }
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.submittedBy.trim()) {
      newErrors.submittedBy = 'Submitter name is required';
    }

    if (!formData.location.address.trim()) {
      newErrors['location.address'] = 'Location address is required';
    }

    if (!formData.location.district.trim()) {
      newErrors['location.district'] = 'District is required';
    }

    if (!formData.location.waterSource.trim()) {
      newErrors['location.waterSource'] = 'Water source is required';
    }

    // Validate coordinates
    if (!formData.location.coordinates || formData.location.coordinates[0] === 0 && formData.location.coordinates[1] === 0) {
      newErrors['location.coordinates'] = 'Please select a location on the map';
    }

    if (!formData.sampleCollection.collectionDate) {
      newErrors['sampleCollection.collectionDate'] = 'Collection date is required';
    }

    if (!formData.sampleCollection.collectionTime) {
      newErrors['sampleCollection.collectionTime'] = 'Collection time is required';
    }

    if (!formData.sampleCollection.collectorName.trim()) {
      newErrors['sampleCollection.collectorName'] = 'Collector name is required';
    }

    // Validate testing parameters (at least one should be provided)
    const testingParams = formData.testingParameters;
    const hasAnyTestingParam = Object.values(testingParams).some(value => value !== '');
    
    if (!hasAnyTestingParam) {
      newErrors.testingParameters = 'At least one testing parameter is required';
    }

    // Validate numeric ranges for testing parameters
    if (testingParams.pH && (testingParams.pH < 0 || testingParams.pH > 14)) {
      newErrors['testingParameters.pH'] = 'pH must be between 0 and 14';
    }

    if (testingParams.temperature && testingParams.temperature < -50) {
      newErrors['testingParameters.temperature'] = 'Temperature seems unrealistic';
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
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add form data
      submitData.append('data', JSON.stringify(formData));
      
      // Add images
      images.forEach((image) => {
        submitData.append('images', image);
      });

      const response = await api.post(API_ENDPOINTS.WATER_REPORTS, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        if (onSubmitSuccess) {
          onSubmitSuccess(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error submitting water quality report:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to submit report. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Water Quality Report</h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to Selection
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Submitter Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Submitter Information
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submitted By *
              </label>
              <input
                type="text"
                value={formData.submittedBy}
                onChange={(e) => handleInputChange(null, 'submittedBy', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.submittedBy ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your name"
              />
              {errors.submittedBy && (
                <p className="mt-1 text-sm text-red-600">{errors.submittedBy}</p>
              )}
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Location Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) => handleInputChange('location', 'address', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['location.address'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter location address"
                />
                {errors['location.address'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['location.address']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District *
                </label>
                <input
                  type="text"
                  value={formData.location.district}
                  onChange={(e) => handleInputChange('location', 'district', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['location.district'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter district"
                />
                {errors['location.district'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['location.district']}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Water Source Type *
              </label>
              <select
                value={formData.location.waterSource}
                onChange={(e) => handleInputChange('location', 'waterSource', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors['location.waterSource'] ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select water source type</option>
                {WATER_SOURCE_TYPES.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
              {errors['location.waterSource'] && (
                <p className="mt-1 text-sm text-red-600">{errors['location.waterSource']}</p>
              )}
            </div>

            {/* Location Picker */}
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precise Location *
              </label>
              <LocationPicker
                value={
                  formData.location.coordinates[0] !== 0 || formData.location.coordinates[1] !== 0
                    ? { lat: formData.location.coordinates[1], lng: formData.location.coordinates[0] }
                    : null
                }
                onChange={handleLocationChange}
                placeholder="Click on the map to select the exact location of the water source"
                className={errors['location.coordinates'] ? 'border-red-500' : ''}
              />
              {errors['location.coordinates'] && (
                <p className="mt-1 text-sm text-red-600">{errors['location.coordinates']}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Select the precise location where the water sample was collected for accurate mapping and analysis.
              </p>
            </div>
          </div>

          {/* Sample Collection Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Sample Collection Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Date *
                </label>
                <input
                  type="date"
                  value={formData.sampleCollection.collectionDate}
                  onChange={(e) => handleInputChange('sampleCollection', 'collectionDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['sampleCollection.collectionDate'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors['sampleCollection.collectionDate'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['sampleCollection.collectionDate']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Time *
                </label>
                <input
                  type="time"
                  value={formData.sampleCollection.collectionTime}
                  onChange={(e) => handleInputChange('sampleCollection', 'collectionTime', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['sampleCollection.collectionTime'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors['sampleCollection.collectionTime'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['sampleCollection.collectionTime']}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collector Name *
                </label>
                <input
                  type="text"
                  value={formData.sampleCollection.collectorName}
                  onChange={(e) => handleInputChange('sampleCollection', 'collectorName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['sampleCollection.collectorName'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Name of person collecting sample"
                />
                {errors['sampleCollection.collectorName'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['sampleCollection.collectorName']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample ID
                </label>
                <input
                  type="text"
                  value={formData.sampleCollection.sampleId}
                  onChange={(e) => handleInputChange('sampleCollection', 'sampleId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional sample identifier"
                />
              </div>
            </div>
          </div>

          {/* Testing Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Testing Parameters
            </h3>
            {errors.testingParameters && (
              <p className="text-sm text-red-600">{errors.testingParameters}</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  pH Level (0-14)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  value={formData.testingParameters.pH}
                  onChange={(e) => handleInputChange('testingParameters', 'pH', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['testingParameters.pH'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 7.2"
                />
                {errors['testingParameters.pH'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['testingParameters.pH']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Turbidity (NTU)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.testingParameters.turbidity}
                  onChange={(e) => handleInputChange('testingParameters', 'turbidity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dissolved Oxygen (mg/L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.testingParameters.dissolvedOxygen}
                  onChange={(e) => handleInputChange('testingParameters', 'dissolvedOxygen', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 8.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.testingParameters.temperature}
                  onChange={(e) => handleInputChange('testingParameters', 'temperature', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['testingParameters.temperature'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 25.0"
                />
                {errors['testingParameters.temperature'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['testingParameters.temperature']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conductivity (μS/cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.testingParameters.conductivity}
                  onChange={(e) => handleInputChange('testingParameters', 'conductivity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Dissolved Solids (mg/L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.testingParameters.totalDissolvedSolids}
                  onChange={(e) => handleInputChange('testingParameters', 'totalDissolvedSolids', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 300"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Water Source Images
            </h3>
            <p className="text-sm text-gray-600">
              Upload images of the water source, testing equipment, or any relevant visual documentation.
            </p>
            <ImageUpload
              onImagesChange={setImages}
              maxImages={5}
              maxSizePerImage={5 * 1024 * 1024} // 5MB
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-red-800">{errors.submit}</span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WaterQualityForm;