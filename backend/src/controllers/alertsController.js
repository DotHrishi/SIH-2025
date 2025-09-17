const Alert = require('../models/Alert');
const WaterReport = require('../models/WaterReport');
const PatientReport = require('../models/PatientReport');

/**
 * Get alerts with categorization and filtering
 * GET /api/alerts
 */
const getAlerts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      severity,
      status,
      district,
      startDate,
      endDate,
      assignedTo,
      sortBy = 'priority',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (severity) {
      filter.severity = severity;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (district) {
      filter['location.district'] = new RegExp(district, 'i');
    }
    
    if (assignedTo) {
      filter['assignedTeam.memberName'] = new RegExp(assignedTo, 'i');
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig = {};
    if (sortBy === 'urgency') {
      // Custom urgency sorting (priority + time factor)
      sortConfig.priority = -1;
      sortConfig.createdAt = 1; // Older alerts first for same priority
    } else {
      sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query with pagination
    const [alerts, totalCount] = await Promise.all([
      Alert.find(filter)
        .populate('source.sourceId')
        .populate('relatedAlerts', 'alertId title severity status')
        .sort(sortConfig)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Alert.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Categorize alerts
    const categorizedAlerts = {
      water_quality: alerts.filter(alert => alert.type === 'water_quality'),
      health_cluster: alerts.filter(alert => alert.type === 'health_cluster'),
      emergency: alerts.filter(alert => alert.type === 'emergency'),
      outbreak: alerts.filter(alert => alert.type === 'outbreak'),
      system_maintenance: alerts.filter(alert => alert.type === 'system_maintenance')
    };

    res.json({
      success: true,
      data: {
        alerts,
        categorized: categorizedAlerts
      },
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        type,
        severity,
        status,
        district,
        startDate,
        endDate,
        assignedTo
      }
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch alerts',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Create a new alert manually
 * POST /api/alerts
 */
const createAlert = async (req, res) => {
  try {
    const {
      type,
      severity,
      title,
      description,
      location,
      parameters,
      assignedTeam,
      tags,
      isPublic,
      estimatedResolutionTime
    } = req.body;

    // Validate required fields
    if (!type || !severity || !title || !description || !location) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: {
            type: !type ? 'Alert type is required' : null,
            severity: !severity ? 'Severity is required' : null,
            title: !title ? 'Title is required' : null,
            description: !description ? 'Description is required' : null,
            location: !location ? 'Location is required' : null
          }
        }
      });
    }

    // Create new alert
    const alert = new Alert({
      type,
      severity,
      title,
      description,
      location,
      parameters,
      source: {
        type: 'manual',
        triggeredBy: req.body.triggeredBy || 'System Administrator'
      },
      assignedTeam: assignedTeam || [],
      tags: tags || [],
      isPublic: isPublic || false,
      estimatedResolutionTime
    });

    // Add initial action
    alert.actions.push({
      action: 'acknowledged',
      performedBy: req.body.triggeredBy || 'System Administrator',
      timestamp: new Date(),
      notes: 'Alert created manually'
    });

    const savedAlert = await alert.save();

    res.status(201).json({
      success: true,
      data: savedAlert,
      message: 'Alert created successfully'
    });

  } catch (error) {
    console.error('Error creating alert:', error);
    
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
        message: 'Failed to create alert',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get a single alert by ID
 * GET /api/alerts/:id
 */
const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findById(id)
      .populate('source.sourceId')
      .populate('relatedAlerts', 'alertId title severity status createdAt');
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Alert not found'
        }
      });
    }

    res.json({
      success: true,
      data: alert
    });

  } catch (error) {
    console.error('Error fetching alert:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid alert ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch alert',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Update alert status
 * PUT /api/alerts/:id/status
 */
const updateAlertStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, performedBy, notes, resolutionNotes } = req.body;

    if (!status || !performedBy) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status and performedBy are required'
        }
      });
    }

    const alert = await Alert.findById(id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Alert not found'
        }
      });
    }

    // Update status
    const oldStatus = alert.status;
    alert.status = status;

    // Add action for status change
    const actionMap = {
      'acknowledged': 'acknowledged',
      'investigating': 'investigated',
      'resolved': 'resolved',
      'false_alarm': 'false_alarm'
    };

    const action = actionMap[status] || 'other';
    
    alert.actions.push({
      action: action,
      performedBy: performedBy,
      timestamp: new Date(),
      notes: notes || `Status changed from ${oldStatus} to ${status}`
    });

    // Handle resolution
    if (status === 'resolved') {
      alert.resolvedAt = new Date();
      alert.resolvedBy = performedBy;
      if (resolutionNotes) {
        alert.resolutionNotes = resolutionNotes;
      }
    }

    const updatedAlert = await alert.save();

    res.json({
      success: true,
      data: updatedAlert,
      message: `Alert status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating alert status:', error);
    
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
        message: 'Failed to update alert status',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};/**
 * Ass
ign team to alert
 * PUT /api/alerts/:id/assign-team
 */
const assignTeamToAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamMembers, assignedBy } = req.body;

    if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Team members array is required'
        }
      });
    }

    const alert = await Alert.findById(id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Alert not found'
        }
      });
    }

    // Assign team using instance method
    await alert.assignTeam(teamMembers);

    // Add additional action if assignedBy is provided
    if (assignedBy) {
      alert.actions.push({
        action: 'team_assigned',
        performedBy: assignedBy,
        timestamp: new Date(),
        notes: `Team assigned by ${assignedBy}: ${teamMembers.map(m => m.memberName).join(', ')}`
      });
      await alert.save();
    }

    res.json({
      success: true,
      data: alert,
      message: 'Team assigned successfully'
    });

  } catch (error) {
    console.error('Error assigning team:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to assign team',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Escalate alert
 * PUT /api/alerts/:id/escalate
 */
const escalateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { performedBy, reason } = req.body;

    if (!performedBy || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'performedBy and reason are required'
        }
      });
    }

    const alert = await Alert.findById(id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Alert not found'
        }
      });
    }

    // Escalate using instance method
    await alert.escalate(performedBy, reason);

    res.json({
      success: true,
      data: alert,
      message: `Alert escalated to level ${alert.escalationLevel}`
    });

  } catch (error) {
    console.error('Error escalating alert:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to escalate alert',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Add action to alert
 * POST /api/alerts/:id/actions
 */
const addAlertAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, performedBy, performerRole, notes } = req.body;

    if (!action || !performedBy) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Action and performedBy are required'
        }
      });
    }

    const alert = await Alert.findById(id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Alert not found'
        }
      });
    }

    // Add action using instance method
    await alert.addAction({
      action,
      performedBy,
      performerRole,
      notes,
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: alert,
      message: 'Action added successfully'
    });

  } catch (error) {
    console.error('Error adding action:', error);
    
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
        message: 'Failed to add action',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Generate automatic alerts based on threshold breaches
 * POST /api/alerts/generate-automatic
 */
const generateAutomaticAlerts = async (req, res) => {
  try {
    const { checkWaterQuality = true, checkHealthClusters = true } = req.body;
    const generatedAlerts = [];

    // Check water quality thresholds
    if (checkWaterQuality) {
      const waterQualityAlerts = await checkWaterQualityThresholds();
      generatedAlerts.push(...waterQualityAlerts);
    }

    // Check health cluster thresholds
    if (checkHealthClusters) {
      const healthClusterAlerts = await checkHealthClusterThresholds();
      generatedAlerts.push(...healthClusterAlerts);
    }

    res.json({
      success: true,
      data: {
        generatedAlerts,
        count: generatedAlerts.length
      },
      message: `Generated ${generatedAlerts.length} automatic alerts`
    });

  } catch (error) {
    console.error('Error generating automatic alerts:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate automatic alerts',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get alert statistics
 * GET /api/alerts/statistics
 */
const getAlertStatistics = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      district
    } = req.query;

    // Build base filter
    const baseFilter = {};
    
    if (startDate || endDate) {
      baseFilter.createdAt = {};
      if (startDate) {
        baseFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        baseFilter.createdAt.$lte = new Date(endDate);
      }
    }
    
    if (district) {
      baseFilter['location.district'] = new RegExp(district, 'i');
    }

    const [
      overallStats,
      alertsByType,
      alertsBySeverity,
      alertsByStatus,
      recentAlerts,
      responseTimeStats
    ] = await Promise.all([
      // Overall statistics
      Alert.aggregate([
        { $match: baseFilter },
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
            resolvedAlerts: {
              $sum: {
                $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
              }
            },
            avgPriority: { $avg: '$priority' },
            avgEscalationLevel: { $avg: '$escalationLevel' }
          }
        }
      ]),
      
      // Alerts by type
      Alert.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            criticalCount: {
              $sum: {
                $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0]
              }
            },
            activeCount: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['active', 'acknowledged', 'investigating']] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Alerts by severity
      Alert.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 },
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
        },
        { $sort: { count: -1 } }
      ]),
      
      // Alerts by status
      Alert.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Recent alerts (last 24 hours)
      Alert.find({
        ...baseFilter,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).countDocuments(),
      
      // Response time statistics
      Alert.aggregate([
        { 
          $match: { 
            ...baseFilter,
            resolvedAt: { $ne: null }
          }
        },
        {
          $project: {
            responseTimeHours: {
              $divide: [
                { $subtract: ['$resolvedAt', '$createdAt'] },
                1000 * 60 * 60 // Convert to hours
              ]
            },
            severity: 1
          }
        },
        {
          $group: {
            _id: '$severity',
            avgResponseTimeHours: { $avg: '$responseTimeHours' },
            minResponseTimeHours: { $min: '$responseTimeHours' },
            maxResponseTimeHours: { $max: '$responseTimeHours' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        overview: overallStats[0] || {
          totalAlerts: 0,
          activeAlerts: 0,
          criticalAlerts: 0,
          resolvedAlerts: 0,
          avgPriority: 0,
          avgEscalationLevel: 0
        },
        byType: alertsByType,
        bySeverity: alertsBySeverity,
        byStatus: alertsByStatus,
        recentAlerts,
        responseTimeStats,
        filters: { startDate, endDate, district }
      }
    });

  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch alert statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Delete an alert
 * DELETE /api/alerts/:id
 */
const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndDelete(id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Alert not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting alert:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid alert ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete alert',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

// Helper function to check water quality thresholds
async function checkWaterQualityThresholds() {
  const alerts = [];
  
  try {
    // Find recent water reports with concerning parameters
    const concerningReports = await WaterReport.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      $or: [
        { 'testingParameters.pH': { $lt: 6.5 } },
        { 'testingParameters.pH': { $gt: 8.5 } },
        { 'testingParameters.turbidity': { $gt: 5 } },
        { 'testingParameters.dissolvedOxygen': { $lt: 5 } }
      ]
    });

    for (const report of concerningReports) {
      // Check if alert already exists for this report
      const existingAlert = await Alert.findOne({
        'source.sourceId': report._id,
        'source.type': 'water_report',
        status: { $in: ['active', 'acknowledged', 'investigating'] }
      });

      if (!existingAlert) {
        let severity = 'medium';
        let parameterIssues = [];

        // Determine severity and issues
        if (report.testingParameters.pH < 6.0 || report.testingParameters.pH > 9.0) {
          severity = 'high';
          parameterIssues.push(`pH: ${report.testingParameters.pH}`);
        } else if (report.testingParameters.pH < 6.5 || report.testingParameters.pH > 8.5) {
          parameterIssues.push(`pH: ${report.testingParameters.pH}`);
        }

        if (report.testingParameters.turbidity > 10) {
          severity = 'high';
          parameterIssues.push(`Turbidity: ${report.testingParameters.turbidity} NTU`);
        } else if (report.testingParameters.turbidity > 5) {
          parameterIssues.push(`Turbidity: ${report.testingParameters.turbidity} NTU`);
        }

        if (report.testingParameters.dissolvedOxygen < 3) {
          severity = 'high';
          parameterIssues.push(`DO: ${report.testingParameters.dissolvedOxygen} mg/L`);
        } else if (report.testingParameters.dissolvedOxygen < 5) {
          parameterIssues.push(`DO: ${report.testingParameters.dissolvedOxygen} mg/L`);
        }

        const alert = new Alert({
          type: 'water_quality',
          severity,
          title: `Water Quality Alert - ${report.location.district}`,
          description: `Water quality parameters exceed safe thresholds: ${parameterIssues.join(', ')}`,
          location: report.location,
          parameters: {
            parameterName: 'water_contamination_level',
            measuredValue: parameterIssues.length,
            threshold: 1,
            unit: 'parameters',
            comparisonType: 'above'
          },
          source: {
            type: 'water_report',
            sourceId: report._id,
            sourceModel: 'WaterReport'
          }
        });

        await alert.save();
        alerts.push(alert);
      }
    }
  } catch (error) {
    console.error('Error checking water quality thresholds:', error);
  }

  return alerts;
}

// Helper function to check health cluster thresholds
async function checkHealthClusterThresholds() {
  const alerts = [];
  
  try {
    // Find locations with multiple cases in the last 7 days
    const healthClusters = await PatientReport.aggregate([
      {
        $match: {
          reportDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$patientInfo.location',
          caseCount: { $sum: 1 },
          severeCases: {
            $sum: {
              $cond: [
                { $in: ['$severity', ['severe', 'critical']] },
                1,
                0
              ]
            }
          },
          diseases: { $addToSet: '$diseaseIdentification.suspectedDisease' },
          cases: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          $or: [
            { caseCount: { $gte: 3 } }, // 3+ cases in same location
            { severeCases: { $gte: 2 } } // 2+ severe cases
          ]
        }
      }
    ]);

    for (const cluster of healthClusters) {
      // Check if alert already exists for this location
      const existingAlert = await Alert.findOne({
        type: 'health_cluster',
        'location.address': new RegExp(cluster._id, 'i'),
        status: { $in: ['active', 'acknowledged', 'investigating'] },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      if (!existingAlert) {
        let severity = 'medium';
        
        if (cluster.severeCases >= 2 || cluster.caseCount >= 5) {
          severity = 'high';
        }
        
        if (cluster.severeCases >= 3 || cluster.caseCount >= 8) {
          severity = 'critical';
        }

        // Use coordinates from the first case
        const firstCase = cluster.cases[0];
        const location = {
          coordinates: [0, 0], // Default coordinates - should be updated with actual location data
          address: cluster._id,
          district: firstCase.patientInfo.location
        };

        const alert = new Alert({
          type: 'health_cluster',
          severity,
          title: `Health Cluster Alert - ${cluster._id}`,
          description: `${cluster.caseCount} cases detected in ${cluster._id} (${cluster.severeCases} severe). Diseases: ${cluster.diseases.join(', ')}`,
          location,
          parameters: {
            parameterName: 'case_count',
            measuredValue: cluster.caseCount,
            threshold: 3,
            unit: 'cases',
            comparisonType: 'above'
          },
          source: {
            type: 'system_generated'
          }
        });

        await alert.save();
        alerts.push(alert);
      }
    }
  } catch (error) {
    console.error('Error checking health cluster thresholds:', error);
  }

  return alerts;
}

module.exports = {
  getAlerts,
  createAlert,
  getAlertById,
  updateAlertStatus,
  assignTeamToAlert,
  escalateAlert,
  addAlertAction,
  generateAutomaticAlerts,
  getAlertStatistics,
  deleteAlert
};