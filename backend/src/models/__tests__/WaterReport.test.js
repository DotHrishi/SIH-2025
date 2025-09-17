const mongoose = require('mongoose');
const WaterReport = require('../WaterReport');

// Mock data for testing
const validWaterReportData = {
  submittedBy: 'John Doe',
  location: {
    coordinates: [77.5946, 12.9716], // Bangalore coordinates
    address: '123 Main Street, Bangalore',
    district: 'Bangalore Urban',
    waterSource: 'well'
  },
  testingParameters: {
    pH: 7.2,
    turbidity: 2.5,
    dissolvedOxygen: 8.5,
    temperature: 25.0,
    conductivity: 150,
    totalDissolvedSolids: 200
  },
  sampleCollection: {
    collectionDate: new Date('2024-01-15'),
    collectionTime: '10:30',
    collectorName: 'Jane Smith',
    sampleId: 'SAMPLE001'
  }
};

describe('WaterReport Model', () => {
  // Test basic model creation
  test('should create a valid water report', () => {
    const report = new WaterReport(validWaterReportData);
    
    expect(report.submittedBy).toBe('John Doe');
    expect(report.location.coordinates).toEqual([77.5946, 12.9716]);
    expect(report.testingParameters.pH).toBe(7.2);
    expect(report.status).toBe('pending'); // default value
    expect(report.reportId).toMatch(/^WR\d{9}$/); // auto-generated ID
  });

  // Test required field validation
  test('should require submittedBy field', () => {
    const reportData = { ...validWaterReportData };
    delete reportData.submittedBy;
    
    const report = new WaterReport(reportData);
    const error = report.validateSync();
    
    expect(error.errors.submittedBy).toBeDefined();
    expect(error.errors.submittedBy.message).toContain('required');
  });

  // Test location coordinates validation
  test('should validate location coordinates', () => {
    const reportData = { ...validWaterReportData };
    reportData.location.coordinates = [200, 100]; // Invalid coordinates
    
    const report = new WaterReport(reportData);
    const error = report.validateSync();
    
    expect(error.errors['location.coordinates']).toBeDefined();
  });

  // Test pH validation
  test('should validate pH range', () => {
    const reportData = { ...validWaterReportData };
    reportData.testingParameters.pH = 15; // Invalid pH
    
    const report = new WaterReport(reportData);
    const error = report.validateSync();
    
    expect(error.errors['testingParameters.pH']).toBeDefined();
  });

  // Test water source enum validation
  test('should validate water source enum', () => {
    const reportData = { ...validWaterReportData };
    reportData.location.waterSource = 'invalid_source';
    
    const report = new WaterReport(reportData);
    const error = report.validateSync();
    
    expect(error.errors['location.waterSource']).toBeDefined();
  });

  // Test collection time format validation
  test('should validate collection time format', () => {
    const reportData = { ...validWaterReportData };
    reportData.sampleCollection.collectionTime = '25:70'; // Invalid time
    
    const report = new WaterReport(reportData);
    const error = report.validateSync();
    
    expect(error.errors['sampleCollection.collectionTime']).toBeDefined();
  });

  // Test image addition
  test('should add images correctly', () => {
    const report = new WaterReport(validWaterReportData);
    
    const imageData = {
      filename: 'test-image.jpg',
      originalName: 'original-test.jpg',
      fileId: new mongoose.Types.ObjectId(),
      fileSize: 1024,
      mimeType: 'image/jpeg'
    };
    
    report.images.push(imageData);
    
    expect(report.images).toHaveLength(1);
    expect(report.images[0].filename).toBe('test-image.jpg');
  });

  // Test image limit validation
  test('should limit images to 10', () => {
    const reportData = { ...validWaterReportData };
    reportData.images = Array(11).fill({
      filename: 'test.jpg',
      originalName: 'test.jpg',
      fileId: new mongoose.Types.ObjectId()
    });
    
    const report = new WaterReport(reportData);
    const error = report.validateSync();
    
    expect(error.errors.images).toBeDefined();
  });

  // Test quality assessment virtual
  test('should calculate quality assessment', () => {
    const reportData = { ...validWaterReportData };
    // Ensure all parameters are within acceptable ranges
    reportData.testingParameters.pH = 7.0; // Safe pH
    reportData.testingParameters.turbidity = 2.0; // Low turbidity
    reportData.testingParameters.dissolvedOxygen = 8.0; // Good oxygen level
    
    const report = new WaterReport(reportData);
    const assessment = report.qualityAssessment;
    
    expect(assessment.status).toBe('acceptable');
    expect(assessment.issues).toHaveLength(0);
  });

  // Test quality assessment with issues
  test('should identify quality issues', () => {
    const reportData = { ...validWaterReportData };
    reportData.testingParameters.pH = 5.0; // Too acidic
    reportData.testingParameters.turbidity = 10; // Too high
    
    const report = new WaterReport(reportData);
    const assessment = report.qualityAssessment;
    
    expect(assessment.status).toBe('concerning');
    expect(assessment.issues).toContain('pH out of safe range');
    expect(assessment.issues).toContain('High turbidity');
  });

  // Test formatted report ID virtual
  test('should format report ID correctly', () => {
    const report = new WaterReport(validWaterReportData);
    
    expect(report.formattedReportId).toMatch(/^WR-\d{9}$/);
  });
});

module.exports = { validWaterReportData };