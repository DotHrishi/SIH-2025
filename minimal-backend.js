// Minimal backend server for mobile app integration
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory storage
let waterReports = [];
let patientReports = [];
let queries = [];

// Add some sample data
waterReports.push({
  id: 'WR_SAMPLE_001',
  reportId: 'WR001',
  submittedBy: 'Sample User',
  location: {
    address: 'Sample Location',
    district: 'Sample District',
    coordinates: [73.8567, 18.5204]
  },
  testingParameters: {
    pH: 7.2,
    turbidity: 3.5,
    temperature: 25,
    totalDissolvedSolids: 450
  },
  notes: 'Sample water quality report',
  status: 'pending',
  createdAt: new Date().toISOString()
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('📊 Health check requested');
  res.json({
    status: 'OK',
    message: 'Water Health Surveillance System API is running',
    timestamp: new Date().toISOString(),
    reports: {
      water: waterReports.length,
      patient: patientReports.length,
      queries: queries.length
    }
  });
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  console.log('📈 Dashboard stats requested');
  res.json({
    success: true,
    data: {
      waterReports: waterReports.length + 45,
      healthCases: patientReports.length + 23,
      activeAlerts: 3,
      healthCenters: 12
    }
  });
});

// Dashboard recent activity
app.get('/api/dashboard/recent-activity', (req, res) => {
  console.log('📋 Recent activity requested');
  
  const activities = [
    ...waterReports.slice(-3).map((report, index) => ({
      id: report.id || `activity_${index}`,
      type: 'water_report',
      title: `Water Quality Report - ${report.location?.district || 'Unknown'}`,
      description: `pH: ${report.testingParameters?.pH || 'N/A'}, Turbidity: ${report.testingParameters?.turbidity || 'N/A'}`,
      location: report.location?.address || 'Unknown Location',
      timestamp: report.createdAt || new Date().toISOString(),
      severity: 'medium'
    })),
    ...patientReports.slice(-2).map((report, index) => ({
      id: report.id || `patient_${index}`,
      type: 'patient_case',
      title: `Patient Case - ${report.healthInfo?.suspectedDisease || 'Health Issue'}`,
      description: `Symptoms: ${report.healthInfo?.symptoms?.join(', ') || 'Not specified'}`,
      location: report.location?.address || 'Unknown Location',
      timestamp: report.createdAt || new Date().toISOString(),
      severity: report.healthInfo?.severity === 'severe' ? 'high' : 'medium'
    }))
  ];

  res.json({
    success: true,
    data: activities.slice(0, 5)
  });
});

// Water reports - CREATE
app.post('/api/reports/water', (req, res) => {
  try {
    console.log('💧 Water report submission received!');
    console.log('Data:', JSON.stringify(req.body, null, 2));
    
    const report = {
      ...req.body,
      id: `WR_${Date.now()}`,
      reportId: `WR${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    waterReports.push(report);
    
    console.log('✅ Water report saved successfully!');
    console.log(`📊 Total water reports: ${waterReports.length}`);
    console.log(`👤 Submitted by: ${report.submittedBy}`);
    console.log(`📍 Location: ${report.location?.district || 'Unknown'}`);
    console.log(`🧪 pH: ${report.testingParameters?.pH}, Turbidity: ${report.testingParameters?.turbidity}`);
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'Water quality report created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating water report:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create water report',
        details: error.message
      }
    });
  }
});

// Water reports - READ
app.get('/api/reports/water', (req, res) => {
  console.log('📋 Water reports list requested');
  res.json({
    success: true,
    data: waterReports,
    pagination: {
      currentPage: 1,
      totalPages: Math.ceil(waterReports.length / 10),
      totalCount: waterReports.length,
      limit: 10,
      hasNextPage: false,
      hasPrevPage: false
    },
    filters: {}
  });
});

// Patient reports - CREATE
app.post('/api/reports/patient', (req, res) => {
  try {
    console.log('🏥 Patient report submission received!');
    console.log('Data:', JSON.stringify(req.body, null, 2));
    
    const report = {
      ...req.body,
      id: `PR_${Date.now()}`,
      caseId: `PR${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    patientReports.push(report);
    
    console.log('✅ Patient report saved successfully!');
    console.log(`📊 Total patient reports: ${patientReports.length}`);
    console.log(`👤 Patient: ${report.patientInfo?.name || 'Unknown'}`);
    console.log(`🏥 Symptoms: ${report.healthInfo?.symptoms?.join(', ') || 'Not specified'}`);
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'Patient report created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating patient report:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create patient report',
        details: error.message
      }
    });
  }
});

// Patient reports - READ
app.get('/api/reports/patient', (req, res) => {
  console.log('📋 Patient reports list requested');
  res.json({
    success: true,
    data: patientReports,
    pagination: {
      currentPage: 1,
      totalPages: Math.ceil(patientReports.length / 10),
      totalCount: patientReports.length,
      limit: 10,
      hasNextPage: false,
      hasPrevPage: false
    },
    filters: {}
  });
});

// Queries - CREATE
app.post('/api/queries', (req, res) => {
  try {
    console.log('❓ Query submission received!');
    console.log('Data:', JSON.stringify(req.body, null, 2));
    
    const query = {
      ...req.body,
      id: `Q_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    queries.push(query);
    
    console.log('✅ Query saved successfully!');
    console.log(`📊 Total queries: ${queries.length}`);
    console.log(`👤 From: ${query.contactInfo?.name || 'Unknown'}`);
    
    res.status(201).json({
      success: true,
      data: query,
      message: 'Query submitted successfully'
    });
  } catch (error) {
    console.error('❌ Error creating query:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit query',
        details: error.message
      }
    });
  }
});

// Queries - READ
app.get('/api/queries', (req, res) => {
  console.log('📋 Queries list requested');
  res.json({
    success: true,
    data: queries
  });
});

// File upload (simplified)
app.post('/api/files/upload', (req, res) => {
  console.log('📁 File upload requested');
  res.json({
    success: true,
    data: {
      url: `/api/files/placeholder/${Date.now()}`,
      fileId: `file_${Date.now()}`,
      filename: `upload_${Date.now()}.jpg`
    },
    message: 'File uploaded successfully'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❓ Unknown endpoint requested: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'API endpoint not found'
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 =================================');
  console.log('🚀 BACKEND SERVER STARTED!');
  console.log('🚀 =================================');
  console.log(`📡 Server running on: http://0.0.0.0:${PORT}`);
  console.log(`📱 Mobile app endpoint: http://10.189.179.57:${PORT}/api`);
  console.log(`🌐 Local access: http://localhost:${PORT}/api`);
  console.log(`📊 Health check: http://10.189.179.57:${PORT}/api/health`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('   POST /api/reports/water   - Submit water quality reports');
  console.log('   POST /api/reports/patient - Submit patient reports');
  console.log('   POST /api/queries         - Submit queries');
  console.log('   GET  /api/dashboard/stats - Dashboard statistics');
  console.log('');
  console.log('✨ Ready to receive mobile app data!');
  console.log('📱 Try submitting a report from your mobile app now!');
});

module.exports = app;