import { useState } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS, CASE_SEVERITY, AGE_GROUPS, SYMPTOMS, WATERBORNE_DISEASES } from '../../utils/constants';

const PatientReportForm = ({ onSubmitSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    submittedBy: '',
    patientInfo: {
      age: '',
      ageGroup: '',
      gender: '',
      location: '',
      contactNumber: ''
    },
    symptoms: [],
    severity: '',
    suspectedWaterSource: {
      source: '',
      location: '',
      relatedWaterReport: ''
    },
    diseaseIdentification: {
      suspectedDisease: '',
      confirmationStatus: 'suspected'
    },
    emergencyAlert: false
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});



  const confirmationStatuses = [
    { value: 'suspected', label: 'Suspected' },
    { value: 'confirmed', label: 'Laboratory Confirmed' },
    { value: 'ruled_out', label: 'Ruled Out' }
  ];

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

  const handleSymptomChange = (symptom) => {
    const updatedSymptoms = formData.symptoms.includes(symptom)
      ? formData.symptoms.filter(s => s !== symptom)
      : [...formData.symptoms, symptom];
    
    setFormData(prev => ({
      ...prev,
      symptoms: updatedSymptoms
    }));

    // Clear symptoms error
    if (errors.symptoms) {
      setErrors(prev => ({
        ...prev,
        symptoms: ''
      }));
    }
  };

  const handleAgeChange = (age) => {
    // Auto-determine age group based on age
    let ageGroup = '';
    const ageNum = parseInt(age);
    
    if (ageNum >= 0 && ageNum <= 5) ageGroup = '0-5';
    else if (ageNum > 5 && ageNum <= 15) ageGroup = '5-15';
    else if (ageNum > 15 && ageNum <= 25) ageGroup = '15-25';
    else if (ageNum > 25 && ageNum <= 35) ageGroup = '25-35';
    else if (ageNum > 35 && ageNum <= 45) ageGroup = '35-45';
    else if (ageNum > 45) ageGroup = '45+';

    setFormData(prev => ({
      ...prev,
      patientInfo: {
        ...prev.patientInfo,
        age: age,
        ageGroup: ageGroup
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.submittedBy.trim()) {
      newErrors.submittedBy = 'Submitter name is required';
    }

    if (!formData.patientInfo.age) {
      newErrors['patientInfo.age'] = 'Patient age is required';
    } else if (formData.patientInfo.age < 0 || formData.patientInfo.age > 120) {
      newErrors['patientInfo.age'] = 'Please enter a valid age';
    }

    if (!formData.patientInfo.gender) {
      newErrors['patientInfo.gender'] = 'Gender is required';
    }

    if (!formData.patientInfo.location.trim()) {
      newErrors['patientInfo.location'] = 'Patient location is required';
    }

    if (formData.symptoms.length === 0) {
      newErrors.symptoms = 'At least one symptom must be selected';
    }

    if (!formData.severity) {
      newErrors.severity = 'Severity level is required';
    }

    if (!formData.suspectedWaterSource.source.trim()) {
      newErrors['suspectedWaterSource.source'] = 'Suspected water source is required';
    }

    if (!formData.diseaseIdentification.suspectedDisease) {
      newErrors['diseaseIdentification.suspectedDisease'] = 'Suspected disease is required';
    }

    // Validate contact number format if provided
    if (formData.patientInfo.contactNumber && 
        !/^\+?[\d\s\-()]{10,15}$/.test(formData.patientInfo.contactNumber)) {
      newErrors['patientInfo.contactNumber'] = 'Please enter a valid contact number';
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
      const response = await api.post(API_ENDPOINTS.PATIENT_REPORTS, formData);

      if (response.data.success) {
        if (onSubmitSuccess) {
          onSubmitSuccess(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error submitting patient report:', error);
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
          <h2 className="text-2xl font-bold text-gray-900">Patient Health Report</h2>
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

          {/* Patient Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Patient Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.patientInfo.age}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['patientInfo.age'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter age"
                />
                {errors['patientInfo.age'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['patientInfo.age']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Group
                </label>
                <input
                  type="text"
                  value={formData.patientInfo.ageGroup}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  placeholder="Auto-filled based on age"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={formData.patientInfo.gender}
                  onChange={(e) => handleInputChange('patientInfo', 'gender', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['patientInfo.gender'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors['patientInfo.gender'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['patientInfo.gender']}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Location *
                </label>
                <input
                  type="text"
                  value={formData.patientInfo.location}
                  onChange={(e) => handleInputChange('patientInfo', 'location', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['patientInfo.location'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter patient's location/address"
                />
                {errors['patientInfo.location'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['patientInfo.location']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.patientInfo.contactNumber}
                  onChange={(e) => handleInputChange('patientInfo', 'contactNumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['patientInfo.contactNumber'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Optional contact number"
                />
                {errors['patientInfo.contactNumber'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['patientInfo.contactNumber']}</p>
                )}
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Symptoms *
            </h3>
            {errors.symptoms && (
              <p className="text-sm text-red-600">{errors.symptoms}</p>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {SYMPTOMS.map((symptom) => (
                <label
                  key={symptom}
                  className={`
                    flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                    ${formData.symptoms.includes(symptom)
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={formData.symptoms.includes(symptom)}
                    onChange={() => handleSymptomChange(symptom)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{symptom}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Severity and Disease Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Clinical Assessment
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Level *
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => handleInputChange(null, 'severity', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.severity ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select severity</option>
                  <option value={CASE_SEVERITY.MILD}>Mild</option>
                  <option value={CASE_SEVERITY.MODERATE}>Moderate</option>
                  <option value={CASE_SEVERITY.SEVERE}>Severe</option>
                </select>
                {errors.severity && (
                  <p className="mt-1 text-sm text-red-600">{errors.severity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suspected Disease *
                </label>
                <select
                  value={formData.diseaseIdentification.suspectedDisease}
                  onChange={(e) => handleInputChange('diseaseIdentification', 'suspectedDisease', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['diseaseIdentification.suspectedDisease'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select suspected disease</option>
                  {WATERBORNE_DISEASES.map(disease => (
                    <option key={disease} value={disease}>{disease}</option>
                  ))}
                </select>
                {errors['diseaseIdentification.suspectedDisease'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['diseaseIdentification.suspectedDisease']}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmation Status
              </label>
              <select
                value={formData.diseaseIdentification.confirmationStatus}
                onChange={(e) => handleInputChange('diseaseIdentification', 'confirmationStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {confirmationStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Water Source Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Suspected Water Source
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water Source *
                </label>
                <input
                  type="text"
                  value={formData.suspectedWaterSource.source}
                  onChange={(e) => handleInputChange('suspectedWaterSource', 'source', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['suspectedWaterSource.source'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Local well, River, Pond"
                />
                {errors['suspectedWaterSource.source'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['suspectedWaterSource.source']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water Source Location
                </label>
                <input
                  type="text"
                  value={formData.suspectedWaterSource.location}
                  onChange={(e) => handleInputChange('suspectedWaterSource', 'location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Location of the water source"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Water Report ID
              </label>
              <input
                type="text"
                value={formData.suspectedWaterSource.relatedWaterReport}
                onChange={(e) => handleInputChange('suspectedWaterSource', 'relatedWaterReport', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional: Link to existing water quality report"
              />
            </div>
          </div>

          {/* Emergency Alert */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Emergency Classification
            </h3>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="emergencyAlert"
                checked={formData.emergencyAlert}
                onChange={(e) => handleInputChange(null, 'emergencyAlert', e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="emergencyAlert" className="text-sm font-medium text-gray-700">
                Mark as Emergency Alert
              </label>
            </div>
            <p className="text-sm text-gray-600">
              Check this box if the case requires immediate attention or indicates a potential outbreak.
            </p>
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

export default PatientReportForm;