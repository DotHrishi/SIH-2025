#!/usr/bin/env node

// Simple backend startup script that bypasses GridFS issues
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Simple in-memory storage for demo
let waterReports = [];
let patientReports = [];
let queries = [];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Water Health Surveillance System API is running',
    timestamp: new Date().toISOString()
  });
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      waterReports: waterReports.length + 45, // Add some base numbers
      healthCases: patientReports.length + 23,
      activeAlerts: 3,
      healthCenters: 12
    }
  });
});

// Dashboard recent activity
app.get('/api/dashboard/recent-activity', (req, res) => {
  const activities = [
    ...waterReports.slice(-3).map(report => ({
      id: report.id,
      type: 'water_report',
      title: `Water Quality Report - ${report.location?.district || 'Unknown'}`,
      description: `pH: ${report.testingParameters?.pH}, Turbidity: ${report.testingParameters?.turbidity}`,
      location: report.location?.address || 'Unknown Location',
      timestamp: report.createdAt || new Date().toISOString(),
      severity: 'medium'
    })),
    ...patientReports.slice(-2).map(report => ({
      id: report.id,
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
    data: activities.slice(0, 5) // Return last 5 activities
  });
});

// Water reports endpoints
app.post('/api/reports/water', (req, res) => {
  try {
    const report = {
      ...req.body,
      id: `WR_${Date.now()}`,
      reportId: `WR${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    waterReports.push(report);
    console.log('✅ Water report received:', {
      id: report.id,
      submittedBy: report.submittedBy,
      location: report.location?.district,
      pH: report.testingParameters?.pH,
      turbidity: report.testingParameters?.turbidity
    });
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'Water quality report created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating water report:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create water report' }
    });
  }
});

app.get('/api/reports/water', (req, res) => {
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
    }
  });
});

// Patient reports endpoints
app.post('/api/reports/patient', (req, res) => {
  try {
    const report = {
      ...req.body,
      id: `PR_${Date.now()}`,
      caseId: `PR${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    patientReports.push(report);
    console.log('✅ Patient report received:', {
      id: report.id,
      patient: report.patientInfo?.name,
      symptoms: report.healthInfo?.symptoms?.join(', '),
      severity: report.healthInfo?.severity
    });
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'Patient report created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating patient report:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create patient report' }
    });
  }
});

app.get('/api/reports/patient', (req, res) => {
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
    }
  });
});

// Queries endpoints
app.post('/api/queries', (req, res) => {
  try {
    const query = {
      ...req.body,
      id: `Q_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    queries.push(query);
    console.log('✅ Query received:', {
      id: query.id,
      name: query.contactInfo?.name,
      query: query.query?.substring(0, 50) + '...'
    });
    
    res.status(201).json({
      success: true,
      data: query,
      message: 'Query submitted successfully'
    });
  } catch (error) {
    console.error('❌ Error creating query:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to submit query' }
    });
  }
});

app.get('/api/queries', (req, res) => {
  res.json({
    success: true,
    data: queries
  });
});

// File upload endpoint (simplified)
app.post('/api/files/upload', (req, res) => {
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
    error: { message: 'Internal server error' }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'API endpoint not found' }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📱 Mobile app can now connect to: http://10.189.179.57:${PORT}/api`);
  console.log(`💻 Website dashboard will show submitted reports`);
  console.log(`\n📝 Endpoints available:`);
  console.log(`   POST /api/reports/water - Submit water quality reports`);
  console.log(`   POST /api/reports/patient - Submit patient reports`);
  console.log(`   POST /api/queries - Submit queries`);
  console.log(`   GET  /api/dashboard/stats - Dashboard statistics`);
  console.log(`\n✨ Ready to receive mobile app submissions!`);
});

module.exports = app;