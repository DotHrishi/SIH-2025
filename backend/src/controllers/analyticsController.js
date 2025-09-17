const PatientReport = require('../models/PatientReport');
const WaterReport = require('../models/WaterReport');
const mongoose = require('mongoose');

/**
 * Get cases data with filtering for analytics
 * GET /api/analytics/cases
 */
const getCasesAnalytics = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      location,
      disease,
      severity,
      ageGroup,
      waterSource,
      page = 1,
      limit = 100,
      export: exportFormat
    } = req.query;

    // Mock data for now - replace with actual database queries later
    const mockCases = [
      {
        _id: '1',
        caseId: 'CASE-2024-001',
        reportDate: new Date('2024-01-15'),
        patientInfo: {
          location: 'Downtown District',
          age: 34,
          ageGroup: '25-35',
          gender: 'Female'
        },
        symptoms: ['Diarrhea', 'Nausea', 'Fever'],
        severity: 'moderate',
        diseaseIdentification: {
          suspectedDisease: 'Gastroenteritis',
          confirmationStatus: 'suspected'
        },
        suspectedWaterSource: {
          source: 'Tap Water',
          location: 'Downtown Area'
        },
        emergencyAlert: false,
        outcome: 'recovering',
        submittedBy: 'Dr. Smith',
        notes: 'Patient responding well to treatment'
      },
      {
        _id: '2',
        caseId: 'CASE-2024-002',
        reportDate: new Date('2024-01-14'),
        patientInfo: {
          location: 'East District',
          age: 28,
          ageGroup: '25-35',
          gender: 'Male'
        },
        symptoms: ['Vomiting', 'Abdominal Pain'],
        severity: 'mild',
        diseaseIdentification: {
          suspectedDisease: 'Food Poisoning',
          confirmationStatus: 'confirmed'
        },
        suspectedWaterSource: {
          source: 'Well Water',
          location: 'East District'
        },
        emergencyAlert: false,
        outcome: 'recovered',
        submittedBy: 'Dr. Johnson',
        notes: 'Full recovery after 3 days'
      }
    ];

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const totalCount = mockCases.length;

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: {
        cases: mockCases
      },
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      filters: { startDate, endDate, location, disease, severity, ageGroup, waterSource }
    });

  } catch (error) {
    console.error('Error fetching cases analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch cases analytics',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get trend analysis data
 * GET /api/analytics/trends
 */
const getTrendAnalysis = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'day', // day, week, month
      location,
      disease
    } = req.query;

    // Build base filter
    const baseFilter = {};
    
    if (startDate || endDate) {
      baseFilter.reportDate = {};
      if (startDate) {
        baseFilter.reportDate.$gte = new Date(startDate);
      }
      if (endDate) {
        baseFilter.reportDate.$lte = new Date(endDate);
      }
    }
    
    if (location) {
      baseFilter['patientInfo.location'] = new RegExp(location, 'i');
    }
    
    if (disease) {
      baseFilter['diseaseIdentification.suspectedDisease'] = disease;
    }

    // Define grouping format based on groupBy parameter
    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = { $dateToString: { format: "%Y-W%U", date: "$reportDate" } };
        break;
      case 'month':
        dateFormat = { $dateToString: { format: "%Y-%m", date: "$reportDate" } };
        break;
      default: // day
        dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$reportDate" } };
    }

    // Aggregate cases by time period
    const trendData = await PatientReport.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: dateFormat,
          totalCases: { $sum: 1 },
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
            $sum: { $cond: ['$emergencyAlert', 1, 0] }
          },
          diseases: { $addToSet: '$diseaseIdentification.suspectedDisease' },
          locations: { $addToSet: '$patientInfo.location' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get disease distribution over time
    const diseaseDistribution = await PatientReport.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            date: dateFormat,
            disease: '$diseaseIdentification.suspectedDisease'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1, '_id.disease': 1 } }
    ]);

    // Get severity distribution over time
    const severityDistribution = await PatientReport.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            date: dateFormat,
            severity: '$severity'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1, '_id.severity': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        trends: trendData,
        diseaseDistribution,
        severityDistribution,
        groupBy,
        filters: { startDate, endDate, location, disease }
      }
    });

  } catch (error) {
    console.error('Error fetching trend analysis:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch trend analysis',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get summary statistics
 * GET /api/analytics/summary
 */
const getSummaryStatistics = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      location
    } = req.query;

    // Build base filter
    const baseFilter = {};
    
    if (startDate || endDate) {
      baseFilter.reportDate = {};
      if (startDate) {
        baseFilter.reportDate.$gte = new Date(startDate);
      }
      if (endDate) {
        baseFilter.reportDate.$lte = new Date(endDate);
      }
    }
    
    if (location) {
      baseFilter['patientInfo.location'] = new RegExp(location, 'i');
    }

    // Get overall statistics
    const [
      totalCases,
      emergencyCases,
      diseaseStats,
      ageGroupStats,
      severityStats,
      waterSourceStats,
      recentCases
    ] = await Promise.all([
      // Total cases
      PatientReport.countDocuments(baseFilter),
      
      // Emergency cases
      PatientReport.countDocuments({
        ...baseFilter,
        $or: [{ emergencyAlert: true }, { severity: 'critical' }]
      }),
      
      // Disease statistics
      PatientReport.aggregate([
        { $match: baseFilter },
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
            }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Age group statistics
      PatientReport.aggregate([
        { $match: baseFilter },
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
      ]),
      
      // Severity statistics
      PatientReport.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Water source statistics
      PatientReport.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$suspectedWaterSource.source',
            count: { $sum: 1 },
            severeCases: {
              $sum: {
                $cond: [
                  { $in: ['$severity', ['severe', 'critical']] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Recent cases (last 7 days)
      PatientReport.find({
        ...baseFilter,
        reportDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).countDocuments()
    ]);

    // Calculate mortality rate if outcome data is available
    const outcomeStats = await PatientReport.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$outcome',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalCases,
          emergencyCases,
          recentCases,
          mortalityRate: calculateMortalityRate(outcomeStats)
        },
        diseaseDistribution: diseaseStats,
        ageGroupDistribution: ageGroupStats,
        severityDistribution: severityStats,
        waterSourceDistribution: waterSourceStats,
        outcomeDistribution: outcomeStats,
        filters: { startDate, endDate, location }
      }
    });

  } catch (error) {
    console.error('Error fetching summary statistics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch summary statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};/**
 * Ge
t water quality analytics
 * GET /api/analytics/water-quality
 */
const getWaterQualityAnalytics = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      district,
      waterSource
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
    
    if (waterSource) {
      baseFilter['location.waterSource'] = waterSource;
    }

    // Get water quality statistics
    const [
      totalReports,
      qualityStats,
      districtStats,
      waterSourceStats,
      parameterTrends
    ] = await Promise.all([
      // Total water reports
      WaterReport.countDocuments(baseFilter),
      
      // Quality parameter statistics
      WaterReport.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            avgPH: { $avg: '$testingParameters.pH' },
            avgTurbidity: { $avg: '$testingParameters.turbidity' },
            avgDissolvedOxygen: { $avg: '$testingParameters.dissolvedOxygen' },
            avgTemperature: { $avg: '$testingParameters.temperature' },
            minPH: { $min: '$testingParameters.pH' },
            maxPH: { $max: '$testingParameters.pH' },
            minTurbidity: { $min: '$testingParameters.turbidity' },
            maxTurbidity: { $max: '$testingParameters.turbidity' },
            concerningPH: {
              $sum: {
                $cond: [
                  { $or: [
                    { $lt: ['$testingParameters.pH', 6.5] },
                    { $gt: ['$testingParameters.pH', 8.5] }
                  ]},
                  1,
                  0
                ]
              }
            },
            highTurbidity: {
              $sum: {
                $cond: [
                  { $gt: ['$testingParameters.turbidity', 5] },
                  1,
                  0
                ]
              }
            },
            lowOxygen: {
              $sum: {
                $cond: [
                  { $lt: ['$testingParameters.dissolvedOxygen', 5] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]),
      
      // District-wise statistics
      WaterReport.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$location.district',
            count: { $sum: 1 },
            avgPH: { $avg: '$testingParameters.pH' },
            avgTurbidity: { $avg: '$testingParameters.turbidity' },
            concerningReports: {
              $sum: {
                $cond: [
                  { $or: [
                    { $lt: ['$testingParameters.pH', 6.5] },
                    { $gt: ['$testingParameters.pH', 8.5] },
                    { $gt: ['$testingParameters.turbidity', 5] },
                    { $lt: ['$testingParameters.dissolvedOxygen', 5] }
                  ]},
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Water source statistics
      WaterReport.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$location.waterSource',
            count: { $sum: 1 },
            avgPH: { $avg: '$testingParameters.pH' },
            avgTurbidity: { $avg: '$testingParameters.turbidity' },
            concerningReports: {
              $sum: {
                $cond: [
                  { $or: [
                    { $lt: ['$testingParameters.pH', 6.5] },
                    { $gt: ['$testingParameters.pH', 8.5] },
                    { $gt: ['$testingParameters.turbidity', 5] },
                    { $lt: ['$testingParameters.dissolvedOxygen', 5] }
                  ]},
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Parameter trends over time
      WaterReport.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            avgPH: { $avg: '$testingParameters.pH' },
            avgTurbidity: { $avg: '$testingParameters.turbidity' },
            avgDissolvedOxygen: { $avg: '$testingParameters.dissolvedOxygen' },
            reportCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalReports,
          qualityStats: qualityStats[0] || {}
        },
        districtAnalysis: districtStats,
        waterSourceAnalysis: waterSourceStats,
        parameterTrends,
        filters: { startDate, endDate, district, waterSource }
      }
    });

  } catch (error) {
    console.error('Error fetching water quality analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch water quality analytics',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Export analytics data in CSV format
 * GET /api/analytics/export/csv
 */
const exportAnalyticsCSV = async (req, res) => {
  try {
    const {
      type = 'cases', // cases, water-quality
      startDate,
      endDate,
      location,
      disease,
      severity
    } = req.query;

    let data = [];
    let filename = '';

    if (type === 'cases') {
      // Build filter for patient reports
      const filter = {};
      
      if (startDate || endDate) {
        filter.reportDate = {};
        if (startDate) filter.reportDate.$gte = new Date(startDate);
        if (endDate) filter.reportDate.$lte = new Date(endDate);
      }
      
      if (location) filter['patientInfo.location'] = new RegExp(location, 'i');
      if (disease) filter['diseaseIdentification.suspectedDisease'] = disease;
      if (severity) filter.severity = severity;

      const cases = await PatientReport.find(filter)
        .populate('suspectedWaterSource.relatedWaterReport', 'reportId location')
        .sort({ reportDate: -1 })
        .lean();

      // Convert to CSV format
      data = cases.map(case_ => ({
        'Case ID': case_.caseId,
        'Report Date': case_.reportDate.toISOString().split('T')[0],
        'Location': case_.patientInfo.location,
        'Age': case_.patientInfo.age,
        'Age Group': case_.patientInfo.ageGroup,
        'Gender': case_.patientInfo.gender,
        'Symptoms': case_.symptoms.join('; '),
        'Severity': case_.severity,
        'Suspected Disease': case_.diseaseIdentification.suspectedDisease,
        'Confirmation Status': case_.diseaseIdentification.confirmationStatus,
        'Water Source': case_.suspectedWaterSource.source,
        'Water Source Location': case_.suspectedWaterSource.location,
        'Emergency Alert': case_.emergencyAlert ? 'Yes' : 'No',
        'Outcome': case_.outcome,
        'Submitted By': case_.submittedBy
      }));

      filename = `patient_cases_${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'water-quality') {
      // Build filter for water reports
      const filter = {};
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const reports = await WaterReport.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      // Convert to CSV format
      data = reports.map(report => ({
        'Report ID': report.reportId,
        'Date': report.createdAt.toISOString().split('T')[0],
        'District': report.location.district,
        'Address': report.location.address,
        'Water Source': report.location.waterSource,
        'pH': report.testingParameters.pH,
        'Turbidity': report.testingParameters.turbidity,
        'Dissolved Oxygen': report.testingParameters.dissolvedOxygen,
        'Temperature': report.testingParameters.temperature,
        'Conductivity': report.testingParameters.conductivity || 'N/A',
        'TDS': report.testingParameters.totalDissolvedSolids || 'N/A',
        'Status': report.status,
        'Submitted By': report.submittedBy
      }));

      filename = `water_quality_${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Convert to CSV string
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'No data found for the specified filters'
        }
      });
    }

    const csvHeaders = Object.keys(data[0]).join(',');
    const csvRows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    const csvContent = [csvHeaders, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_ERROR',
        message: 'Failed to export data',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get correlation analysis between water quality and health cases
 * GET /api/analytics/correlation
 */
const getCorrelationAnalysis = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      location
    } = req.query;

    // Build base filters
    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    const locationFilter = location ? new RegExp(location, 'i') : null;

    // Get water quality data
    const waterFilter = {};
    if (Object.keys(dateFilter).length > 0) waterFilter.createdAt = dateFilter;
    if (locationFilter) waterFilter['location.district'] = locationFilter;

    // Get health cases data
    const healthFilter = {};
    if (Object.keys(dateFilter).length > 0) healthFilter.reportDate = dateFilter;
    if (locationFilter) healthFilter['patientInfo.location'] = locationFilter;

    const [waterQualityData, healthCasesData] = await Promise.all([
      WaterReport.aggregate([
        { $match: waterFilter },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              district: "$location.district"
            },
            avgPH: { $avg: '$testingParameters.pH' },
            avgTurbidity: { $avg: '$testingParameters.turbidity' },
            avgDissolvedOxygen: { $avg: '$testingParameters.dissolvedOxygen' },
            concerningReports: {
              $sum: {
                $cond: [
                  { $or: [
                    { $lt: ['$testingParameters.pH', 6.5] },
                    { $gt: ['$testingParameters.pH', 8.5] },
                    { $gt: ['$testingParameters.turbidity', 5] },
                    { $lt: ['$testingParameters.dissolvedOxygen', 5] }
                  ]},
                  1,
                  0
                ]
              }
            },
            totalReports: { $sum: 1 }
          }
        }
      ]),
      
      PatientReport.aggregate([
        { $match: healthFilter },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$reportDate" } },
              location: "$patientInfo.location"
            },
            totalCases: { $sum: 1 },
            severeCases: {
              $sum: {
                $cond: [
                  { $in: ['$severity', ['severe', 'critical']] },
                  1,
                  0
                ]
              }
            },
            waterborneDiseaseCases: {
              $sum: {
                $cond: [
                  { $in: ['$diseaseIdentification.suspectedDisease', 
                    ['cholera', 'typhoid', 'hepatitis_a', 'hepatitis_e', 'dysentery', 'gastroenteritis']] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ])
    ]);

    // Simple correlation analysis
    const correlationInsights = analyzeCorrelation(waterQualityData, healthCasesData);

    res.json({
      success: true,
      data: {
        waterQualityData,
        healthCasesData,
        correlationInsights,
        filters: { startDate, endDate, location }
      }
    });

  } catch (error) {
    console.error('Error fetching correlation analysis:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch correlation analysis',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

// Helper function to calculate mortality rate
function calculateMortalityRate(outcomeStats) {
  const totalCases = outcomeStats.reduce((sum, stat) => sum + stat.count, 0);
  const deaths = outcomeStats.find(stat => stat._id === 'deceased')?.count || 0;
  
  return totalCases > 0 ? ((deaths / totalCases) * 100).toFixed(2) : 0;
}

// Helper function for correlation analysis
function analyzeCorrelation(waterData, healthData) {
  const insights = [];
  
  // Group data by location/district for comparison
  const waterByLocation = {};
  const healthByLocation = {};
  
  waterData.forEach(item => {
    const key = item._id.district;
    if (!waterByLocation[key]) waterByLocation[key] = [];
    waterByLocation[key].push(item);
  });
  
  healthData.forEach(item => {
    const key = item._id.location;
    if (!healthByLocation[key]) healthByLocation[key] = [];
    healthByLocation[key].push(item);
  });
  
  // Find locations with both water and health data
  const commonLocations = Object.keys(waterByLocation).filter(loc => 
    Object.keys(healthByLocation).some(healthLoc => 
      healthLoc.toLowerCase().includes(loc.toLowerCase()) || 
      loc.toLowerCase().includes(healthLoc.toLowerCase())
    )
  );
  
  commonLocations.forEach(location => {
    const waterStats = waterByLocation[location];
    const healthStats = healthByLocation[location] || [];
    
    const avgConcerningReports = waterStats.reduce((sum, item) => 
      sum + (item.concerningReports / item.totalReports), 0) / waterStats.length;
    
    const avgHealthCases = healthStats.reduce((sum, item) => 
      sum + item.totalCases, 0) / Math.max(healthStats.length, 1);
    
    if (avgConcerningReports > 0.3 && avgHealthCases > 5) {
      insights.push({
        location,
        type: 'high_risk',
        message: `${location} shows high correlation between poor water quality (${(avgConcerningReports * 100).toFixed(1)}% concerning reports) and health cases (avg ${avgHealthCases.toFixed(1)} cases)`
      });
    }
  });
  
  return insights;
}

module.exports = {
  getCasesAnalytics,
  getTrendAnalysis,
  getSummaryStatistics,
  getWaterQualityAnalytics,
  exportAnalyticsCSV,
  getCorrelationAnalysis
};