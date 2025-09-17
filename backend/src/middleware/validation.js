const validateWaterReport = (req, res, next) => {
  const { location, testingParameters, sampleCollection } = req.body;
  
  const errors = [];
  
  // Validate location
  if (!location) {
    errors.push('Location is required');
  } else {
    if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      errors.push('Valid coordinates [longitude, latitude] are required');
    }
    if (!location.address) {
      errors.push('Address is required');
    }
    if (!location.waterSource) {
      errors.push('Water source is required');
    }
  }
  
  // Validate testing parameters
  if (!testingParameters) {
    errors.push('Testing parameters are required');
  } else {
    if (testingParameters.pH && (testingParameters.pH < 0 || testingParameters.pH > 14)) {
      errors.push('pH must be between 0 and 14');
    }
    if (testingParameters.turbidity && testingParameters.turbidity < 0) {
      errors.push('Turbidity must be non-negative');
    }
  }
  
  // Validate sample collection
  if (!sampleCollection) {
    errors.push('Sample collection information is required');
  } else {
    if (!sampleCollection.collectionDate) {
      errors.push('Collection date is required');
    }
    if (!sampleCollection.collectorName) {
      errors.push('Collector name is required');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
  }
  
  next();
};

const validatePatientReport = (req, res, next) => {
  const { patientInfo, symptoms, suspectedWaterSource } = req.body;
  
  const errors = [];
  
  // Validate patient info
  if (!patientInfo) {
    errors.push('Patient information is required');
  } else {
    if (!patientInfo.age || patientInfo.age < 0 || patientInfo.age > 150) {
      errors.push('Valid age is required');
    }
    if (!patientInfo.gender) {
      errors.push('Gender is required');
    }
    if (!patientInfo.location) {
      errors.push('Patient location is required');
    }
  }
  
  // Validate symptoms
  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    errors.push('At least one symptom is required');
  }
  
  // Validate suspected water source
  if (!suspectedWaterSource || !suspectedWaterSource.source) {
    errors.push('Suspected water source is required');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
  }
  
  next();
};

module.exports = {
  validateWaterReport,
  validatePatientReport
};