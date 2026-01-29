import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Doctors API
export const doctorsAPI = {
  getAll: () => api.get('/api/doctors'),
  getById: (id) => api.get(`/api/doctors/${id}`),
  create: (data) => api.post('/api/doctors', data),
};

// Slots API
export const slotsAPI = {
  getAll: (params) => api.get('/api/slots', { params }),
  getById: (id) => api.get(`/api/slots/${id}`),
  generate: (data) => api.post('/api/slots/generate', data),
};

// Tokens API
export const tokensAPI = {
  getAll: (params) => api.get('/api/tokens', { params }),
  getById: (id) => api.get(`/api/tokens/${id}`),
  create: (data) => api.post('/api/tokens', data),
  emergency: (data) => api.post('/api/tokens/emergency', data),
  cancel: (id) => api.patch(`/api/tokens/${id}/cancel`),
  noShow: (id) => api.post(`/api/tokens/${id}/no-show`),
};

// Simulation API
export const simulationAPI = {
  run: (data) => api.post('/api/simulation/run', data),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
