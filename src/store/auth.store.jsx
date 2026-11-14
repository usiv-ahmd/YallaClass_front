// src/store/auth.store.js
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = useCallback(async (payload) => {
    setError(null);
    try {
      const res = await authApi.login(payload);
      setUser(res.data.user);
      setToken(res.data.token);
      return res.data.user;
    } catch (e) {
      setError(e.message || "فشل تسجيل الدخول");
      throw e;
    }
  }, []);

  const register = useCallback(async (payload) => {
    setError(null);
    try {
      const res = await authApi.register(payload);
      setUser(res.data.user);
      setToken(res.data.token);
      return res.data.user;
    } catch (e) {
      setError(e.message || "فشل التسجيل");
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
    }
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authApi.me();
        if (cancelled) return;
        setUser(res?.data?.user ?? null);
        setToken(localStorage.getItem("yalla-class:token"));
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    error,
    isReady: !loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  }), [user, token, loading, error, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("[useAuth] must be used inside <AuthProvider>");
  }
  return ctx;
}