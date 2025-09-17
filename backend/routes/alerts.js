const express = require('express');
const router = express.Router();
const {
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
} = require('../src/controllers/alertsController');

// Alert routes
router.get('/', getAlerts);
router.post('/', createAlert);
router.get('/statistics', getAlertStatistics);
router.post('/generate-automatic', generateAutomaticAlerts);
router.get('/:id', getAlertById);
router.put('/:id/status', updateAlertStatus);
router.put('/:id/assign-team', assignTeamToAlert);
router.put('/:id/escalate', escalateAlert);
router.post('/:id/actions', addAlertAction);
router.delete('/:id', deleteAlert);

module.exports = router;