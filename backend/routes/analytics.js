const express = require('express');
const router = express.Router();
const {
  getCasesAnalytics,
  getTrendAnalysis,
  getSummaryStatistics,
  getWaterQualityAnalytics,
  exportAnalyticsCSV,
  getCorrelationAnalysis
} = require('../src/controllers/analyticsController');

// Analytics routes
router.get('/cases', getCasesAnalytics);
router.get('/trends', getTrendAnalysis);
router.get('/summary', getSummaryStatistics);
router.get('/water-quality', getWaterQualityAnalytics);
router.get('/export/csv', exportAnalyticsCSV);
router.get('/correlation', getCorrelationAnalysis);

module.exports = router;