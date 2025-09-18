const express = require('express');
const router = express.Router();
const {
  getCasesAnalytics,
  getTrendAnalysis,
  getSummaryStatistics,
  getWaterQualityAnalytics,
  exportAnalyticsCSV,
  exportAnalyticsExcel,
  exportAnalyticsPDF,
  emailAnalyticsReport,
  getCorrelationAnalysis
} = require('../src/controllers/analyticsController');

// Analytics routes
router.get('/cases', getCasesAnalytics);
router.get('/trends', getTrendAnalysis);
router.get('/summary', getSummaryStatistics);
router.get('/water-quality', getWaterQualityAnalytics);

// Export routes
router.get('/export/csv', exportAnalyticsCSV);
router.get('/export/excel', exportAnalyticsExcel);
router.get('/export/pdf', exportAnalyticsPDF);
router.post('/export/email', emailAnalyticsReport);

router.get('/correlation', getCorrelationAnalysis);

module.exports = router;