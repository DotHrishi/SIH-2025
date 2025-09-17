const mongoose = require('mongoose');

// Schema for location data with coordinates
const locationSchema = new mongoose.Schema({
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: [true, 'Location coordinates are required'],
    validate: {
      validator: function(coords) {
        return coords.length === 2 && 
               coords[0] >= -180 && coords[0] <= 180 && // longitude
               coords[1] >= -90 && coords[1] <= 90;     // latitude
      },
      message: 'Coordinates must be [longitude, latitude] with valid ranges'
    }
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
    maxlength: [100, 'District cannot exceed 100 characters']
  },
  waterSource: {
    type: String,
    required: [true, 'Water source is required'],
    trim: true,
    enum: {
      values: ['well', 'borehole', 'river', 'lake', 'pond', 'spring', 'tap', 'other'],
      message: 'Water source must be one of: well, borehole, river, lake, pond, spring, tap, other'
    }
  }
}, { _id: false });

// Schema for testing parameters
const testingParametersSchema = new mongoose.Schema({
  pH: {
    type: Number,
    required: [true, 'pH value is required'],
    min: [0, 'pH must be between 0 and 14'],
    max: [14, 'pH must be between 0 and 14']
  },
  turbidity: {
    type: Number,
    required: [true, 'Turbidity value is required'],
    min: [0, 'Turbidity cannot be negative'],
    max: [1000, 'Turbidity value seems too high']
  },
  dissolvedOxygen: {
    type: Number,
    required: [true, 'Dissolved oxygen value is required'],
    min: [0, 'Dissolved oxygen cannot be negative'],
    max: [20, 'Dissolved oxygen value seems too high']
  },
  temperature: {
    type: Number,
    required: [true, 'Temperature is required'],
    min: [-10, 'Temperature seems too low'],
    max: [60, 'Temperature seems too high']
  },
  conductivity: {
    type: Number,
    required: false,
    min: [0, 'Conductivity cannot be negative']
  },
  totalDissolvedSolids: {
    type: Number,
    required: false,
    min: [0, 'Total dissolved solids cannot be negative']
  }
}, { _id: false });

// Schema for sample collection information
const sampleCollectionSchema = new mongoose.Schema({
  collectionDate: {
    type: Date,
    required: [true, 'Collection date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Collection date cannot be in the future'
    }
  },
  collectionTime: {
    type: String,
    required: [true, 'Collection time is required'],
    validate: {
      validator: function(time) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'Collection time must be in HH:MM format'
    }
  },
  collectorName: {
    type: String,
    required: [true, 'Collector name is required'],
    trim: true,
    maxlength: [100, 'Collector name cannot exceed 100 characters']
  },
  sampleId: {
    type: String,
    required: [true, 'Sample ID is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Sample ID cannot exceed 50 characters']
  }
}, { _id: false });

// Schema for image references (GridFS integration)
const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required']
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'GridFS file ID is required']
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  fileSize: {
    type: Number,
    required: false
  },
  mimeType: {
    type: String,
    required: false,
    validate: {
      validator: function(mimeType) {
        return !mimeType || mimeType.startsWith('image/');
      },
      message: 'File must be an image'
    }
  }
}, { _id: false });

// Main WaterReport schema
const waterReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      // Generate unique report ID (WR + timestamp + random)
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `WR${timestamp}${random}`;
    }
  },
  submittedBy: {
    type: String,
    required: [true, 'Submitter name is required'],
    trim: true,
    maxlength: [100, 'Submitter name cannot exceed 100 characters']
  },
  location: {
    type: locationSchema,
    required: [true, 'Location information is required']
  },
  testingParameters: {
    type: testingParametersSchema,
    required: [true, 'Testing parameters are required']
  },
  sampleCollection: {
    type: sampleCollectionSchema,
    required: [true, 'Sample collection information is required']
  },
  images: {
    type: [imageSchema],
    default: [],
    validate: {
      validator: function(images) {
        return images.length <= 10; // Limit to 10 images per report
      },
      message: 'Cannot upload more than 10 images per report'
    }
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ['pending', 'reviewed', 'action_required', 'resolved'],
      message: 'Status must be one of: pending, reviewed, action_required, resolved'
    },
    default: 'pending'
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

// Create geospatial index for location-based queries
waterReportSchema.index({ 'location.coordinates': '2dsphere' });

// Create compound index for efficient filtering
waterReportSchema.index({ status: 1, createdAt: -1 });
waterReportSchema.index({ 'location.district': 1, createdAt: -1 });

// Virtual for formatted report ID
waterReportSchema.virtual('formattedReportId').get(function() {
  return `WR-${this.reportId.slice(2)}`;
});

// Virtual for water quality assessment
waterReportSchema.virtual('qualityAssessment').get(function() {
  const params = this.testingParameters;
  let issues = [];
  
  // Basic water quality checks
  if (params.pH < 6.5 || params.pH > 8.5) {
    issues.push('pH out of safe range');
  }
  if (params.turbidity > 5) {
    issues.push('High turbidity');
  }
  if (params.dissolvedOxygen < 5) {
    issues.push('Low dissolved oxygen');
  }
  
  return {
    status: issues.length === 0 ? 'acceptable' : 'concerning',
    issues: issues
  };
});

// Pre-save middleware to validate sample collection date
waterReportSchema.pre('save', function(next) {
  // Ensure collection date is not in the future
  if (this.sampleCollection.collectionDate > new Date()) {
    return next(new Error('Sample collection date cannot be in the future'));
  }
  
  // Set reviewed timestamp if status changes to reviewed
  if (this.isModified('status') && this.status === 'reviewed' && !this.reviewedAt) {
    this.reviewedAt = new Date();
  }
  
  next();
});

// Static method to find reports by location
waterReportSchema.statics.findByLocation = function(longitude, latitude, radiusInKm = 10) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    }
  });
};

// Static method to find reports by district
waterReportSchema.statics.findByDistrict = function(district) {
  return this.find({ 'location.district': new RegExp(district, 'i') });
};

// Static method to get quality statistics
waterReportSchema.statics.getQualityStats = function(filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        avgPH: { $avg: '$testingParameters.pH' },
        avgTurbidity: { $avg: '$testingParameters.turbidity' },
        avgDissolvedOxygen: { $avg: '$testingParameters.dissolvedOxygen' },
        avgTemperature: { $avg: '$testingParameters.temperature' }
      }
    }
  ]);
};

// Instance method to add image
waterReportSchema.methods.addImage = function(imageData) {
  if (this.images.length >= 10) {
    throw new Error('Cannot add more than 10 images per report');
  }
  this.images.push(imageData);
  return this.save();
};

// Instance method to remove image
waterReportSchema.methods.removeImage = function(fileId) {
  this.images = this.images.filter(img => !img.fileId.equals(fileId));
  return this.save();
};

const WaterReport = mongoose.model('WaterReport', waterReportSchema);

module.exports = WaterReport;