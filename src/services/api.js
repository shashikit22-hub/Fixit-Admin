import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://fixit-backend-ejj1.onrender.com/api'
    : '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fixit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('fixit_token');
      localStorage.removeItem('fixit_user');
      window.location.href = import.meta.env.BASE_URL + '#/login';
    }
    return Promise.reject(error);
  }
);

export default api;
