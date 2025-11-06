// src/services/api.js
import axios from "axios";

export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8080";

// Optional: quick sanity check in the console
// console.log("API_BASE_URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,              // <-- important if you use cookies
  headers: { "Content-Type": "application/json" },
});

// Attach Bearer token if you decide to use one (cookie auth won’t need this)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Make error messages more informative
function toErrorMessage(error, fallback = "Request failed") {
  const status = error?.response?.status;
  const statusText = error?.response?.statusText;
  const serverMsg =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  return status
    ? `HTTP ${status} ${statusText || ""} – ${serverMsg || fallback}`.trim()
    : serverMsg || fallback;
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(new Error(toErrorMessage(error)));
  }
);

//
// 🌐 PRODUCT ENDPOINTS
//
export const productAPI = {
  async getAllProducts() {
    const { data } = await api.get("/api/products");
    return data; // array from your backend
  },

  async getProductById(id) {
    const { data } = await api.get(`/api/products/${id}`);
    return data;
  },

  async createProduct(productData) {
    const { data } = await api.post("/api/products", productData);
    return data;
  },

  async updateProduct(id, productData) {
    const { data } = await api.put(`/api/products/${id}`, productData);
    return data;
  },

  async deleteProduct(id) {
    const { data } = await api.delete(`/api/products/${id}`);
    return data;
  },

  async updateStock(id, operation, amount) {
    const { data } = await api.post(`/api/products/${id}/stock`, {
      operation, // "add", "remove", or "set"
      amount,
    });
    return data;
  },
};

//
// ✅ Health check
//
export async function healthCheck() {
  const { data } = await api.get("/api/ping");
  return data;
}

export default api;
