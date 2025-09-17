const mongoose = require('mongoose');

// Schema for location data with coordinates
const locationSchema = new mongoose.Schema({
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 2 && 
               v[0] >= -180 && v[0] <= 180 && // longitude
               v[1] >= -90 && v[1] <= 90;     // latitude
      },
      message: 'Coordinates must be [longitude, latitude] with valid ranges'
    }
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  }
});

// Schema for lead worker information
const leadWorkerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\+?[\d\s\-\(\)]{10,15}$/.test(v);
      },
      message: 'Please enter a valid contact number'
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  lastContact: {
    type: Date,
    default: Date.now
  }
});

// Schema for coverage area information
const coverageSchema = new mongoose.Schema({
  population: {
    type: Number,
    required: true,
    min: 0
  },
  area: {
    type: String,
    required: true,
    trim: true
  },
  villages: [{
    type: String,
    trim: true
  }]
});

// Schema for resource tracking
const resourceSchema = new mongoose.Schema({
  resourceType: {
    type: String,
    required: true,
    trim: true,
    enum: ['medical_supplies', 'testing_kits', 'vehicles', 'communication_equipment', 'other']
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Main HealthCenter schema
const healthCenterSchema = new mongoose.Schema({
  centerId: {
    type: String,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^(ASHA|NGO)-\d{3,}$/.test(v);
      },
      message: 'Center ID must follow format: ASHA-001 or NGO-001'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    required: true,
    enum: ['ASHA', 'NGO'],
    uppercase: true
  },
  location: {
    type: locationSchema,
    required: true
  },
  leadWorker: {
    type: leadWorkerSchema,
    required: true
  },
  coverage: {
    type: coverageSchema,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  resources: [resourceSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
healthCenterSchema.index({ 'location.coordinates': '2dsphere' });

// Create compound indexes for efficient queries
healthCenterSchema.index({ type: 1, status: 1 });
healthCenterSchema.index({ 'location.district': 1, type: 1 });

// Virtual for formatted center ID display
healthCenterSchema.virtual('displayId').get(function() {
  return this.centerId;
});

// Virtual for full address
healthCenterSchema.virtual('fullAddress').get(function() {
  return `${this.location.address}, ${this.location.district}, ${this.location.state}`;
});

// Static method to find centers by location (within radius)
healthCenterSchema.statics.findByLocation = function(longitude, latitude, radiusInKm = 10) {
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

// Static method to find centers by district
healthCenterSchema.statics.findByDistrict = function(district) {
  return this.find({
    'location.district': new RegExp(district, 'i'),
    status: 'active'
  });
};

// Static method to find centers by type
healthCenterSchema.statics.findByType = function(type) {
  return this.find({
    type: type.toUpperCase(),
    status: 'active'
  });
};

// Instance method to update last contact
healthCenterSchema.methods.updateLastContact = function() {
  this.leadWorker.lastContact = new Date();
  return this.save();
};

// Instance method to add resource
healthCenterSchema.methods.addResource = function(resourceType, quantity) {
  const existingResource = this.resources.find(r => r.resourceType === resourceType);
  
  if (existingResource) {
    existingResource.quantity += quantity;
    existingResource.lastUpdated = new Date();
  } else {
    this.resources.push({
      resourceType,
      quantity,
      lastUpdated: new Date()
    });
  }
  
  return this.save();
};

// Instance method to update resource quantity
healthCenterSchema.methods.updateResource = function(resourceType, quantity) {
  const resource = this.resources.find(r => r.resourceType === resourceType);
  
  if (resource) {
    resource.quantity = quantity;
    resource.lastUpdated = new Date();
    return this.save();
  } else {
    throw new Error(`Resource type ${resourceType} not found`);
  }
};

// Pre-save middleware to generate centerId if not provided
healthCenterSchema.pre('save', async function(next) {
  if (this.isNew && !this.centerId) {
    const count = await this.constructor.countDocuments({ type: this.type });
    const nextNumber = (count + 1).toString().padStart(3, '0');
    this.centerId = `${this.type}-${nextNumber}`;
  }
  next();
});

// Pre-save middleware to validate coordinates format
healthCenterSchema.pre('save', function(next) {
  if (this.location && this.location.coordinates) {
    // Ensure coordinates are stored as [longitude, latitude]
    const [lng, lat] = this.location.coordinates;
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      return next(new Error('Coordinates must be numbers'));
    }
  }
  next();
});

const HealthCenter = mongoose.model('HealthCenter', healthCenterSchema);

module.exports = HealthCenter;