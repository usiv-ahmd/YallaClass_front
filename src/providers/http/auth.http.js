// src/providers/http/auth.http.js
function notConnected(method) {
  return async () => {
    throw {
      status: 0,
      message: `[http:auth] ${method}() — backend not connected (set VITE_API_MODE=mock)`,
    };
  };
}

export const authHttp = {
  register: notConnected("register"),
  login: notConnected("login"),
  logout: notConnected("logout"),
  me: notConnected("me"),
};