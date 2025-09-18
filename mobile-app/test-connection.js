#!/usr/bin/env node

// Test script to verify backend connection from mobile app
const axios = require('axios');
const { API_CONFIG } = require('./src/config/config');

console.log('🔧 Testing Backend Connection...');
console.log('Backend URL:', API_CONFIG.BASE_URL);

async function testConnection() {
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_CONFIG.BASE_URL.replace('/api', '')}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data.message);

    // Test dashboard stats
    console.log('\n2. Testing dashboard stats...');
    const statsResponse = await axios.get(`${API_CONFIG.BASE_URL}/dashboard/stats`);
    console.log('✅ Dashboard stats loaded:', statsResponse.data.success);

    // Test water reports endpoint
    console.log('\n3. Testing water reports endpoint...');
    const waterResponse = await axios.get(`${API_CONFIG.BASE_URL}/reports/water`);
    console.log('✅ Water reports endpoint working:', waterResponse.data.success);

    // Test patient reports endpoint
    console.log('\n4. Testing patient reports endpoint...');
    const patientResponse = await axios.get(`${API_CONFIG.BASE_URL}/reports/patient`);
    console.log('✅ Patient reports endpoint working:', patientResponse.data.success);

    // Test queries endpoint
    console.log('\n5. Testing queries endpoint...');
    const queriesResponse = await axios.get(`${API_CONFIG.BASE_URL}/queries`);
    console.log('✅ Queries endpoint working:', queriesResponse.data.success);

    console.log('\n🎉 All tests passed! Your mobile app is ready to connect to the backend.');
    console.log('\n📱 Next steps:');
    console.log('1. Start your mobile app: npm start');
    console.log('2. Use Expo Go to scan the QR code');
    console.log('3. Submit a test report from the mobile app');
    console.log('4. Check your website dashboard to see the data appear!');

  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Make sure your backend server is running: cd backend && npm start');
      console.log('2. Check if the IP address is correct:', API_CONFIG.BASE_URL);
      console.log('3. Ensure your firewall allows connections on port 5000');
    }
  }
}

testConnection();