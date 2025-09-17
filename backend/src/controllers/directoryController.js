const HealthCenter = require('../models/HealthCenter');

/**
 * Get health centers with filtering and search
 * GET /api/directory/centers
 */
const getHealthCenters = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      district,
      status = 'active',
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (type) {
      filter.type = type.toUpperCase();
    }
    
    if (district) {
      filter['location.district'] = new RegExp(district, 'i');
    }
    
    if (status) {
      filter.status = status;
    }
    
    // Search functionality
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { centerId: new RegExp(search, 'i') },
        { 'leadWorker.name': new RegExp(search, 'i') },
        { 'location.district': new RegExp(search, 'i') },
        { 'location.address': new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [centers, totalCount] = await Promise.all([
      HealthCenter.find(filter)
        .sort(sortConfig)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      HealthCenter.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Separate by type for categorized display
    const categorizedCenters = {
      ASHA: centers.filter(center => center.type === 'ASHA'),
      NGO: centers.filter(center => center.type === 'NGO')
    };

    res.json({
      success: true,
      data: {
        centers,
        categorized: categorizedCenters
      },
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        type,
        district,
        status,
        search
      }
    });

  } catch (error) {
    console.error('Error fetching health centers:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch health centers',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get a single health center by ID
 * GET /api/directory/centers/:id
 */
const getHealthCenterById = async (req, res) => {
  try {
    const { id } = req.params;

    const center = await HealthCenter.findById(id);
    
    if (!center) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Health center not found'
        }
      });
    }

    res.json({
      success: true,
      data: center
    });

  } catch (error) {
    console.error('Error fetching health center:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid health center ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch health center',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Create a new health center
 * POST /api/directory/centers
 */
const createHealthCenter = async (req, res) => {
  try {
    const {
      name,
      type,
      location,
      leadWorker,
      coverage,
      resources,
      status
    } = req.body;

    // Validate required fields
    if (!name || !type || !location || !leadWorker || !coverage) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: {
            name: !name ? 'Center name is required' : null,
            type: !type ? 'Center type is required' : null,
            location: !location ? 'Location information is required' : null,
            leadWorker: !leadWorker ? 'Lead worker information is required' : null,
            coverage: !coverage ? 'Coverage information is required' : null
          }
        }
      });
    }

    // Create new health center
    const healthCenter = new HealthCenter({
      name,
      type: type.toUpperCase(),
      location,
      leadWorker,
      coverage,
      resources: resources || [],
      status: status || 'active'
    });

    const savedCenter = await healthCenter.save();

    res.status(201).json({
      success: true,
      data: savedCenter,
      message: 'Health center created successfully'
    });

  } catch (error) {
    console.error('Error creating health center:', error);
    
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

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'Health center with this ID already exists'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create health center',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Update a health center
 * PUT /api/directory/centers/:id
 */
const updateHealthCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.centerId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const center = await HealthCenter.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!center) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Health center not found'
        }
      });
    }

    res.json({
      success: true,
      data: center,
      message: 'Health center updated successfully'
    });

  } catch (error) {
    console.error('Error updating health center:', error);
    
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
          message: 'Invalid health center ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update health center',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Update contact information for a health center
 * PUT /api/directory/centers/:id/contact
 */
const updateContactInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { leadWorker } = req.body;

    if (!leadWorker) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Lead worker information is required'
        }
      });
    }

    const center = await HealthCenter.findById(id);
    
    if (!center) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Health center not found'
        }
      });
    }

    // Update lead worker information
    center.leadWorker = { ...center.leadWorker.toObject(), ...leadWorker };
    center.leadWorker.lastContact = new Date();

    const updatedCenter = await center.save();

    res.json({
      success: true,
      data: updatedCenter,
      message: 'Contact information updated successfully'
    });

  } catch (error) {
    console.error('Error updating contact info:', error);
    
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
        message: 'Failed to update contact information',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};/*
*
 * Search health centers with advanced filtering
 * GET /api/directory/centers/search
 */
const searchHealthCenters = async (req, res) => {
  try {
    const {
      query,
      type,
      district,
      status = 'active',
      latitude,
      longitude,
      radius = 10, // km
      limit = 20
    } = req.query;

    let filter = {};
    
    // Basic filters
    if (type) filter.type = type.toUpperCase();
    if (district) filter['location.district'] = new RegExp(district, 'i');
    if (status) filter.status = status;

    // Text search
    if (query) {
      filter.$or = [
        { name: new RegExp(query, 'i') },
        { centerId: new RegExp(query, 'i') },
        { 'leadWorker.name': new RegExp(query, 'i') },
        { 'location.district': new RegExp(query, 'i') },
        { 'location.address': new RegExp(query, 'i') },
        { 'coverage.villages': new RegExp(query, 'i') }
      ];
    }

    let centers;

    // Location-based search
    if (latitude && longitude) {
      centers = await HealthCenter.findByLocation(
        parseFloat(longitude),
        parseFloat(latitude),
        parseFloat(radius)
      ).where(filter).limit(parseInt(limit));
    } else {
      centers = await HealthCenter.find(filter).limit(parseInt(limit));
    }

    res.json({
      success: true,
      data: centers,
      count: centers.length,
      searchParams: {
        query,
        type,
        district,
        status,
        location: latitude && longitude ? { latitude, longitude, radius } : null
      }
    });

  } catch (error) {
    console.error('Error searching health centers:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to search health centers',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get health centers by district
 * GET /api/directory/centers/by-district/:district
 */
const getHealthCentersByDistrict = async (req, res) => {
  try {
    const { district } = req.params;
    const { type, status = 'active' } = req.query;

    let filter = {
      'location.district': new RegExp(district, 'i'),
      status
    };

    if (type) {
      filter.type = type.toUpperCase();
    }

    const centers = await HealthCenter.find(filter).sort({ name: 1 });

    // Group by type
    const grouped = {
      ASHA: centers.filter(c => c.type === 'ASHA'),
      NGO: centers.filter(c => c.type === 'NGO')
    };

    res.json({
      success: true,
      data: {
        centers,
        grouped,
        district,
        totalCount: centers.length,
        counts: {
          ASHA: grouped.ASHA.length,
          NGO: grouped.NGO.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching centers by district:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch centers by district',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Update resource information for a health center
 * PUT /api/directory/centers/:id/resources
 */
const updateResources = async (req, res) => {
  try {
    const { id } = req.params;
    const { resources } = req.body;

    if (!resources || !Array.isArray(resources)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Resources array is required'
        }
      });
    }

    const center = await HealthCenter.findById(id);
    
    if (!center) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Health center not found'
        }
      });
    }

    // Update resources
    center.resources = resources.map(resource => ({
      ...resource,
      lastUpdated: new Date()
    }));

    const updatedCenter = await center.save();

    res.json({
      success: true,
      data: updatedCenter,
      message: 'Resources updated successfully'
    });

  } catch (error) {
    console.error('Error updating resources:', error);
    
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
        message: 'Failed to update resources',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get directory statistics
 * GET /api/directory/statistics
 */
const getDirectoryStatistics = async (req, res) => {
  try {
    const { district } = req.query;

    // Build base filter
    const baseFilter = {};
    if (district) {
      baseFilter['location.district'] = new RegExp(district, 'i');
    }

    const [
      totalCenters,
      centersByType,
      centersByStatus,
      centersByDistrict,
      resourceStats,
      coverageStats
    ] = await Promise.all([
      // Total centers
      HealthCenter.countDocuments(baseFilter),
      
      // Centers by type
      HealthCenter.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            activeCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
              }
            }
          }
        }
      ]),
      
      // Centers by status
      HealthCenter.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Centers by district
      HealthCenter.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$location.district',
            count: { $sum: 1 },
            ashaCount: {
              $sum: {
                $cond: [{ $eq: ['$type', 'ASHA'] }, 1, 0]
              }
            },
            ngoCount: {
              $sum: {
                $cond: [{ $eq: ['$type', 'NGO'] }, 1, 0]
              }
            }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Resource statistics
      HealthCenter.aggregate([
        { $match: baseFilter },
        { $unwind: '$resources' },
        {
          $group: {
            _id: '$resources.resourceType',
            totalQuantity: { $sum: '$resources.quantity' },
            centerCount: { $sum: 1 },
            avgQuantity: { $avg: '$resources.quantity' }
          }
        },
        { $sort: { totalQuantity: -1 } }
      ]),
      
      // Coverage statistics
      HealthCenter.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            totalPopulation: { $sum: '$coverage.population' },
            avgPopulation: { $avg: '$coverage.population' },
            totalVillages: { $sum: { $size: '$coverage.villages' } },
            avgVillages: { $avg: { $size: '$coverage.villages' } }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalCenters,
          totalPopulationCovered: coverageStats[0]?.totalPopulation || 0,
          totalVillagesCovered: coverageStats[0]?.totalVillages || 0
        },
        distribution: {
          byType: centersByType,
          byStatus: centersByStatus,
          byDistrict: centersByDistrict
        },
        resources: resourceStats,
        coverage: coverageStats[0] || {
          totalPopulation: 0,
          avgPopulation: 0,
          totalVillages: 0,
          avgVillages: 0
        },
        filters: { district }
      }
    });

  } catch (error) {
    console.error('Error fetching directory statistics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch directory statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Delete a health center
 * DELETE /api/directory/centers/:id
 */
const deleteHealthCenter = async (req, res) => {
  try {
    const { id } = req.params;

    const center = await HealthCenter.findByIdAndDelete(id);
    
    if (!center) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Health center not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Health center deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting health center:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid health center ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete health center',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Update last contact for a health center
 * PUT /api/directory/centers/:id/last-contact
 */
const updateLastContact = async (req, res) => {
  try {
    const { id } = req.params;

    const center = await HealthCenter.findById(id);
    
    if (!center) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Health center not found'
        }
      });
    }

    // Update last contact using instance method
    await center.updateLastContact();

    res.json({
      success: true,
      data: center,
      message: 'Last contact updated successfully'
    });

  } catch (error) {
    console.error('Error updating last contact:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update last contact',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

/**
 * Get health centers near a location
 * GET /api/directory/centers/nearby
 */
const getNearbyHealthCenters = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, type, limit = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Latitude and longitude are required'
        }
      });
    }

    let centers = await HealthCenter.findByLocation(
      parseFloat(longitude),
      parseFloat(latitude),
      parseFloat(radius)
    );

    // Filter by type if specified
    if (type) {
      centers = centers.filter(center => center.type === type.toUpperCase());
    }

    // Limit results
    centers = centers.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: centers,
      count: centers.length,
      searchLocation: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseFloat(radius)
      }
    });

  } catch (error) {
    console.error('Error fetching nearby centers:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch nearby health centers',
        details: process.env.NODE_ENV === 'development' ? error.message : {}
      }
    });
  }
};

module.exports = {
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
};