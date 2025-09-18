// Quick test to see if backend is running
const http = require('http');

console.log('🔍 Testing backend connection...');

const options = {
  hostname: '10.189.179.57',
  port: 5000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log('✅ Backend is running!');
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (err) => {
  console.log('❌ Backend is NOT running!');
  console.log('Error:', err.message);
  console.log('\n🔧 To fix this:');
  console.log('1. Open a new terminal');
  console.log('2. cd C:\\SIH2025');
  console.log('3. node start-backend.js');
});

req.on('timeout', () => {
  console.log('❌ Connection timeout - backend is not responding');
  req.destroy();
});

req.end();