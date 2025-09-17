const mongoose = require('mongoose');
const WaterReport = require('../WaterReport');

/**
 * Example usage of the WaterReport model
 * This file demonstrates how to create, validate, and use the WaterReport model
 */

// Example 1: Creating a basic water report
const createBasicWaterReport = () => {
  const reportData = {
    submittedBy: 'Dr. Rajesh Kumar',
    location: {
      coordinates: [77.5946, 12.9716], // Bangalore coordinates
      address: 'Cubbon Park Lake, Bangalore',
      district: 'Bangalore Urban',
      waterSource: 'lake'
    },
    testingParameters: {
      pH: 7.2,
      turbidity: 3.1,
      dissolvedOxygen: 7.8,
      temperature: 24.5,
      conductivity: 180,
      totalDissolvedSolids: 220
    },
    sampleCollection: {
      collectionDate: new Date(),
      collectionTime: '09:30',
      collectorName: 'Field Worker - Priya Sharma',
      sampleId: 'BLR001-2024-001'
    },
    notes: 'Regular monitoring sample from Cubbon Park Lake. Water appears clear with slight algae presence.'
  };

  const report = new WaterReport(reportData);
  return report;
};

// Example 2: Creating a water report with images
const createWaterReportWithImages = () => {
  const report = createBasicWaterReport();
  
  // Add sample images (in real usage, these would come from GridFS uploads)
  const sampleImages = [
    {
      filename: 'water_sample_1.jpg',
      originalName: 'IMG_20240115_093000.jpg',
      fileId: new mongoose.Types.ObjectId(),
      fileSize: 2048576, // 2MB
      mimeType: 'image/jpeg'
    },
    {
      filename: 'testing_equipment.jpg',
      originalName: 'equipment_photo.jpg',
      fileId: new mongoose.Types.ObjectId(),
      fileSize: 1536000, // 1.5MB
      mimeType: 'image/jpeg'
    }
  ];

  report.images = sampleImages;
  return report;
};

// Example 3: Creating a report with concerning water quality
const createConcerningWaterReport = () => {
  const reportData = {
    submittedBy: 'Health Inspector - Amit Patel',
    location: {
      coordinates: [72.8777, 19.0760], // Mumbai coordinates
      address: 'Industrial Area Well, Andheri East',
      district: 'Mumbai Suburban',
      waterSource: 'well'
    },
    testingParameters: {
      pH: 5.2, // Too acidic
      turbidity: 8.5, // High turbidity
      dissolvedOxygen: 3.2, // Low oxygen
      temperature: 28.0,
      conductivity: 450, // High conductivity
      totalDissolvedSolids: 800 // High TDS
    },
    sampleCollection: {
      collectionDate: new Date(),
      collectionTime: '14:15',
      collectorName: 'Environmental Officer - Sunita Desai',
      sampleId: 'MUM002-2024-015'
    },
    status: 'action_required',
    notes: 'URGENT: Water quality parameters indicate severe contamination. Immediate action required to prevent health risks.'
  };

  return new WaterReport(reportData);
};

// Example 4: Demonstrating model methods and virtuals
const demonstrateModelFeatures = async () => {
  console.log('=== WaterReport Model Examples ===\n');

  // Create reports
  const basicReport = createBasicWaterReport();
  const reportWithImages = createWaterReportWithImages();
  const concerningReport = createConcerningWaterReport();

  // Demonstrate virtuals
  console.log('1. Report ID Generation:');
  console.log(`Basic Report ID: ${basicReport.reportId}`);
  console.log(`Formatted ID: ${basicReport.formattedReportId}\n`);

  console.log('2. Quality Assessment:');
  console.log('Basic Report Assessment:', basicReport.qualityAssessment);
  console.log('Concerning Report Assessment:', concerningReport.qualityAssessment);
  console.log();

  // Demonstrate validation
  console.log('3. Validation Examples:');
  
  // Valid report
  const validationResult1 = basicReport.validateSync();
  console.log('Basic report validation:', validationResult1 ? 'Failed' : 'Passed');

  // Invalid report (missing required field)
  const invalidReport = new WaterReport({
    location: {
      coordinates: [77.5946, 12.9716],
      address: 'Test Address',
      district: 'Test District',
      waterSource: 'well'
    }
    // Missing submittedBy and other required fields
  });
  
  const validationResult2 = invalidReport.validateSync();
  console.log('Invalid report validation:', validationResult2 ? 'Failed (as expected)' : 'Passed');
  console.log();

  // Demonstrate image handling
  console.log('4. Image Handling:');
  console.log(`Report with images count: ${reportWithImages.images.length}`);
  reportWithImages.images.forEach((img, index) => {
    console.log(`  Image ${index + 1}: ${img.originalName} (${img.fileSize} bytes)`);
  });
  console.log();

  // Demonstrate static methods (these would work with actual database connection)
  console.log('5. Available Static Methods:');
  console.log('- WaterReport.findByLocation(longitude, latitude, radiusInKm)');
  console.log('- WaterReport.findByDistrict(district)');
  console.log('- WaterReport.getQualityStats(filter)');
  console.log();

  // Demonstrate instance methods
  console.log('6. Instance Methods:');
  console.log('- report.addImage(imageData)');
  console.log('- report.removeImage(fileId)');
  console.log();

  return {
    basicReport,
    reportWithImages,
    concerningReport
  };
};

// Example usage for testing without database connection
if (require.main === module) {
  demonstrateModelFeatures()
    .then((reports) => {
      console.log('Examples completed successfully!');
      console.log(`Generated ${Object.keys(reports).length} example reports.`);
    })
    .catch((error) => {
      console.error('Error in examples:', error.message);
    });
}

module.exports = {
  createBasicWaterReport,
  createWaterReportWithImages,
  createConcerningWaterReport,
  demonstrateModelFeatures
};