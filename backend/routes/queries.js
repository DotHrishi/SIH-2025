const express = require('express');
const router = express.Router();
const {
  getQueries,
  createQuery,
  getQueryById,
  updateQuery,
  deleteQuery,
  getFAQ
} = require('../src/controllers/queriesController');

// Query routes
router.get('/', getQueries);
router.post('/', createQuery);
router.get('/faq', getFAQ);
router.get('/:id', getQueryById);
router.put('/:id', updateQuery);
router.delete('/:id', deleteQuery);

module.exports = router;