const express = require('express');
const router = express.Router();

// Dashboard stats endpoint
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      waterReports: 45,
      healthCases: 23,
      activeAlerts: 3,
      healthCenters: 12
    }
  });
});

// Recent activity endpoint
router.get('/recent-activity', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        type: 'water_report',
        title: 'Water Quality Alert - Downtown Area',
        description: 'High chlorine levels detected in water supply',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        severity: 'medium',
        location: 'Downtown Treatment Plant'
      },
      {
        id: 2,
        type: 'patient_case',
        title: 'New Patient Case Reported',
        description: 'Waterborne illness symptoms reported',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        severity: 'high',
        location: 'City General Hospital'
      },
      {
        id: 3,
        type: 'alert',
        title: 'System Maintenance Completed',
        description: 'Water monitoring system back online',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        severity: 'low',
        location: 'Central Monitoring Station'
      },
      {
        id: 4,
        type: 'water_report',
        title: 'Routine Water Testing',
        description: 'Weekly water quality assessment completed',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        severity: 'low',
        location: 'North District'
      },
      {
        id: 5,
        type: 'patient_case',
        title: 'Outbreak Investigation',
        description: 'Multiple cases reported in same area',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        severity: 'high',
        location: 'East District'
      }
    ]
  });
});

module.exports = router;