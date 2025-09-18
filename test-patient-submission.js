const axios = require('axios');

// Test patient report submission
const testPatientSubmission = async () => {
  const baseURL = 'http://localhost:5000/api';
  
  // Test data for patient report
  const patientData = {
    submittedBy: 'Test Health Worker',
    submitterRole: 'health_officer',
    patientInfo: {
      age: 25,
      ageGroup: '25-35',
      gender: 'male',
      location: 'Test Location, Mumbai',
      coordinates: [72.8777, 19.0760], // Mumbai coordinates [lng, lat]
      contactNumber: '+91-9876543210'
    },
    symptoms: ['diarrhea', 'vomiting', 'fever', 'dehydration'],
    severity: 'moderate',
    suspectedWaterSource: {
      source: 'well',
      location: 'Community Well, Test Area',
      sourceDescription: 'Local community well used by 50+ families'
    },
    diseaseIdentification: {
      suspectedDisease: 'cholera',
      confirmationStatus: 'suspected',
      labTestsOrdered: ['stool_culture'],
      labResults: ''
    },
    reportDate: new Date().toISOString(),
    onsetDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    hospitalAdmission: {
      required: false
    },
    notes: 'Patient reports consuming water from community well. Multiple similar cases reported in the area.',
    emergencyAlert: false
  };

  try {
    console.log('Testing patient report submission...');
    
    // Submit patient report
    const response = await axios.post(`${baseURL}/reports/patient`, patientData);
    
    if (response.data.success) {
      console.log('✅ Patient report submitted successfully!');
      console.log('Case ID:', response.data.data.caseId);
      console.log('Report ID:', response.data.data._id);
      
      // Test fetching the report
      const fetchResponse = await axios.get(`${baseURL}/reports/patient/${response.data.data._id}`);
      if (fetchResponse.data.success) {
        console.log('✅ Patient report retrieved successfully!');
      }
      
      // Test dashboard stats
      const statsResponse = await axios.get(`${baseURL}/dashboard/stats`);
      if (statsResponse.data.success) {
        console.log('✅ Dashboard stats updated!');
        console.log('Health Cases:', statsResponse.data.data.healthCases);
      }
      
      // Test patient clusters
      const clustersResponse = await axios.get(`${baseURL}/maps/patient-clusters?radius=1000`);
      if (clustersResponse.data.success) {
        console.log('✅ Patient clusters retrieved!');
        console.log('Total clusters:', clustersResponse.data.data.totalClusters);
        console.log('Total cases:', clustersResponse.data.data.totalCases);
      }
      
    } else {
      console.log('❌ Failed to submit patient report:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing patient submission:', error.response?.data || error.message);
  }
};

// Test mobile app format submission
const testMobileAppSubmission = async () => {
  const baseURL = 'http://localhost:5000/api';
  
  // Mobile app format (simplified)
  const mobileData = {
    patientInfo: {
      name: 'John Doe',
      age: '30',
      gender: 'male',
      contactNumber: '+91-9876543210',
    },
    location: {
      coordinates: [72.8777, 19.0760], // Mumbai coordinates [lng, lat]
      address: 'Bandra West, Mumbai',
      district: 'Mumbai',
    },
    healthInfo: {
      symptoms: ['Diarrhea', 'Vomiting', 'Fever'],
      suspectedDisease: 'Cholera',
      severity: 'moderate',
      onsetDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    waterExposure: {
      waterSource: 'well',
      exposureDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      otherExposed: '5',
    },
    additionalNotes: 'Patient reports drinking from community well. Family members also showing symptoms.',
    reportType: 'patient',
    status: 'pending',
    submittedVia: 'mobile_app',
    reportDate: new Date().toISOString(),
  };

  try {
    console.log('\nTesting mobile app format submission...');
    
    const response = await axios.post(`${baseURL}/reports/patient`, mobileData);
    
    if (response.data.success) {
      console.log('✅ Mobile app format submitted successfully!');
      console.log('Case ID:', response.data.data.caseId);
    } else {
      console.log('❌ Failed to submit mobile app format:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing mobile app submission:', error.response?.data || error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🧪 Starting Patient Report Tests...\n');
  
  await testPatientSubmission();
  await testMobileAppSubmission();
  
  console.log('\n✨ Tests completed!');
};

runTests();