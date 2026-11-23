// src/config.js

// Backend development port verified from src/config/env.js (PORT default 4000).
export const CONFIG = {
  API_BASE_URL: (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"
  ).replace(/\/+$/, ""),
  API_MODE: import.meta.env.VITE_API_MODE || "mock",
  // Configuration only for now; Socket.IO is not wired up in Phase 1.
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || "http://localhost:4000",
};
