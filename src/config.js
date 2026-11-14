// src/config.js
export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  API_MODE: import.meta.env.VITE_API_MODE || "mock",
};