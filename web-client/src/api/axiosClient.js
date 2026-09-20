import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach token from local storage if present
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('solarix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract clean error message from FAT service responses
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'An unexpected network error occurred.';
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        message = error.response.data;
      } else if (error.response.data.message) {
        message = error.response.data.message;
      } else if (error.response.data.error) {
        message = `${error.response.data.error}: ${error.response.data.message || ''}`;
      } else if (error.response.data.title) {
        message = error.response.data.title;
      }
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
