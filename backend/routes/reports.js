const express = require('express');
const router = express.Router();
const {
  createWaterReport,
  getWaterReports,
  getWaterReportById,
  updateWaterReport,
  getWaterReportImage,
  deleteWaterReport,
  upload
} = require('../src/controllers/waterReportController');

const {
  createPatientReport,
  getPatientReports,
  getPatientReportById,
  updatePatientReport,
  generateCaseId,
  classifySeverity,
  getEmergencyCases,
  linkWaterReport,
  deletePatientReport
} = require('../src/controllers/patientReportController');

// Water report routes
router.post('/water', upload.array('images', 10), createWaterReport);
router.get('/water', getWaterReports);
router.get('/water/:id', getWaterReportById);
router.put('/water/:id', updateWaterReport);
router.delete('/water/:id', deleteWaterReport);
router.get('/water/image/:fileId', getWaterReportImage);

// Patient report routes
router.post('/patient', createPatientReport);
router.get('/patient', getPatientReports);
router.get('/patient/emergency', getEmergencyCases);
router.post('/patient/generate-case-id', generateCaseId);
router.post('/patient/classify-severity', classifySeverity);
router.get('/patient/:id', getPatientReportById);
router.put('/patient/:id', updatePatientReport);
router.put('/patient/:id/link-water-report', linkWaterReport);
router.delete('/patient/:id', deletePatientReport);

module.exports = router;