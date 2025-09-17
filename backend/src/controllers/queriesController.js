const Query = require('../models/Query');

/**
 * Get all queries with filtering and pagination
 * GET /api/queries
 */
const getQueries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (type) {
      filter.type = type;
    }
    
    // Search functionality
    if (search) {
      filter.$or = [
        { query: new RegExp(search, 'i') },
        { 'contactInfo.name': new RegExp(search, 'i') },
        { 'contactInfo.email': new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const queries = await Query.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalCount = await Query.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: queries,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: {
        status,
        type,
        search,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_QUERIES_ERROR',
        message: 'Failed to fetch queries',
        details: process.env.NODE_ENV === 'development' ? error.message : {},
      },
    });
  }
};

/**
 * Create a new query
 * POST /api/queries
 */
const createQuery = async (req, res) => {
  try {
    const queryData = {
      ...req.body,
      submittedAt: new Date(),
      status: 'pending'
    };

    const query = new Query(queryData);
    await query.save();

    res.status(201).json({
      success: true,
      data: query,
      message: 'Query submitted successfully',
    });
  } catch (error) {
    console.error('Error creating query:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validationErrors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_QUERY_ERROR',
        message: 'Failed to create query',
        details: process.env.NODE_ENV === 'development' ? error.message : {},
      },
    });
  }
};

/**
 * Get query by ID
 * GET /api/queries/:id
 */
const getQueryById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = await Query.findById(id);

    if (!query) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'QUERY_NOT_FOUND',
          message: 'Query not found',
        },
      });
    }

    res.json({
      success: true,
      data: query,
    });
  } catch (error) {
    console.error('Error fetching query:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_QUERY_ERROR',
        message: 'Failed to fetch query',
        details: process.env.NODE_ENV === 'development' ? error.message : {},
      },
    });
  }
};

/**
 * Update query
 * PUT /api/queries/:id
 */
const updateQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    const query = await Query.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!query) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'QUERY_NOT_FOUND',
          message: 'Query not found',
        },
      });
    }

    res.json({
      success: true,
      data: query,
      message: 'Query updated successfully',
    });
  } catch (error) {
    console.error('Error updating query:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validationErrors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_QUERY_ERROR',
        message: 'Failed to update query',
        details: process.env.NODE_ENV === 'development' ? error.message : {},
      },
    });
  }
};

/**
 * Delete query
 * DELETE /api/queries/:id
 */
const deleteQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const query = await Query.findByIdAndDelete(id);

    if (!query) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'QUERY_NOT_FOUND',
          message: 'Query not found',
        },
      });
    }

    res.json({
      success: true,
      message: 'Query deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting query:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_QUERY_ERROR',
        message: 'Failed to delete query',
        details: process.env.NODE_ENV === 'development' ? error.message : {},
      },
    });
  }
};

/**
 * Get FAQ data
 * GET /api/queries/faq
 */
const getFAQ = async (req, res) => {
  try {
    // This could be stored in database or returned as static data
    const faqData = [
      {
        id: 1,
        question: 'How do I report a suspected waterborne disease outbreak?',
        answer: 'To report a suspected waterborne disease outbreak, use the Patient Report feature in the app. Provide detailed information about symptoms, affected individuals, and suspected water source. For immediate emergencies, also contact your local health authorities.',
        category: 'Health Emergency',
      },
      {
        id: 2,
        question: 'What should I do if my water supply seems contaminated?',
        answer: 'If you suspect water contamination: 1) Stop using the water immediately, 2) Report it using the Water Quality Report feature, 3) Use bottled water or boil water for at least 1 minute, 4) Contact local water authorities.',
        category: 'Water Safety',
      },
      // Add more FAQ items as needed
    ];

    res.json({
      success: true,
      data: faqData,
    });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAQ_ERROR',
        message: 'Failed to fetch FAQ data',
        details: process.env.NODE_ENV === 'development' ? error.message : {},
      },
    });
  }
};

module.exports = {
  getQueries,
  createQuery,
  getQueryById,
  updateQuery,
  deleteQuery,
  getFAQ,
};