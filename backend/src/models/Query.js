const mongoose = require('mongoose');

// Schema for contact information
const contactInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  }
}, { _id: false });

// Main Query Schema
const querySchema = new mongoose.Schema({
  query: {
    type: String,
    required: [true, 'Query text is required'],
    trim: true,
    maxlength: [2000, 'Query cannot exceed 2000 characters']
  },
  contactInfo: {
    type: contactInfoSchema,
    required: [true, 'Contact information is required']
  },
  type: {
    type: String,
    enum: ['general', 'water_quality', 'health', 'emergency', 'technical'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: String,
    trim: true
  },
  response: {
    type: String,
    trim: true,
    maxlength: [5000, 'Response cannot exceed 5000 characters']
  },
  responseBy: {
    type: String,
    trim: true
  },
  responseDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  attachments: [{
    filename: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
querySchema.index({ status: 1, submittedAt: -1 });
querySchema.index({ type: 1, priority: -1 });
querySchema.index({ 'contactInfo.email': 1 });
querySchema.index({ assignedTo: 1 });

// Virtual for response time calculation
querySchema.virtual('responseTime').get(function() {
  if (this.responseDate && this.submittedAt) {
    return Math.floor((this.responseDate - this.submittedAt) / (1000 * 60 * 60)); // in hours
  }
  return null;
});

// Pre-save middleware to update timestamps
querySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get queries by status
querySchema.statics.getByStatus = function(status) {
  return this.find({ status }).sort({ submittedAt: -1 });
};

// Static method to get urgent queries
querySchema.statics.getUrgent = function() {
  return this.find({ 
    priority: { $in: ['high', 'urgent'] },
    status: { $in: ['pending', 'in_progress'] }
  }).sort({ priority: -1, submittedAt: -1 });
};

// Instance method to mark as resolved
querySchema.methods.markResolved = function(response, responseBy) {
  this.status = 'resolved';
  this.response = response;
  this.responseBy = responseBy;
  this.responseDate = new Date();
  return this.save();
};

const Query = mongoose.model('Query', querySchema);

module.exports = Query;