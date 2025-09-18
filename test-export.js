const axios = require('axios');
const fs = require('fs');

async function testExports() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('Testing CSV export...');
    const csvResponse = await axios.get(`${baseURL}/analytics/export/csv?type=cases`, {
      responseType: 'text'
    });
    console.log('CSV Export Status:', csvResponse.status);
    console.log('CSV Content Preview:', csvResponse.data.substring(0, 100) + '...');
    
    console.log('\nTesting Excel export...');
    const excelResponse = await axios.get(`${baseURL}/analytics/export/excel?type=cases`, {
      responseType: 'arraybuffer'
    });
    console.log('Excel Export Status:', excelResponse.status);
    console.log('Excel Buffer Length:', excelResponse.data.length);
    
    console.log('\nTesting PDF export...');
    const pdfResponse = await axios.get(`${baseURL}/analytics/export/pdf?type=cases`, {
      responseType: 'arraybuffer'
    });
    console.log('PDF Export Status:', pdfResponse.status);
    console.log('PDF Buffer Length:', pdfResponse.data.length);
    
    console.log('\nAll export endpoints working successfully!');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('Server not running. Please start the backend server first.');
    } else {
      console.error('Export test failed:', error.response?.data || error.message);
    }
  }
}

testExports();