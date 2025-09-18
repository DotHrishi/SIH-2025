// Configuration file for the mobile app

// Backend API Configuration
export const API_CONFIG = {
  // For local development (computer IP address)
  // Replace 'localhost' with your computer's IP address when testing on physical device
  // Example: 'http://192.168.1.100:5000/api'
  BASE_URL: 'http://10.189.179.57:5000/api',
  
  // For production deployment
  // PRODUCTION_URL: 'https://your-domain.com/api',
  
  TIMEOUT: 10000, // 10 seconds
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Jal Drishti',
  VERSION: '1.0.0',
  DESCRIPTION: 'Water Health Surveillance System',
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_LATITUDE: 25.4670,
  DEFAULT_LONGITUDE: 91.3662,
  DEFAULT_ZOOM: 13,
  TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ATTRIBUTION: '© OpenStreetMap contributors',
};

export default {
  API_CONFIG,
  APP_CONFIG,
  MAP_CONFIG,
};