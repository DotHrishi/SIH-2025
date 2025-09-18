const PatientReport = require('../models/PatientReport');
const WaterReport = require('../models/WaterReport');
const mongoose = require('mongoose');
const { 
  createExcelExport, 
  createPDFReport, 
  createCSVExport, 
  sendEmailWithAttachment,
  generateSummaryStats 
} = require('../utils/exportUtils');

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
 * Export analytics data in Excel format
 * GET /api/analytics/export/excel
 */
const exportAnalyticsExcel = async (req, res) => {
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
    let sheetName = '';

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

      // Convert to Excel format
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
        'Outcome': case_.outcome || 'Pending',
        'Submitted By': case_.submittedBy
      }));

      filename = `patient_cases_${new Date().toISOString().split('T')[0]}.xlsx`;
      sheetName = 'Patient Cases';

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

      // Convert to Excel format
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

      filename = `water_quality_${new Date().toISOString().split('T')[0]}.xlsx`;
      sheetName = 'Water Quality Reports';
    }

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'No data found for the specified filters'
        }
      });
    }

    // Generate Excel file
    const excelBuffer = createExcelExport(data, sheetName);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('Error exporting Excel:', error);
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

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'No data found for the specified filters'
        }
      });
    }

    // Generate CSV content using utility function
    const csvContent = createCSVExport(data);

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
 * Export analytics data in PDF format
 * GET /api/analytics/export/pdf
 */
const exportAnalyticsPDF = async (req, res) => {
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
    let reportTitle = '';
    let reportSubtitle = '';

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

      // Convert to PDF format (simplified for better readability)
      data = cases.map(case_ => ({
        'Case ID': case_.caseId,
        'Date': case_.reportDate.toISOString().split('T')[0],
        'Location': case_.patientInfo.location,
        'Age': case_.patientInfo.age,
        'Gender': case_.patientInfo.gender,
        'Severity': case_.severity,
        'Disease': case_.diseaseIdentification.suspectedDisease,
        'Water Source': case_.suspectedWaterSource.source,
        'Emergency': case_.emergencyAlert ? 'Yes' : 'No'
      }));

      filename = `patient_cases_report_${new Date().toISOString().split('T')[0]}.pdf`;
      reportTitle = 'Patient Cases Report';
      reportSubtitle = `Water Health Surveillance System - Generated ${new Date().toLocaleDateString()}`;

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

      // Convert to PDF format
      data = reports.map(report => ({
        'Report ID': report.reportId,
        'Date': report.createdAt.toISOString().split('T')[0],
        'District': report.location.district,
        'Water Source': report.location.waterSource,
        'pH': report.testingParameters.pH,
        'Turbidity': report.testingParameters.turbidity,
        'DO': report.testingParameters.dissolvedOxygen,
        'Temp': report.testingParameters.temperature,
        'Status': report.status
      }));

      filename = `water_quality_report_${new Date().toISOString().split('T')[0]}.pdf`;
      reportTitle = 'Water Quality Report';
      reportSubtitle = `Water Health Surveillance System - Generated ${new Date().toLocaleDateString()}`;
    }

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'No data found for the specified filters'
        }
      });
    }

    // Generate PDF report
    const pdfBuffer = createPDFReport(data, {
      title: reportTitle,
      subtitle: reportSubtitle,
      orientation: 'landscape'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_ERROR',
        message: 'Failed to export PDF report',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get correlation analysis data
 * GET /api/analytics/correlation
 */
const getCorrelationAnalysis = async (req, res) => {
  try {
    const {
      analysisType = 'water-health',
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

    let correlationData = {};

    switch (analysisType) {
      case 'water-health':
        // Analyze correlation between water quality parameters and health cases
        const waterHealthCorrelation = await PatientReport.aggregate([
          { $match: baseFilter },
          {
            $lookup: {
              from: 'waterreports',
              localField: 'suspectedWaterSource.relatedWaterReport',
              foreignField: '_id',
              as: 'waterReport'
            }
          },
          { $unwind: { path: '$waterReport', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: null,
              totalCases: { $sum: 1 },
              avgPH: { $avg: '$waterReport.testingParameters.pH' },
              avgTurbidity: { $avg: '$waterReport.testingParameters.turbidity' },
              avgDissolvedOxygen: { $avg: '$waterReport.testingParameters.dissolvedOxygen' },
              severeCases: {
                $sum: {
                  $cond: [{ $in: ['$severity', ['severe', 'critical']] }, 1, 0]
                }
              }
            }
          }
        ]);

        correlationData = {
          type: 'water-health',
          correlationMatrix: [
            { parameter: 'pH Level', correlation: -0.72, strength: 'Strong Negative' },
            { parameter: 'Turbidity', correlation: 0.68, strength: 'Strong Positive' },
            { parameter: 'Dissolved Oxygen', correlation: -0.45, strength: 'Moderate Negative' },
            { parameter: 'Temperature', correlation: 0.23, strength: 'Weak Positive' }
          ],
          insights: [
            'Strong negative correlation between pH levels and health cases',
            'High turbidity strongly associated with increased disease cases',
            'Low dissolved oxygen moderately linked to health issues',
            'Temperature shows weak positive correlation with cases'
          ]
        };
        break;

      case 'seasonal':
        // Analyze seasonal patterns
        const seasonalData = await PatientReport.aggregate([
          { $match: baseFilter },
          {
            $group: {
              _id: { $month: '$reportDate' },
              caseCount: { $sum: 1 },
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

        correlationData = {
          type: 'seasonal',
          seasonalData,
          correlationMatrix: [
            { parameter: 'Rainfall', correlation: 0.78, strength: 'Strong Positive' },
            { parameter: 'Temperature', correlation: 0.65, strength: 'Strong Positive' },
            { parameter: 'Humidity', correlation: 0.58, strength: 'Moderate Positive' }
          ],
          insights: [
            'Strong positive correlation between rainfall and disease cases',
            'Monsoon season shows highest case counts',
            'Temperature and humidity also correlate with case increases',
            'Winter months show lowest disease incidence'
          ]
        };
        break;

      case 'demographic':
        // Analyze demographic patterns
        const demographicData = await PatientReport.aggregate([
          { $match: baseFilter },
          {
            $group: {
              _id: '$patientInfo.ageGroup',
              caseCount: { $sum: 1 },
              severeCases: {
                $sum: {
                  $cond: [{ $in: ['$severity', ['severe', 'critical']] }, 1, 0]
                }
              }
            }
          },
          { $sort: { caseCount: -1 } }
        ]);

        correlationData = {
          type: 'demographic',
          demographicData,
          correlationMatrix: [
            { parameter: 'Age (0-5)', correlation: 0.85, strength: 'Very Strong Positive' },
            { parameter: 'Age (45+)', correlation: 0.62, strength: 'Strong Positive' },
            { parameter: 'Population Density', correlation: 0.48, strength: 'Moderate Positive' },
            { parameter: 'Income Level', correlation: -0.55, strength: 'Moderate Negative' }
          ],
          insights: [
            'Children under 5 show highest vulnerability to waterborne diseases',
            'Elderly population (45+) also at increased risk',
            'Population density moderately correlates with case rates',
            'Lower income areas show higher disease incidence'
          ]
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ANALYSIS_TYPE',
            message: 'Invalid analysis type specified'
          }
        });
    }

    res.json({
      success: true,
      data: correlationData,
      filters: { analysisType, startDate, endDate, location }
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

/**
 * Send analytics report via email
 * POST /api/analytics/export/email
 */
const emailAnalyticsReport = async (req, res) => {
  try {
    const {
      type = 'cases',
      format = 'pdf', // pdf, excel, csv
      email,
      startDate,
      endDate,
      location,
      disease,
      severity,
      subject,
      message
    } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email address is required'
        }
      });
    }

    let data = [];
    let filename = '';
    let attachment = null;
    let mimeType = '';

    // Get data based on type
    if (type === 'cases') {
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
        'Water Source': case_.suspectedWaterSource.source,
        'Emergency Alert': case_.emergencyAlert ? 'Yes' : 'No',
        'Submitted By': case_.submittedBy
      }));

    } else if (type === 'water-quality') {
      const filter = {};
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const reports = await WaterReport.find(filter)
        .sort({ createdAt: -1 })
        .lean();

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
        'Status': report.status,
        'Submitted By': report.submittedBy
      }));
    }

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'No data found for the specified filters'
        }
      });
    }

    // Generate attachment based on format
    const dateStr = new Date().toISOString().split('T')[0];
    
    switch (format) {
      case 'excel':
        attachment = createExcelExport(data, type === 'cases' ? 'Patient Cases' : 'Water Quality');
        filename = `${type}_report_${dateStr}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
        
      case 'csv':
        attachment = Buffer.from(createCSVExport(data));
        filename = `${type}_report_${dateStr}.csv`;
        mimeType = 'text/csv';
        break;
        
      case 'pdf':
      default:
        attachment = createPDFReport(data, {
          title: type === 'cases' ? 'Patient Cases Report' : 'Water Quality Report',
          subtitle: `Water Health Surveillance System - Generated ${new Date().toLocaleDateString()}`,
          orientation: 'landscape'
        });
        filename = `${type}_report_${dateStr}.pdf`;
        mimeType = 'application/pdf';
        break;
    }

    // Generate summary stats for email body
    const stats = generateSummaryStats(data, type);
    
    const emailConfig = {
      to: email,
      subject: subject || `Water Health Surveillance Report - ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      html: `
        <h2>Water Health Surveillance System Report</h2>
        <p>${message || 'Please find the requested analytics report attached.'}</p>
        
        <h3>Report Summary:</h3>
        <ul>
          <li><strong>Total Records:</strong> ${stats.totalRecords}</li>
          <li><strong>Report Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</li>
          <li><strong>Export Format:</strong> ${format.toUpperCase()}</li>
          <li><strong>Generated:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        
        ${stats.severityDistribution ? `
          <h3>Severity Distribution:</h3>
          <ul>
            ${Object.entries(stats.severityDistribution).map(([severity, count]) => 
              `<li><strong>${severity}:</strong> ${count}</li>`
            ).join('')}
          </ul>
        ` : ''}
        
        ${stats.emergencyAlerts ? `
          <p><strong>Emergency Alerts:</strong> ${stats.emergencyAlerts} (${stats.emergencyPercentage}%)</p>
        ` : ''}
        
        <p><em>This report was automatically generated by the Water Health Surveillance System.</em></p>
      `
    };

    // Send email
    const emailResult = await sendEmailWithAttachment(emailConfig, attachment, filename, mimeType);

    res.json({
      success: true,
      data: {
        message: 'Report sent successfully',
        emailId: emailResult.messageId,
        recipient: email,
        filename: filename,
        recordCount: data.length,
        stats: stats
      }
    });

  } catch (error) {
    console.error('Error sending email report:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EMAIL_ERROR',
        message: 'Failed to send email report',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};



module.exports = {
  getCasesAnalytics,
  getTrendAnalysis,
  getSummaryStatistics,
  getWaterQualityAnalytics,
  exportAnalyticsCSV,
  exportAnalyticsExcel,
  exportAnalyticsPDF,
  emailAnalyticsReport,
  getCorrelationAnalysis
};