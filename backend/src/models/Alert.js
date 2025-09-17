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
  }
}, { _id: false });

// Schema for alert parameters (water quality thresholds, health metrics, etc.)
const parametersSchema = new mongoose.Schema({
  parameterName: {
    type: String,
    required: [true, 'Parameter name is required'],
    trim: true,
    enum: {
      values: [
        'pH', 'turbidity', 'dissolved_oxygen', 'temperature', 'conductivity',
        'total_dissolved_solids', 'case_count', 'mortality_rate', 'outbreak_threshold',
        'water_contamination_level', 'other'
      ],
      message: 'Parameter name must be from the predefined list'
    }
  },
  measuredValue: {
    type: Number,
    required: [true, 'Measured value is required']
  },
  threshold: {
    type: Number,
    required: [true, 'Threshold value is required']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters']
  },
  comparisonType: {
    type: String,
    required: true,
    enum: {
      values: ['above', 'below', 'equal', 'range'],
      message: 'Comparison type must be one of: above, below, equal, range'
    },
    default: 'above'
  }
}, { _id: false });

// Schema for source tracking (what triggered the alert)
const sourceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Source type is required'],
    enum: {
      values: ['water_report', 'patient_report', 'iot_sensor', 'manual', 'system_generated'],
      message: 'Source type must be one of: water_report, patient_report, iot_sensor, manual, system_generated'
    }
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() {
      return this.type === 'water_report' || this.type === 'patient_report';
    },
    refPath: 'source.sourceModel'
  },
  sourceModel: {
    type: String,
    required: function() {
      return this.sourceId != null;
    },
    enum: ['WaterReport', 'PatientReport']
  },
  sensorId: {
    type: String,
    required: function() {
      return this.type === 'iot_sensor';
    },
    trim: true,
    maxlength: [50, 'Sensor ID cannot exceed 50 characters']
  },
  triggeredBy: {
    type: String,
    required: function() {
      return this.type === 'manual';
    },
    trim: true,
    maxlength: [100, 'Triggered by name cannot exceed 100 characters']
  }
}, { _id: false });

// Schema for action history
const actionSchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'Action description is required'],
    trim: true,
    enum: {
      values: [
        'acknowledged', 'investigated', 'team_assigned', 'escalated',
        'resolved', 'false_alarm', 'monitoring', 'response_initiated',
        'resources_deployed', 'public_notification', 'other'
      ],
      message: 'Action must be from the predefined list'
    }
  },
  performedBy: {
    type: String,
    required: [true, 'Performer name is required'],
    trim: true,
    maxlength: [100, 'Performer name cannot exceed 100 characters']
  },
  performerRole: {
    type: String,
    required: false,
    trim: true,
    enum: {
      values: ['admin', 'supervisor', 'field_worker', 'health_officer', 'emergency_coordinator', 'other'],
      message: 'Performer role must be from the predefined list'
    }
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Action notes cannot exceed 500 characters']
  },
  attachments: [{
    filename: String,
    fileId: mongoose.Schema.Types.ObjectId,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }]
}, { _id: true });

// Main Alert schema
const alertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      // Generate unique alert ID (AL + timestamp + random)
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `AL${timestamp}${random}`;
    }
  },
  type: {
    type: String,
    required: [true, 'Alert type is required'],
    enum: {
      values: ['water_quality', 'health_cluster', 'emergency', 'outbreak', 'system_maintenance'],
      message: 'Alert type must be one of: water_quality, health_cluster, emergency, outbreak, system_maintenance'
    }
  },
  severity: {
    type: String,
    required: [true, 'Severity level is required'],
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: 'Severity must be one of: low, medium, high, critical'
    }
  },
  title: {
    type: String,
    required: [true, 'Alert title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Alert description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  location: {
    type: locationSchema,
    required: [true, 'Location information is required']
  },
  parameters: {
    type: parametersSchema,
    required: function() {
      return this.type === 'water_quality' || this.type === 'health_cluster';
    }
  },
  source: {
    type: sourceSchema,
    required: [true, 'Source information is required']
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ['active', 'acknowledged', 'investigating', 'resolved', 'false_alarm', 'expired'],
      message: 'Status must be one of: active, acknowledged, investigating, resolved, false_alarm, expired'
    },
    default: 'active'
  },
  priority: {
    type: Number,
    required: true,
    min: [1, 'Priority must be between 1 and 10'],
    max: [10, 'Priority must be between 1 and 10'],
    default: function() {
      // Auto-calculate priority based on severity
      const severityMap = { low: 3, medium: 5, high: 7, critical: 10 };
      return severityMap[this.severity] || 5;
    }
  },
  assignedTeam: [{
    memberName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Team member name cannot exceed 100 characters']
    },
    role: {
      type: String,
      required: true,
      enum: {
        values: ['lead', 'investigator', 'field_worker', 'coordinator', 'support'],
        message: 'Team member role must be from the predefined list'
      }
    },
    contactInfo: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact info cannot exceed 100 characters']
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  actions: {
    type: [actionSchema],
    default: []
  },
  estimatedResolutionTime: {
    type: Date,
    required: false
  },
  actualResolutionTime: {
    type: Date,
    required: false
  },
  resolvedAt: {
    type: Date,
    required: false
  },
  resolvedBy: {
    type: String,
    trim: true,
    maxlength: [100, 'Resolver name cannot exceed 100 characters']
  },
  resolutionNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Resolution notes cannot exceed 1000 characters']
  },
  escalationLevel: {
    type: Number,
    required: true,
    min: [0, 'Escalation level cannot be negative'],
    max: [5, 'Maximum escalation level is 5'],
    default: function() {
      // Auto-escalate critical alerts
      return this.severity === 'critical' ? 1 : 0;
    }
  },
  notificationsSent: [{
    recipient: {
      type: String,
      required: true,
      trim: true
    },
    method: {
      type: String,
      required: true,
      enum: ['email', 'sms', 'push', 'system']
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'sent'
    }
  }],
  relatedAlerts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
alertSchema.index({ 'location.coordinates': '2dsphere' });

// Create compound indexes for efficient filtering
alertSchema.index({ status: 1, severity: 1, createdAt: -1 });
alertSchema.index({ type: 1, createdAt: -1 });
alertSchema.index({ 'location.district': 1, status: 1 });
alertSchema.index({ priority: -1, createdAt: -1 });
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-expiry

// Virtual for formatted alert ID
alertSchema.virtual('formattedAlertId').get(function() {
  return `AL-${this.alertId.slice(2)}`;
});

// Virtual for time since creation
alertSchema.virtual('timeSinceCreation').get(function() {
  const diffTime = Math.abs(new Date() - this.createdAt);
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
});

// Virtual for response time (if resolved)
alertSchema.virtual('responseTime').get(function() {
  if (!this.resolvedAt) return null;
  
  const diffTime = Math.abs(this.resolvedAt - this.createdAt);
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  }
});

// Virtual for urgency score (combination of severity and time)
alertSchema.virtual('urgencyScore').get(function() {
  const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
  const severityScore = severityWeights[this.severity] || 1;
  
  // Time factor (more urgent as time passes)
  const createdAt = this.createdAt || new Date();
  const hoursOld = Math.floor((new Date() - createdAt) / (1000 * 60 * 60));
  const timeFactor = Math.min(hoursOld / 24, 2); // Max 2x multiplier after 48 hours
  
  return Math.round(severityScore * (1 + timeFactor) * 10) / 10;
});

// Post-init middleware to set defaults based on other fields
alertSchema.post('init', function() {
  // Auto-escalate critical alerts if not already set
  if (this.severity === 'critical' && this.escalationLevel === 0) {
    this.escalationLevel = 1;
  }
});

// Pre-save middleware for validation and auto-calculations
alertSchema.pre('save', function(next) {
  // Auto-set resolution timestamp when status changes to resolved
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  
  // Auto-calculate priority if not set
  if (!this.priority) {
    const severityMap = { low: 3, medium: 5, high: 7, critical: 10 };
    this.priority = severityMap[this.severity] || 5;
  }
  
  // Validate that resolved alerts have resolution information
  if (this.status === 'resolved' && !this.resolutionNotes) {
    return next(new Error('Resolution notes are required when marking alert as resolved'));
  }
  
  // Auto-escalate critical alerts
  if (this.severity === 'critical' && (this.escalationLevel === 0 || this.escalationLevel === undefined)) {
    this.escalationLevel = 1;
  }
  
  // Set expiry for low priority alerts (30 days)
  if (this.severity === 'low' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Static method to find alerts by location
alertSchema.statics.findByLocation = function(longitude, latitude, radiusInKm = 10) {
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

// Static method to find active alerts
alertSchema.statics.findActiveAlerts = function() {
  return this.find({ 
    status: { $in: ['active', 'acknowledged', 'investigating'] }
  }).sort({ priority: -1, createdAt: -1 });
};

// Static method to find alerts by severity
alertSchema.statics.findBySeverity = function(severity) {
  return this.find({ severity }).sort({ createdAt: -1 });
};

// Static method to get alert statistics
alertSchema.statics.getAlertStats = function(filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalAlerts: { $sum: 1 },
        activeAlerts: {
          $sum: {
            $cond: [
              { $in: ['$status', ['active', 'acknowledged', 'investigating']] },
              1,
              0
            ]
          }
        },
        criticalAlerts: {
          $sum: {
            $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0]
          }
        },
        avgResponseTime: {
          $avg: {
            $cond: [
              { $ne: ['$resolvedAt', null] },
              { $subtract: ['$resolvedAt', '$createdAt'] },
              null
            ]
          }
        }
      }
    }
  ]);
};

// Static method to get alerts by type
alertSchema.statics.getAlertsByType = function(filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        criticalCount: {
          $sum: {
            $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0]
          }
        },
        avgPriority: { $avg: '$priority' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Instance method to add action
alertSchema.methods.addAction = function(actionData) {
  this.actions.push(actionData);
  
  // Auto-update status based on action
  if (actionData.action === 'acknowledged' && this.status === 'active') {
    this.status = 'acknowledged';
  } else if (actionData.action === 'investigated' && this.status === 'acknowledged') {
    this.status = 'investigating';
  } else if (actionData.action === 'resolved') {
    this.status = 'resolved';
    this.resolvedAt = new Date();
    this.resolvedBy = actionData.performedBy;
  }
  
  return this.save();
};

// Instance method to assign team
alertSchema.methods.assignTeam = function(teamMembers) {
  this.assignedTeam = teamMembers.map(member => ({
    ...member,
    assignedAt: new Date()
  }));
  
  // Add action for team assignment
  this.actions.push({
    action: 'team_assigned',
    performedBy: 'system',
    timestamp: new Date(),
    notes: `Team assigned: ${teamMembers.map(m => m.memberName).join(', ')}`
  });
  
  return this.save();
};

// Instance method to escalate alert
alertSchema.methods.escalate = function(performedBy, reason) {
  this.escalationLevel = Math.min(this.escalationLevel + 1, 5);
  
  // Increase priority
  this.priority = Math.min(this.priority + 2, 10);
  
  // Add escalation action
  this.actions.push({
    action: 'escalated',
    performedBy: performedBy,
    timestamp: new Date(),
    notes: `Escalated to level ${this.escalationLevel}. Reason: ${reason}`
  });
  
  return this.save();
};

// Instance method to resolve alert
alertSchema.methods.resolve = function(resolvedBy, resolutionNotes) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  this.resolutionNotes = resolutionNotes;
  
  // Add resolution action
  this.actions.push({
    action: 'resolved',
    performedBy: resolvedBy,
    timestamp: new Date(),
    notes: resolutionNotes
  });
  
  return this.save();
};

// Instance method to send notification
alertSchema.methods.sendNotification = function(recipient, method) {
  this.notificationsSent.push({
    recipient: recipient,
    method: method,
    sentAt: new Date(),
    status: 'sent'
  });
  
  return this.save();
};

// Instance method to link related alert
alertSchema.methods.linkAlert = function(alertId) {
  if (!this.relatedAlerts.includes(alertId)) {
    this.relatedAlerts.push(alertId);
  }
  return this.save();
};

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;