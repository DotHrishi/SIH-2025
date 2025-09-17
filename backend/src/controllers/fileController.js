const mongoose = require('mongoose');
const { getGridFS } = require('../config/gridfs');
const { compressImage, generateThumbnail, validateImage } = require('../utils/imageProcessor');

/**
 * Upload single or multiple files
 */
const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES',
          message: 'No files were uploaded'
        }
      });
    }

    const uploadedFiles = req.files.map(file => ({
      fileId: file.id,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadDate: new Date(),
      metadata: file.metadata
    }));

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: 'Failed to upload files',
        details: error.message
      }
    });
  }
};

/**
 * Get file by ID
 */
const getFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_ID',
          message: 'Invalid file ID format'
        }
      });
    }

    const gfs = getGridFS();
    
    // Find file in GridFS
    gfs.files.findOne({ _id: mongoose.Types.ObjectId(fileId) }, (err, file) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error retrieving file'
          }
        });
      }

      if (!file) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'File not found'
          }
        });
      }

      // Set appropriate headers
      res.set({
        'Content-Type': file.contentType,
        'Content-Length': file.length,
        'Content-Disposition': `inline; filename="${file.metadata.originalName}"`,
        'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
      });

      // Create read stream and pipe to response
      const readStream = gfs.createReadStream({ _id: file._id });
      
      readStream.on('error', (error) => {
        console.error('File stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: {
              code: 'STREAM_ERROR',
              message: 'Error streaming file'
            }
          });
        }
      });

      readStream.pipe(res);
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Get file metadata
 */
const getFileMetadata = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_ID',
          message: 'Invalid file ID format'
        }
      });
    }

    const gfs = getGridFS();
    
    gfs.files.findOne({ _id: mongoose.Types.ObjectId(fileId) }, (err, file) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error retrieving file metadata'
          }
        });
      }

      if (!file) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'File not found'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          fileId: file._id,
          filename: file.filename,
          originalName: file.metadata.originalName,
          contentType: file.contentType,
          size: file.length,
          uploadDate: file.uploadDate,
          metadata: file.metadata
        }
      });
    });
  } catch (error) {
    console.error('Get file metadata error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Delete file by ID
 */
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_ID',
          message: 'Invalid file ID format'
        }
      });
    }

    const gfs = getGridFS();
    
    gfs.remove({ _id: mongoose.Types.ObjectId(fileId) }, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'DELETE_ERROR',
            message: 'Error deleting file'
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * List all files with pagination
 */
const listFiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (page - 1) * limit;
    
    const gfs = getGridFS();
    
    let query = {};
    if (type) {
      query['contentType'] = new RegExp(type, 'i');
    }
    
    gfs.files.find(query)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ uploadDate: -1 })
      .toArray((err, files) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Error retrieving files'
            }
          });
        }

        const fileList = files.map(file => ({
          fileId: file._id,
          filename: file.filename,
          originalName: file.metadata.originalName,
          contentType: file.contentType,
          size: file.length,
          uploadDate: file.uploadDate,
          metadata: file.metadata
        }));

        res.status(200).json({
          success: true,
          data: {
            files: fileList,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: files.length
            }
          }
        });
      });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

module.exports = {
  uploadFiles,
  getFile,
  getFileMetadata,
  deleteFile,
  listFiles
};