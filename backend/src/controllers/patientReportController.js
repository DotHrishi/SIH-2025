const PatientReport = require('../models/PatientReport');
const WaterReport = require('../models/WaterReport');

/**
 * Adapter function to convert mobile app data format to backend model format
 */
const adaptMobileAppPatientData = (mobileData) => {
  // Handle mobile app format (simplified)
  if (mobileData.diseaseIdentification && mobileData.suspectedWaterSource) {
    // Already in backend format
    return mobileData;
  }

  // Convert mobile app format to backend format
  const adaptedData = {
    submittedBy: mobileData.patientInfo?.name || 'Mobile App User',
    submitterRole: 'field_worker',
    patientInfo: {
      age: parseInt(mobileData.patientInfo?.age) || 0,
      ageGroup: getAgeGroup(parseInt(mobileData.patientInfo?.age) || 0),
      gender: mobileData.patientInfo?.gender || 'other',
      location: mobileData.location?.address || mobileData.location?.district || 'Unknown Location',
      coordinates: mobileData.location?.coordinates || mobileData.patientInfo?.coordinates || null,
      contactNumber: mobileData.patientInfo?.contactNumber || ''
    },
    symptoms: Array.isArray(mobileData.healthInfo?.symptoms) ? 
      mobileData.healthInfo.symptoms.map(s => s.toLowerCase().replace(/\s+/g, '_')) : 
      ['other'],
    severity: mobileData.healthInfo?.severity || 'mild',
    suspectedWaterSource: {
      source: (mobileData.waterExposure?.waterSource || 'other').toLowerCase(),
      location: mobileData.location?.address || mobileData.location?.district || 'Unknown Location',
      sourceDescription: `Exposure date: ${mobileData.waterExposure?.exposureDate || 'Unknown'}, Others exposed: ${mobileData.waterExposure?.otherExposed || 0}`
    },
    diseaseIdentification: {
      suspectedDisease: mobileData.healthInfo?.suspectedDisease?.toLowerCase().replace(/\s+/g, '_') || 'other',
      confirmationStatus: 'suspected',
      labTestsOrdered: [],
      labResults: ''
    },
    reportDate: mobileData.reportDate ? new Date(mobileData.reportDate) : new Date(),
    onsetDate: mobileData.healthInfo?.onsetDate ? new Date(mobileData.healthInfo.onsetDate) : null,
    hospitalAdmission: {
      required: false,
      hospitalName: '',
      admissionDate: null
    },
    notes: mobileData.additionalNotes || '',
    emergencyAlert: mobileData.healthInfo?.severity === 'severe' || mobileData.healthInfo?.severity === 'critical'
  };

  return adaptedData;
};

/**
 * Helper function to determine age group
 */
const getAgeGroup = (age) => {
  if (age <= 5) return '0-5';
  if (age <= 15) return '5-15';
  if (age <= 25) return '15-25';
  if (age <= 35) return '25-35';
  if (age <= 45) return '35-45';
  return '45+';
};

/**
 * Create a new patient report
 * POST /api/reports/patient
 */
const createPatientReport = async (req, res) => {
  try {
    // Adapt mobile app data format if needed
    const adaptedData = adaptMobileAppPatientData(req.body);
    
    const {
      submittedBy,
      submitterRole,
      patientInfo,
      symptoms,
      severity,
      suspectedWaterSource,
      diseaseIdentification,
      reportDate,
      onsetDate,
      hospitalAdmission,
      notes,
      emergencyAlert
    } = adaptedData;

    // Validate required fields
    if (!submittedBy || !patientInfo || !symptoms || !severity || !suspectedWaterSource || !diseaseIdentification) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: {
            submittedBy: !submittedBy ? 'Submitter name is required' : null,
            patientInfo: !patientInfo ? 'Patient information is required' : null,
            symptoms: !symptoms ? 'Symptoms are required' : null,
            severity: !severity ? 'Severity assessment is required' : null,
            suspectedWaterSource: !suspectedWaterSource ? 'Suspected water source is required' : null,
            diseaseIdentification: !diseaseIdentification ? 'Disease identification is required' : null
          }
        }
      });
    }

    // Create new patient report
    const patientReport = new PatientReport({
      submittedBy,
      submitterRole,
      patientInfo,
      symptoms,
      severity,
      suspectedWaterSource,
      diseaseIdentification,
      reportDate: reportDate || new Date(),
      onsetDate,
      hospitalAdmission,
      notes: notes || '',
      emergencyAlert: emergencyAlert || false
    });

    // Auto-escalate critical cases
    if (severity === 'critical') {
      patientReport.emergencyAlert = true;
    }

    // Save the report
    const savedReport = await patientReport.save();

    res.status(201).json({
      success: true,
      data: savedReport,
      message: 'Patient report created successfully'
    });

  } catch (error) {
    console.error('Error creating patient report:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: Object.keys(error.errors).reduce((acc, key) => {
            acc[key] = error.errors[key].message;
            return acc;
          }, {})
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create patient report',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get patient reports with filtering and pagination
 * GET /api/reports/patient
 */
const getPatientReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      severity,
      disease,
      location,
      ageGroup,
      emergencyAlert,
      outcome,
      startDate,
      endDate,
      submittedBy,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (severity) {
      filter.severity = severity;
    }
    
    if (disease) {
      filter['diseaseIdentification.suspectedDisease'] = disease;
    }
    
    if (location) {
      filter['patientInfo.location'] = new RegExp(location, 'i');
    }
    
    if (ageGroup) {
      filter['patientInfo.ageGroup'] = ageGroup;
    }
    
    if (emergencyAlert !== undefined) {
      filter.emergencyAlert = emergencyAlert === 'true';
    }
    
    if (outcome) {
      filter.outcome = outcome;
    }
    
    if (submittedBy) {
      filter.submittedBy = new RegExp(submittedBy, 'i');
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.reportDate = {};
      if (startDate) {
        filter.reportDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.reportDate.$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [reports, totalCount] = await Promise.all([
      PatientReport.find(filter)
        .populate('suspectedWaterSource.relatedWaterReport', 'reportId location.address testingParameters')
        .sort(sortConfig)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      PatientReport.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: reports,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        severity,
        disease,
        location,
        ageGroup,
        emergencyAlert,
        outcome,
        startDate,
        endDate,
        submittedBy
      }
    });

  } catch (error) {
    console.error('Error fetching patient reports:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch patient reports',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get a single patient report by ID
 * GET /api/reports/patient/:id
 */
const getPatientReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await PatientReport.findById(id)
      .populate('suspectedWaterSource.relatedWaterReport', 'reportId location testingParameters status');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Patient report not found'
        }
      });
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error fetching patient report:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid report ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch patient report',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};/**
 
* Update a patient report
 * PUT /api/reports/patient/:id
 */
const updatePatientReport = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.caseId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const report = await PatientReport.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('suspectedWaterSource.relatedWaterReport', 'reportId location testingParameters');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Patient report not found'
        }
      });
    }

    res.json({
      success: true,
      data: report,
      message: 'Patient report updated successfully'
    });

  } catch (error) {
    console.error('Error updating patient report:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: Object.keys(error.errors).reduce((acc, key) => {
            acc[key] = error.errors[key].message;
            return acc;
          }, {})
        }
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid report ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update patient report',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Generate case ID (auto-generated, but endpoint for manual generation if needed)
 * POST /api/reports/patient/generate-case-id
 */
const generateCaseId = async (req, res) => {
  try {
    // Generate unique case ID
    let caseId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      caseId = `HC${timestamp}${random}`;
      
      // Check if this ID already exists
      const existingReport = await PatientReport.findOne({ caseId });
      if (!existingReport) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'ID_GENERATION_ERROR',
          message: 'Failed to generate unique case ID'
        }
      });
    }

    res.json({
      success: true,
      data: {
        caseId,
        formattedCaseId: `HC-${caseId.slice(2)}`
      }
    });

  } catch (error) {
    console.error('Error generating case ID:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate case ID',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Classify severity based on symptoms and patient info
 * POST /api/reports/patient/classify-severity
 */
const classifySeverity = async (req, res) => {
  try {
    const { symptoms, patientInfo, diseaseIdentification } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Symptoms array is required'
        }
      });
    }

    let severityScore = 0;
    let severityFactors = [];

    // Score based on symptoms
    const severitySymptoms = {
      'bloody_stool': 3,
      'severe_dehydration': 3,
      'high_fever': 2,
      'vomiting': 2,
      'abdominal_pain': 1,
      'diarrhea': 1,
      'nausea': 1,
      'muscle_cramps': 2,
      'jaundice': 3
    };

    symptoms.forEach(symptom => {
      if (severitySymptoms[symptom]) {
        severityScore += severitySymptoms[symptom];
        severityFactors.push(`Symptom: ${symptom.replace('_', ' ')}`);
      }
    });

    // Adjust for age group (vulnerable populations)
    if (patientInfo && patientInfo.ageGroup) {
      if (patientInfo.ageGroup === '0-5' || patientInfo.ageGroup === '45+') {
        severityScore += 1;
        severityFactors.push(`Vulnerable age group: ${patientInfo.ageGroup}`);
      }
    }

    // Adjust for high-risk diseases
    if (diseaseIdentification && diseaseIdentification.suspectedDisease) {
      const highRiskDiseases = ['cholera', 'typhoid', 'hepatitis_a', 'hepatitis_e'];
      if (highRiskDiseases.includes(diseaseIdentification.suspectedDisease)) {
        severityScore += 2;
        severityFactors.push(`High-risk disease: ${diseaseIdentification.suspectedDisease}`);
      }
    }

    // Determine severity level
    let severity;
    if (severityScore >= 8) {
      severity = 'critical';
    } else if (severityScore >= 5) {
      severity = 'severe';
    } else if (severityScore >= 3) {
      severity = 'moderate';
    } else {
      severity = 'mild';
    }

    res.json({
      success: true,
      data: {
        severity,
        severityScore,
        factors: severityFactors,
        recommendation: getSeverityRecommendation(severity)
      }
    });

  } catch (error) {
    console.error('Error classifying severity:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to classify severity',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get emergency cases
 * GET /api/reports/patient/emergency
 */
const getEmergencyCases = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const emergencyCases = await PatientReport.find({
      $or: [
        { emergencyAlert: true },
        { severity: 'critical' }
      ]
    })
    .populate('suspectedWaterSource.relatedWaterReport', 'reportId location')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

    res.json({
      success: true,
      data: emergencyCases,
      count: emergencyCases.length
    });

  } catch (error) {
    console.error('Error fetching emergency cases:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch emergency cases',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Link patient report to water report
 * PUT /api/reports/patient/:id/link-water-report
 */
const linkWaterReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { waterReportId } = req.body;

    if (!waterReportId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Water report ID is required'
        }
      });
    }

    // Verify water report exists
    const waterReport = await WaterReport.findById(waterReportId);
    if (!waterReport) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Water report not found'
        }
      });
    }

    // Update patient report
    const patientReport = await PatientReport.findByIdAndUpdate(
      id,
      { 'suspectedWaterSource.relatedWaterReport': waterReportId },
      { new: true, runValidators: true }
    ).populate('suspectedWaterSource.relatedWaterReport', 'reportId location testingParameters');

    if (!patientReport) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Patient report not found'
        }
      });
    }

    res.json({
      success: true,
      data: patientReport,
      message: 'Water report linked successfully'
    });

  } catch (error) {
    console.error('Error linking water report:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to link water report',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Delete a patient report
 * DELETE /api/reports/patient/:id
 */
const deletePatientReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await PatientReport.findByIdAndDelete(id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Patient report not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Patient report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting patient report:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid report ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete patient report',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

// Helper function for severity recommendations
function getSeverityRecommendation(severity) {
  const recommendations = {
    mild: 'Monitor symptoms, ensure adequate hydration, follow up in 24-48 hours',
    moderate: 'Provide oral rehydration therapy, monitor closely, consider medical evaluation',
    severe: 'Immediate medical attention required, IV fluids may be needed, hospitalization consideration',
    critical: 'Emergency medical intervention required, immediate hospitalization, intensive monitoring'
  };
  
  return recommendations[severity] || 'Consult healthcare provider for appropriate care';
}

module.exports = {
  createPatientReport,
  getPatientReports,
  getPatientReportById,
  updatePatientReport,
  generateCaseId,
  classifySeverity,
  getEmergencyCases,
  linkWaterReport,
  deletePatientReport
};