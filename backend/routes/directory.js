const express = require('express');
const router = express.Router();
const {
  getHealthCenters,
  getHealthCenterById,
  createHealthCenter,
  updateHealthCenter,
  updateContactInfo,
  searchHealthCenters,
  getHealthCentersByDistrict,
  updateResources,
  getDirectoryStatistics,
  deleteHealthCenter,
  updateLastContact,
  getNearbyHealthCenters
} = require('../src/controllers/directoryController');

// Directory routes
router.get('/centers', getHealthCenters);
router.post('/centers', createHealthCenter);
router.get('/centers/search', searchHealthCenters);
router.get('/centers/nearby', getNearbyHealthCenters);
router.get('/centers/by-district/:district', getHealthCentersByDistrict);
router.get('/statistics', getDirectoryStatistics);
router.get('/centers/:id', getHealthCenterById);
router.put('/centers/:id', updateHealthCenter);
router.put('/centers/:id/contact', updateContactInfo);
router.put('/centers/:id/resources', updateResources);
router.put('/centers/:id/last-contact', updateLastContact);
router.delete('/centers/:id', deleteHealthCenter);

module.exports = router;