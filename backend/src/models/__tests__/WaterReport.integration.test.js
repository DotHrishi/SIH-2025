const mongoose = require('mongoose');
const WaterReport = require('../WaterReport');
const { validWaterReportData } = require('./WaterReport.test');

// Integration tests that require database connection
describe('WaterReport Integration Tests', () => {
  // Skip these tests if no database connection is available
  const skipIfNoConnection = () => {
    if (mongoose.connection.readyState !== 1) {
      console.log('Skipping integration tests - no database connection');
      return true;
    }
    return false;
  };

  beforeAll(async () => {
    // Only connect if MONGODB_URI is provided and we're not already connected
    if (process.env.MONGODB_URI && mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(process.env.MONGODB_URI);
      } catch (error) {
        console.log('Could not connect to database for integration tests');
      }
    }
  });

  afterAll(async () => {
    // Clean up test data and close connection
    if (mongoose.connection.readyState === 1) {
      await WaterReport.deleteMany({ submittedBy: /Test/ });
      await mongoose.connection.close();
    }
  });

  test('should save and retrieve a water report', async () => {
    if (skipIfNoConnection()) return;

    const reportData = {
      ...validWaterReportData,
      submittedBy: 'Test User - Integration',
      sampleCollection: {
        ...validWaterReportData.sampleCollection,
        sampleId: 'TEST-INT-001'
      }
    };

    // Create and save report
    const report = new WaterReport(reportData);
    const savedReport = await report.save();

    expect(savedReport._id).toBeDefined();
    expect(savedReport.reportId).toMatch(/^WR\d{9}$/);
    expect(savedReport.submittedBy).toBe('Test User - Integration');

    // Retrieve report
    const retrievedReport = await WaterReport.findById(savedReport._id);
    expect(retrievedReport.submittedBy).toBe('Test User - Integration');
    expect(retrievedReport.location.coordinates).toEqual([77.5946, 12.9716]);
  });

  test('should enforce unique sample ID constraint', async () => {
    if (skipIfNoConnection()) return;

    const reportData1 = {
      ...validWaterReportData,
      submittedBy: 'Test User 1',
      sampleCollection: {
        ...validWaterReportData.sampleCollection,
        sampleId: 'UNIQUE-TEST-001'
      }
    };

    const reportData2 = {
      ...validWaterReportData,
      submittedBy: 'Test User 2',
      sampleCollection: {
        ...validWaterReportData.sampleCollection,
        sampleId: 'UNIQUE-TEST-001' // Same sample ID
      }
    };

    // Save first report
    const report1 = new WaterReport(reportData1);
    await report1.save();

    // Try to save second report with same sample ID
    const report2 = new WaterReport(reportData2);
    
    await expect(report2.save()).rejects.toThrow();
  });

  test('should perform location-based queries', async () => {
    if (skipIfNoConnection()) return;

    // Create test reports at different locations
    const bangaloreReport = new WaterReport({
      ...validWaterReportData,
      submittedBy: 'Test User - Bangalore',
      location: {
        ...validWaterReportData.location,
        coordinates: [77.5946, 12.9716] // Bangalore
      },
      sampleCollection: {
        ...validWaterReportData.sampleCollection,
        sampleId: 'LOC-TEST-BLR-001'
      }
    });

    const mumbaiReport = new WaterReport({
      ...validWaterReportData,
      submittedBy: 'Test User - Mumbai',
      location: {
        ...validWaterReportData.location,
        coordinates: [72.8777, 19.0760] // Mumbai
      },
      sampleCollection: {
        ...validWaterReportData.sampleCollection,
        sampleId: 'LOC-TEST-MUM-001'
      }
    });

    await bangaloreReport.save();
    await mumbaiReport.save();

    // Find reports near Bangalore (should find Bangalore report, not Mumbai)
    const nearbyReports = await WaterReport.findByLocation(77.5946, 12.9716, 50); // 50km radius
    
    const bangaloreResults = nearbyReports.filter(r => r.submittedBy.includes('Bangalore'));
    const mumbaiResults = nearbyReports.filter(r => r.submittedBy.includes('Mumbai'));
    
    expect(bangaloreResults.length).toBeGreaterThan(0);
    expect(mumbaiResults.length).toBe(0); // Mumbai should be too far
  });

  test('should generate quality statistics', async () => {
    if (skipIfNoConnection()) return;

    // Create reports with different quality parameters
    const goodQualityReport = new WaterReport({
      ...validWaterReportData,
      submittedBy: 'Test User - Good Quality',
      testingParameters: {
        pH: 7.0,
        turbidity: 1.0,
        dissolvedOxygen: 8.0,
        temperature: 25.0
      },
      sampleCollection: {
        ...validWaterReportData.sampleCollection,
        sampleId: 'STATS-TEST-GOOD-001'
      }
    });

    const poorQualityReport = new WaterReport({
      ...validWaterReportData,
      submittedBy: 'Test User - Poor Quality',
      testingParameters: {
        pH: 5.0,
        turbidity: 10.0,
        dissolvedOxygen: 3.0,
        temperature: 30.0
      },
      sampleCollection: {
        ...validWaterReportData.sampleCollection,
        sampleId: 'STATS-TEST-POOR-001'
      }
    });

    await goodQualityReport.save();
    await poorQualityReport.save();

    // Get quality statistics
    const stats = await WaterReport.getQualityStats({
      submittedBy: /Test User - (Good|Poor) Quality/
    });

    expect(stats).toHaveLength(1);
    expect(stats[0].totalReports).toBe(2);
    expect(stats[0].avgPH).toBe(6.0); // Average of 7.0 and 5.0
    expect(stats[0].avgTurbidity).toBe(5.5); // Average of 1.0 and 10.0
  });

  test('should find reports by district', async () => {
    if (skipIfNoConnection()) return;

    const testReport = new WaterReport({
      ...validWaterReportData,
      submittedBy: 'Test User - District Search',
      location: {
        ...validWaterReportData.location,
        district: 'Test District'
      },
      sampleCollection: {
        ...validWaterReportData.sampleCollection,
        sampleId: 'DISTRICT-TEST-001'
      }
    });

    await testReport.save();

    // Search by district
    const districtReports = await WaterReport.findByDistrict('Test District');
    
    expect(districtReports.length).toBeGreaterThan(0);
    expect(districtReports[0].location.district).toBe('Test District');
  });
});

module.exports = {};