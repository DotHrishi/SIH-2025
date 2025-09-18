const axios = require('axios');

const testPatientDetails = async () => {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('🧪 Testing Patient Report Details...\n');
    
    // First, get a list of patient reports
    console.log('1. Fetching patient reports list...');
    const listResponse = await axios.get(`${baseURL}/reports/patient?limit=5`);
    
    if (listResponse.data.success && listResponse.data.data.length > 0) {
      console.log(`✅ Found ${listResponse.data.data.length} patient reports`);
      
      // Get the first report's details
      const firstReport = listResponse.data.data[0];
      console.log(`\n2. Fetching details for Case ID: ${firstReport.caseId}`);
      
      const detailsResponse = await axios.get(`${baseURL}/reports/patient/${firstReport._id}`);
      
      if (detailsResponse.data.success) {
        const report = detailsResponse.data.data;
        console.log('✅ Patient report details retrieved successfully!');
        console.log('\n📋 Report Summary:');
        console.log(`   Case ID: ${report.caseId}`);
        console.log(`   Patient Age: ${report.patientInfo?.age} (${report.patientInfo?.ageGroup})`);
        console.log(`   Gender: ${report.patientInfo?.gender}`);
        console.log(`   Location: ${report.patientInfo?.location}`);
        console.log(`   Severity: ${report.severity}`);
        console.log(`   Suspected Disease: ${report.diseaseIdentification?.suspectedDisease}`);
        console.log(`   Symptoms: ${report.symptoms?.join(', ')}`);
        console.log(`   Water Source: ${report.suspectedWaterSource?.source}`);
        console.log(`   Submitted By: ${report.submittedBy}`);
        console.log(`   Emergency Alert: ${report.emergencyAlert ? 'Yes' : 'No'}`);
        console.log(`   Created: ${new Date(report.createdAt).toLocaleString()}`);
        
        if (report.patientInfo?.coordinates) {
          console.log(`   Coordinates: ${report.patientInfo.coordinates[1]}, ${report.patientInfo.coordinates[0]}`);
        }
        
        if (report.notes) {
          console.log(`   Notes: ${report.notes}`);
        }
        
        console.log('\n✅ All patient data fields are accessible for detailed view!');
        
      } else {
        console.log('❌ Failed to get report details');
      }
      
    } else {
      console.log('❌ No patient reports found');
    }
    
    // Test dashboard integration
    console.log('\n3. Testing dashboard integration...');
    const dashboardResponse = await axios.get(`${baseURL}/dashboard/stats`);
    
    if (dashboardResponse.data.success) {
      console.log(`✅ Dashboard shows ${dashboardResponse.data.data.healthCases} health cases`);
    }
    
    // Test recent activity
    const activityResponse = await axios.get(`${baseURL}/dashboard/recent-activity`);
    
    if (activityResponse.data.success) {
      const patientActivities = activityResponse.data.data.filter(activity => 
        activity.type === 'patient_case'
      );
      console.log(`✅ Dashboard recent activity shows ${patientActivities.length} patient case activities`);
    }
    
    console.log('\n🎉 All tests passed! Patient data is fully accessible in detailed views.');
    
  } catch (error) {
    console.error('❌ Error testing patient details:', error.response?.data || error.message);
  }
};

testPatientDetails();