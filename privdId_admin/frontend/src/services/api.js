import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 15000,
});

export function getApiErrorMessage(error) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || "Request failed";
}

export default api;