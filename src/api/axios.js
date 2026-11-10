import axios from 'axios';
import { toast } from 'react-toastify';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://resourceful-kindness-production-8a18.up.railway.app/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => {
    // El servidor puede guardar algo con una advertencia (ej. la imagen no se pudo subir)
    if (response.data?.aviso) toast.warning(response.data.aviso, { autoClose: 7000 });
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;