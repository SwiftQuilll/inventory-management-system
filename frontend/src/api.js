import axios from 'axios';

// This reads the VITE_API_URL variable from your .env file
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Centralized endpoints mapping directly to your FastAPI backend
export const productAPI = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
};

export const customerAPI = {
  getAll: () => api.get('/customers'),
  create: (data) => api.post('/customers', data),
};

export const orderAPI = {
  getAll: () => api.get('/orders'),
  create: (data) => api.post('/orders', data),
};

export default api;