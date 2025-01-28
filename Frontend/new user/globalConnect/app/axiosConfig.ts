import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://192.168.18.105:3000',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
