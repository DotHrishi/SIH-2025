const express = require('express');
const router = express.Router();
const { upload, handleUploadError } = require('../middleware/upload');
const {
  uploadFiles,
  getFile,
  getFileMetadata,
  deleteFile,
  listFiles
} = require('../controllers/fileController');

/**
 * @route POST /api/files/upload
 * @desc Upload single or multiple files
 * @access Public
 */
router.post('/upload', upload.array('files', 5), handleUploadError, uploadFiles);

/**
 * @route GET /api/files/:fileId
 * @desc Get file by ID (returns file content)
 * @access Public
 */
router.get('/:fileId', getFile);

/**
 * @route GET /api/files/:fileId/metadata
 * @desc Get file metadata by ID
 * @access Public
 */
router.get('/:fileId/metadata', getFileMetadata);

/**
 * @route DELETE /api/files/:fileId
 * @desc Delete file by ID
 * @access Public
 */
router.delete('/:fileId', deleteFile);

/**
 * @route GET /api/files
 * @desc List all files with pagination
 * @access Public
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10)
 * @query type - Filter by content type (optional)
 */
router.get('/', listFiles);

module.exports = router;