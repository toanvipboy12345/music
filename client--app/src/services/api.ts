import axios from 'axios';

const API_URL = 'http://localhost:3000/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate', // Ngăn cache
    'Pragma': 'no-cache', // Hỗ trợ trình duyệt cũ
    'Expires': '0' // Ngăn cache
  },
});

export default api;