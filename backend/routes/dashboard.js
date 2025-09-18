const express = require('express');
const router = express.Router();
const WaterReport = require('../src/models/WaterReport');
const PatientReport = require('../src/models/PatientReport');
const Alert = require('../src/models/Alert');
const HealthCenter = require('../src/models/HealthCenter');

// Dashboard stats endpoint - fetch real data from MongoDB
router.get('/stats', async (req, res) => {
  try {
    // Get counts from database
    const [waterReports, healthCases, activeAlerts, healthCenters] = await Promise.all([
      WaterReport.countDocuments(),
      PatientReport.countDocuments(),
      Alert.countDocuments({ status: { $in: ['active', 'pending'] } }),
      HealthCenter.countDocuments({ status: 'active' })
    ]);

    res.json({
      success: true,
      data: {
        waterReports,
        healthCases,
        activeAlerts,
        healthCenters
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return fallback data if database query fails
    res.json({
      success: true,
      data: {
        waterReports: 0,
        healthCases: 0,
        activeAlerts: 0,
        healthCenters: 0
      }
    });
  }
});

// Recent activity endpoint - fetch real data from MongoDB
router.get('/recent-activity', async (req, res) => {
  try {
    const activities = [];

    // Get recent water reports
    const recentWaterReports = await WaterReport.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('submittedBy location createdAt status notes');

    recentWaterReports.forEach(report => {
      activities.push({
        id: report._id,
        type: 'water_report',
        title: `Water Quality Report - ${report.location?.district || 'Unknown Location'}`,
        description: `Submitted by ${report.submittedBy}`,
        timestamp: report.createdAt,
        severity: report.status === 'urgent' ? 'high' : 'medium',
        location: report.location?.address || report.location?.district || 'Unknown Location'
      });
    });

    // Get recent patient reports
    const recentPatientReports = await PatientReport.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('patientInfo healthInfo location createdAt status');

    recentPatientReports.forEach(report => {
      const severity = report.healthInfo?.severity || 'mild';
      activities.push({
        id: report._id,
        type: 'patient_case',
        title: `Patient Report - ${report.healthInfo?.suspectedDisease || 'Health Case'}`,
        description: `Patient: ${report.patientInfo?.name}, Age: ${report.patientInfo?.age}`,
        timestamp: report.createdAt,
        severity: severity === 'severe' ? 'high' : severity === 'moderate' ? 'medium' : 'low',
        location: report.location?.district || 'Unknown Location'
      });
    });

    // Get recent alerts if Alert model exists
    try {
      const recentAlerts = await Alert.find()
        .sort({ createdAt: -1 })
        .limit(2)
        .select('title description createdAt severity location status');

      recentAlerts.forEach(alert => {
        activities.push({
          id: alert._id,
          type: 'alert',
          title: alert.title,
          description: alert.description,
          timestamp: alert.createdAt,
          severity: alert.severity || 'medium',
          location: alert.location || 'System'
        });
      });
    } catch (alertError) {
      // Alert model might not exist, skip alerts
      console.log('Alert model not found, skipping alerts in recent activity');
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Return top 5 most recent activities
    res.json({
      success: true,
      data: activities.slice(0, 5)
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    // Return fallback data if database query fails
    res.json({
      success: true,
      data: [
        {
          id: 'fallback-1',
          type: 'system',
          title: 'System Online',
          description: 'Water Health Surveillance System is operational',
          timestamp: new Date().toISOString(),
          severity: 'low',
          location: 'System'
        }
      ]
    });
  }
});

module.exports = router;