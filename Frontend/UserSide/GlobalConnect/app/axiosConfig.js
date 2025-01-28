// axiosConfig.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://192.168.18.105:3000',  // Replace with your backend IP address and port
});

export default axiosInstance;
