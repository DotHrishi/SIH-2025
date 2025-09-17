import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Analytics API methods
export const analyticsAPI = {
  getCases: (params) => api.get('/analytics/cases', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
  getSummary: (params) => api.get('/analytics/summary', { params }),
  getWaterQuality: (params) => api.get('/analytics/water-quality', { params }),
  exportCSV: (params) => api.get('/analytics/export/csv', { 
    params, 
    responseType: 'blob' 
  }),
  exportExcel: (params) => api.get('/analytics/export/excel', { 
    params, 
    responseType: 'blob' 
  }),
  getCorrelation: (params) => api.get('/analytics/correlation', { params }),
};

// Alerts API methods
export const alertsAPI = {
  getAlerts: (params) => api.get('/alerts', { params }),
  getAlertById: (id) => api.get(`/alerts/${id}`),
  createAlert: (data) => api.post('/alerts', data),
  updateAlertStatus: (id, data) => api.put(`/alerts/${id}/status`, data),
  assignTeam: (id, data) => api.put(`/alerts/${id}/assign-team`, data),
  escalateAlert: (id, data) => api.put(`/alerts/${id}/escalate`, data),
  addAction: (id, data) => api.post(`/alerts/${id}/actions`, data),
  generateAutomatic: (data) => api.post('/alerts/generate-automatic', data),
  getStatistics: (params) => api.get('/alerts/statistics', { params }),
  deleteAlert: (id) => api.delete(`/alerts/${id}`),
};

// Directory API methods
export const directoryAPI = {
  getHealthCenters: (params) => api.get('/directory/centers', { params }),
  getHealthCenterById: (id) => api.get(`/directory/centers/${id}`),
  createHealthCenter: (data) => api.post('/directory/centers', data),
  updateHealthCenter: (id, data) => api.put(`/directory/centers/${id}`, data),
  updateContactInfo: (id, data) => api.put(`/directory/centers/${id}/contact`, data),
  searchHealthCenters: (params) => api.get('/directory/centers/search', { params }),
  getHealthCentersByDistrict: (district) => api.get(`/directory/centers/by-district/${district}`),
  updateResources: (id, data) => api.put(`/directory/centers/${id}/resources`, data),
  getDirectoryStatistics: (params) => api.get('/directory/statistics', { params }),
  deleteHealthCenter: (id) => api.delete(`/directory/centers/${id}`),
  updateLastContact: (id, data) => api.put(`/directory/centers/${id}/last-contact`, data),
  getNearbyHealthCenters: (params) => api.get('/directory/centers/nearby', { params }),
};

export default api;