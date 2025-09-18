import axios from 'axios';

import { API_CONFIG } from '../config/config';

// Configure base URL - update this in config/config.js
const BASE_URL = API_CONFIG.BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Water Quality Reports API
export const waterReportsAPI = {
  create: (data) => api.post('/reports/water', data),
  getAll: (params) => api.get('/reports/water', { params }),
  getById: (id) => api.get(`/reports/water/${id}`),
  update: (id, data) => api.put(`/reports/water/${id}`, data),
  delete: (id) => api.delete(`/reports/water/${id}`),
};

// Patient Reports API
export const patientReportsAPI = {
  create: (data) => api.post('/reports/patient', data),
  getAll: (params) => api.get('/reports/patient', { params }),
  getById: (id) => api.get(`/reports/patient/${id}`),
  update: (id, data) => api.put(`/reports/patient/${id}`, data),
  delete: (id) => api.delete(`/reports/patient/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

// Queries API
export const queriesAPI = {
  create: (data) => api.post('/queries', data),
  getAll: (params) => api.get('/queries', { params }),
  getFAQ: () => api.get('/queries/faq'),
};

// File Upload API
export const filesAPI = {
  upload: (formData) => api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default api;