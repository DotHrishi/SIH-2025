const WaterReport = require('../models/WaterReport');
const multer = require('multer');
const GridFSBucket = require('mongodb').GridFSBucket;
const mongoose = require('mongoose');

// GridFS setup for image storage
let gfsBucket;
mongoose.connection.once('open', () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'waterReportImages'
  });
});

// Multer configuration for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * Create a new water quality report
 * POST /api/reports/water
 */
const createWaterReport = async (req, res) => {
  try {
    const {
      submittedBy,
      location,
      testingParameters,
      sampleCollection,
      notes
    } = req.body;

    // Validate required fields
    if (!submittedBy || !location || !testingParameters || !sampleCollection) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: {
            submittedBy: !submittedBy ? 'Submitter name is required' : null,
            location: !location ? 'Location information is required' : null,
            testingParameters: !testingParameters ? 'Testing parameters are required' : null,
            sampleCollection: !sampleCollection ? 'Sample collection info is required' : null
          }
        }
      });
    }

    // Create new water report
    const waterReport = new WaterReport({
      submittedBy,
      location,
      testingParameters,
      sampleCollection,
      notes: notes || ''
    });

    // Handle image uploads if present
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const filename = `${Date.now()}_${file.originalname}`;
          const uploadStream = gfsBucket.openUploadStream(filename, {
            metadata: {
              reportId: waterReport.reportId,
              originalName: file.originalname,
              mimeType: file.mimetype
            }
          });

          uploadStream.end(file.buffer);
          
          uploadStream.on('finish', () => {
            resolve({
              filename: filename,
              originalName: file.originalname,
              fileId: uploadStream.id,
              fileSize: file.size,
              mimeType: file.mimetype
            });
          });

          uploadStream.on('error', reject);
        });
      });

      try {
        const imageData = await Promise.all(imagePromises);
        waterReport.images = imageData;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: 'Failed to upload images',
            details: uploadError.message
          }
        });
      }
    }

    // Save the report
    const savedReport = await waterReport.save();

    res.status(201).json({
      success: true,
      data: savedReport,
      message: 'Water quality report created successfully'
    });

  } catch (error) {
    console.error('Error creating water report:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: Object.keys(error.errors).reduce((acc, key) => {
            acc[key] = error.errors[key].message;
            return acc;
          }, {})
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create water report',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get water quality reports with filtering and pagination
 * GET /api/reports/water
 */
const getWaterReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      district,
      waterSource,
      startDate,
      endDate,
      submittedBy,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (district) {
      filter['location.district'] = new RegExp(district, 'i');
    }
    
    if (waterSource) {
      filter['location.waterSource'] = waterSource;
    }
    
    if (submittedBy) {
      filter.submittedBy = new RegExp(submittedBy, 'i');
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [reports, totalCount] = await Promise.all([
      WaterReport.find(filter)
        .sort(sortConfig)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      WaterReport.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: reports,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        status,
        district,
        waterSource,
        startDate,
        endDate,
        submittedBy
      }
    });

  } catch (error) {
    console.error('Error fetching water reports:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch water reports',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get a single water report by ID
 * GET /api/reports/water/:id
 */
const getWaterReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await WaterReport.findById(id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Water report not found'
        }
      });
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error fetching water report:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid report ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch water report',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Update a water report
 * PUT /api/reports/water/:id
 */
const updateWaterReport = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.reportId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const report = await WaterReport.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Water report not found'
        }
      });
    }

    res.json({
      success: true,
      data: report,
      message: 'Water report updated successfully'
    });

  } catch (error) {
    console.error('Error updating water report:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: Object.keys(error.errors).reduce((acc, key) => {
            acc[key] = error.errors[key].message;
            return acc;
          }, {})
        }
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid report ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update water report',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get image from GridFS
 * GET /api/reports/water/image/:fileId
 */
const getWaterReportImage = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!gfsBucket) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'STORAGE_ERROR',
          message: 'File storage not initialized'
        }
      });
    }

    const downloadStream = gfsBucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    
    downloadStream.on('error', (error) => {
      if (error.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'Image not found'
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        error: {
          code: 'STORAGE_ERROR',
          message: 'Failed to retrieve image'
        }
      });
    });

    downloadStream.on('file', (file) => {
      res.set('Content-Type', file.metadata.mimeType || 'image/jpeg');
      res.set('Content-Disposition', `inline; filename="${file.metadata.originalName}"`);
    });

    downloadStream.pipe(res);

  } catch (error) {
    console.error('Error retrieving image:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve image',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Delete a water report
 * DELETE /api/reports/water/:id
 */
const deleteWaterReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await WaterReport.findById(id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Water report not found'
        }
      });
    }

    // Delete associated images from GridFS
    if (report.images && report.images.length > 0) {
      const deletePromises = report.images.map(image => {
        return gfsBucket.delete(image.fileId).catch(err => {
          console.error(`Failed to delete image ${image.fileId}:`, err);
        });
      });
      
      await Promise.all(deletePromises);
    }

    // Delete the report
    await WaterReport.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Water report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting water report:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid report ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete water report',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

module.exports = {
  createWaterReport,
  getWaterReports,
  getWaterReportById,
  updateWaterReport,
  getWaterReportImage,
  deleteWaterReport,
  upload
};