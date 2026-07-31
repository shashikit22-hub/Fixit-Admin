import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://tinyfix-backend-ejj1.onrender.com/api'
    : '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tinyfix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('tinyfix_token');
      localStorage.removeItem('tinyfix_user');
      window.location.href = import.meta.env.BASE_URL + '#/login';
    }
    return Promise.reject(error);
  }
);

export const API_BASE = import.meta.env.PROD
  ? 'https://tinyfix-backend-ejj1.onrender.com'
  : '';

/** Convert a media path to full URL. Handles local paths (/uploads/...) and external URLs. */
export const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_BASE + url;
};

export default api;
