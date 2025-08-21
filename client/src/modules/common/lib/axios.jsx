import axios from "axios";
import axiosRetry from "axios-retry";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL, // e.g., http://localhost:5000
  withCredentials: true,
  timeout: 300000, // 5 minutes
});

axiosInstance.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"]; // Let browser set multipart boundary
  }
  return config;
});

axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 2000, // 2s, 4s, 6s
  retryCondition: (error) => {
    return (
      error.code === "ECONNRESET" ||
      error.code === "ECONNABORTED" ||
      (error.response?.status >= 500 && error.response?.status <= 599)
    );
  },
});

console.log("Axios base URL:", import.meta.env.VITE_BASE_URL);

export default axiosInstance;