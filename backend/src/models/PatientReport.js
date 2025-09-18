const mongoose = require('mongoose');

// Schema for patient information
const patientInfoSchema = new mongoose.Schema({
  age: {
    type: Number,
    required: [true, 'Patient age is required'],
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age seems unrealistic']
  },
  ageGroup: {
    type: String,
    required: [true, 'Age group is required'],
    enum: {
      values: ['0-5', '5-15', '15-25', '25-35', '35-45', '45+'],
      message: 'Age group must be one of: 0-5, 5-15, 15-25, 25-35, 35-45, 45+'
    }
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['male', 'female', 'other', 'prefer_not_to_say'],
      message: 'Gender must be one of: male, female, other, prefer_not_to_say'
    }
  },
  location: {
    type: String,
    required: [true, 'Patient location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: false,
    validate: {
      validator: function(coords) {
        return !coords || (coords.length === 2 && 
               coords[0] >= -180 && coords[0] <= 180 && 
               coords[1] >= -90 && coords[1] <= 90);
      },
      message: 'Coordinates must be [longitude, latitude] with valid ranges'
    }
  },
  contactNumber: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: function(phone) {
        return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please provide a valid contact number'
    }
  }
}, { _id: false });

// Schema for suspected water source information
const suspectedWaterSourceSchema = new mongoose.Schema({
  source: {
    type: String,
    required: [true, 'Water source is required'],
    trim: true,
    enum: {
      values: ['well', 'borehole', 'river', 'lake', 'pond', 'spring', 'tap', 'bottled', 'other'],
      message: 'Water source must be one of: well, borehole, river, lake, pond, spring, tap, bottled, other'
    }
  },
  location: {
    type: String,
    required: [true, 'Water source location is required'],
    trim: true,
    maxlength: [200, 'Water source location cannot exceed 200 characters']
  },
  relatedWaterReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WaterReport',
    required: false
  },
  sourceDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Source description cannot exceed 500 characters']
  }
}, { _id: false });

// Schema for disease identification
const diseaseIdentificationSchema = new mongoose.Schema({
  suspectedDisease: {
    type: String,
    required: [true, 'Suspected disease is required'],
    trim: true,
    enum: {
      values: [
        'cholera', 'typhoid', 'hepatitis_a', 'hepatitis_e', 'dysentery', 
        'gastroenteritis', 'diarrheal_disease', 'giardiasis', 'cryptosporidiosis',
        'rotavirus', 'norovirus', 'other'
      ],
      message: 'Suspected disease must be from the predefined list'
    }
  },
  confirmationStatus: {
    type: String,
    required: true,
    enum: {
      values: ['suspected', 'confirmed', 'ruled_out', 'pending_lab_results'],
      message: 'Confirmation status must be one of: suspected, confirmed, ruled_out, pending_lab_results'
    },
    default: 'suspected'
  },
  labTestsOrdered: {
    type: [String],
    default: [],
    validate: {
      validator: function(tests) {
        const validTests = [
          'stool_culture', 'blood_culture', 'rapid_diagnostic_test',
          'pcr_test', 'serology', 'microscopy', 'other'
        ];
        return tests.every(test => validTests.includes(test));
      },
      message: 'Invalid lab test type specified'
    }
  },
  labResults: {
    type: String,
    trim: true,
    maxlength: [1000, 'Lab results cannot exceed 1000 characters']
  }
}, { _id: false });

// Main PatientReport schema
const patientReportSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      // Generate unique case ID (HC + timestamp + random)
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `HC${timestamp}${random}`;
    }
  },
  submittedBy: {
    type: String,
    required: [true, 'Submitter name is required'],
    trim: true,
    maxlength: [100, 'Submitter name cannot exceed 100 characters']
  },
  submitterRole: {
    type: String,
    required: false,
    trim: true,
    enum: {
      values: ['doctor', 'nurse', 'asha_worker', 'health_officer', 'field_worker', 'other'],
      message: 'Submitter role must be from the predefined list'
    }
  },
  patientInfo: {
    type: patientInfoSchema,
    required: [true, 'Patient information is required']
  },
  symptoms: {
    type: [String],
    required: [true, 'At least one symptom must be reported'],
    validate: {
      validator: function(symptoms) {
        const validSymptoms = [
          'diarrhea', 'vomiting', 'nausea', 'abdominal_pain', 'fever',
          'dehydration', 'bloody_stool', 'watery_stool', 'muscle_cramps',
          'headache', 'fatigue', 'loss_of_appetite', 'jaundice', 'other'
        ];
        return symptoms.length > 0 && symptoms.every(symptom => validSymptoms.includes(symptom));
      },
      message: 'Invalid symptom specified or no symptoms provided'
    }
  },
  severity: {
    type: String,
    required: [true, 'Severity assessment is required'],
    enum: {
      values: ['mild', 'moderate', 'severe', 'critical'],
      message: 'Severity must be one of: mild, moderate, severe, critical'
    }
  },
  suspectedWaterSource: {
    type: suspectedWaterSourceSchema,
    required: [true, 'Suspected water source information is required']
  },
  diseaseIdentification: {
    type: diseaseIdentificationSchema,
    required: [true, 'Disease identification information is required']
  },
  emergencyAlert: {
    type: Boolean,
    required: true,
    default: false
  },
  reportDate: {
    type: Date,
    required: [true, 'Report date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Report date cannot be in the future'
    }
  },
  onsetDate: {
    type: Date,
    required: false,
    validate: {
      validator: function(date) {
        return !date || date <= new Date();
      },
      message: 'Symptom onset date cannot be in the future'
    }
  },
  hospitalAdmission: {
    required: {
      type: Boolean,
      default: false
    },
    hospitalName: {
      type: String,
      trim: true,
      maxlength: [200, 'Hospital name cannot exceed 200 characters']
    },
    admissionDate: {
      type: Date
    }
  },
  outcome: {
    type: String,
    enum: {
      values: ['recovering', 'recovered', 'hospitalized', 'deceased', 'lost_to_followup', 'unknown'],
      message: 'Outcome must be from the predefined list'
    },
    default: 'unknown'
  },
  followUpRequired: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    trim: true
  },
  reviewedBy: {
    type: String,
    trim: true,
    maxlength: [100, 'Reviewer name cannot exceed 100 characters']
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for efficient querying (caseId already has unique index)
patientReportSchema.index({ 'patientInfo.location': 1, createdAt: -1 });
patientReportSchema.index({ 'patientInfo.coordinates': '2dsphere' }); // Geospatial index for clustering
patientReportSchema.index({ severity: 1, createdAt: -1 });
patientReportSchema.index({ 'diseaseIdentification.suspectedDisease': 1, createdAt: -1 });
patientReportSchema.index({ emergencyAlert: 1, createdAt: -1 });
patientReportSchema.index({ reportDate: -1 });

// Virtual for formatted case ID
patientReportSchema.virtual('formattedCaseId').get(function() {
  return `HC-${this.caseId.slice(2)}`;
});

// Virtual for risk assessment
patientReportSchema.virtual('riskAssessment').get(function() {
  let riskLevel = 'low';
  let riskFactors = [];
  
  // Assess risk based on severity
  if (this.severity === 'critical') {
    riskLevel = 'critical';
    riskFactors.push('Critical severity level');
  } else if (this.severity === 'severe') {
    riskLevel = 'high';
    riskFactors.push('Severe symptoms');
  } else if (this.severity === 'moderate') {
    riskLevel = 'medium';
  }
  
  // Check for high-risk diseases
  const highRiskDiseases = ['cholera', 'typhoid', 'hepatitis_a', 'hepatitis_e'];
  if (highRiskDiseases.includes(this.diseaseIdentification.suspectedDisease)) {
    riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    riskFactors.push('High-risk waterborne disease');
  }
  
  // Check for vulnerable age groups
  if (this.patientInfo.ageGroup === '0-5' || this.patientInfo.ageGroup === '45+') {
    riskFactors.push('Vulnerable age group');
    if (riskLevel === 'low') riskLevel = 'medium';
  }
  
  // Emergency alert automatically raises risk
  if (this.emergencyAlert) {
    riskLevel = 'critical';
    riskFactors.push('Emergency alert flagged');
  }
  
  return {
    level: riskLevel,
    factors: riskFactors
  };
});

// Virtual for days since onset
patientReportSchema.virtual('daysSinceOnset').get(function() {
  if (!this.onsetDate) return null;
  const diffTime = Math.abs(new Date() - this.onsetDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware for validation and auto-calculations
patientReportSchema.pre('save', function(next) {
  // Validate report date is not in the future
  if (this.reportDate > new Date()) {
    return next(new Error('Report date cannot be in the future'));
  }
  
  // Validate onset date is before report date
  if (this.onsetDate && this.onsetDate > this.reportDate) {
    return next(new Error('Symptom onset date cannot be after report date'));
  }
  
  // Auto-set age group based on age if not provided
  if (this.patientInfo.age && !this.patientInfo.ageGroup) {
    const age = this.patientInfo.age;
    if (age <= 5) this.patientInfo.ageGroup = '0-5';
    else if (age <= 15) this.patientInfo.ageGroup = '5-15';
    else if (age <= 25) this.patientInfo.ageGroup = '15-25';
    else if (age <= 35) this.patientInfo.ageGroup = '25-35';
    else if (age <= 45) this.patientInfo.ageGroup = '35-45';
    else this.patientInfo.ageGroup = '45+';
  }
  
  // Auto-set emergency alert for critical cases
  if (this.severity === 'critical' && !this.emergencyAlert) {
    this.emergencyAlert = true;
  }
  
  // Set reviewed timestamp if status changes to confirmed
  if (this.isModified('diseaseIdentification.confirmationStatus') && 
      this.diseaseIdentification.confirmationStatus === 'confirmed' && 
      !this.reviewedAt) {
    this.reviewedAt = new Date();
  }
  
  next();
});

// Static method to find cases by location
patientReportSchema.statics.findByLocation = function(location) {
  return this.find({ 
    'patientInfo.location': new RegExp(location, 'i') 
  });
};

// Static method to find cases by disease
patientReportSchema.statics.findByDisease = function(disease) {
  return this.find({ 
    'diseaseIdentification.suspectedDisease': disease 
  });
};

// Static method to find emergency cases
patientReportSchema.statics.findEmergencyCases = function() {
  return this.find({ 
    $or: [
      { emergencyAlert: true },
      { severity: 'critical' }
    ]
  }).sort({ createdAt: -1 });
};

// Static method to get disease statistics
patientReportSchema.statics.getDiseaseStats = function(filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$diseaseIdentification.suspectedDisease',
        count: { $sum: 1 },
        severeCases: {
          $sum: {
            $cond: [
              { $in: ['$severity', ['severe', 'critical']] },
              1,
              0
            ]
          }
        },
        emergencyAlerts: {
          $sum: {
            $cond: ['$emergencyAlert', 1, 0]
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get age group statistics
patientReportSchema.statics.getAgeGroupStats = function(filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$patientInfo.ageGroup',
        count: { $sum: 1 },
        avgSeverity: {
          $avg: {
            $switch: {
              branches: [
                { case: { $eq: ['$severity', 'mild'] }, then: 1 },
                { case: { $eq: ['$severity', 'moderate'] }, then: 2 },
                { case: { $eq: ['$severity', 'severe'] }, then: 3 },
                { case: { $eq: ['$severity', 'critical'] }, then: 4 }
              ],
              default: 1
            }
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Instance method to escalate to emergency
patientReportSchema.methods.escalateToEmergency = function(reason) {
  this.emergencyAlert = true;
  this.notes = this.notes ? `${this.notes}\n\nEscalated to emergency: ${reason}` : `Escalated to emergency: ${reason}`;
  return this.save();
};

// Instance method to update outcome
patientReportSchema.methods.updateOutcome = function(outcome, notes) {
  this.outcome = outcome;
  if (notes) {
    this.notes = this.notes ? `${this.notes}\n\nOutcome update: ${notes}` : `Outcome update: ${notes}`;
  }
  return this.save();
};

// Instance method to link water report
patientReportSchema.methods.linkWaterReport = function(waterReportId) {
  this.suspectedWaterSource.relatedWaterReport = waterReportId;
  return this.save();
};

const PatientReport = mongoose.model('PatientReport', patientReportSchema);

module.exports = PatientReport;