// src/store/auth.store.js
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authApi } from "../api/auth.api";
import { TOKEN_STORAGE_KEY, setUnauthorizedHandler } from "../api/httpClient";
import { normalizeUser } from "../utils/user";

const AuthContext = createContext(null);

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode / disabled cookies). Auth still
    // works for the current tab, it just cannot survive a reload.
  }
}

export function AuthProvider({ children }) {
  const [initialToken] = useState(() => readStoredToken());
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(initialToken);
  // With no stored token there is nothing to restore, so the app is ready
  // immediately and the bootstrap effect can stay side-effect free.
  const [loading, setLoading] = useState(() => Boolean(initialToken));
  const [error, setError] = useState(null);

  // Invalidates in-flight restore results when login/logout happens first.
  const epochRef = useRef(0);

  const clearAuth = useCallback(() => {
    writeStoredToken(null);
    setUser(null);
    setToken(null);
  }, []);

  const applySession = useCallback((nextToken, nextUser) => {
    writeStoredToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setLoading(false);
  }, []);

  // A 401 from any provider clears local state. The HTTP client itself never
  // redirects, so this cannot create a redirect loop.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuth();
    });

    return () => setUnauthorizedHandler(null);
  }, [clearAuth]);

  const login = useCallback(
    async (payload) => {
      epochRef.current += 1;
      setError(null);

      try {
        const res = await authApi.login(payload);
        const nextToken = res?.data?.token ?? null;
        const nextUser = normalizeUser(res?.data?.user);

        if (!nextToken || !nextUser) {
          throw new Error("Invalid login response from server");
        }

        applySession(nextToken, nextUser);
        return nextUser;
      } catch (e) {
        setError(e.message || "فشل تسجيل الدخول");
        setLoading(false);
        throw e;
      }
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      epochRef.current += 1;
      setError(null);

      try {
        const res = await authApi.register(payload);
        const nextToken = res?.data?.token ?? null;
        const nextUser = normalizeUser(res?.data?.user);

        applySession(nextToken, nextUser);
        return nextUser;
      } catch (e) {
        setError(e.message || "فشل التسجيل");
        setLoading(false);
        throw e;
      }
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    epochRef.current += 1;

    try {
      await authApi.logout();
    } catch {
      // Logging out locally must succeed even if the backend call fails.
    }

    clearAuth();
    setError(null);
    setLoading(false);
  }, [clearAuth]);

  useEffect(() => {
    const storedToken = initialToken;

    if (!storedToken) {
      return;
    }

    const epoch = epochRef.current + 1;
    epochRef.current = epoch;
    let cancelled = false;

    (async () => {
      try {
        const res = await authApi.me();

        if (cancelled || epochRef.current !== epoch) {
          return;
        }

        const nextUser = normalizeUser(res?.data?.user);

        if (!nextUser) {
          clearAuth();
          return;
        }

        setUser(nextUser);
        setToken(storedToken);
      } catch {
        if (cancelled || epochRef.current !== epoch) {
          return;
        }

        // Expired/invalid JWT: drop the token so we do not retry forever.
        clearAuth();
      } finally {
        if (!cancelled && epochRef.current === epoch) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearAuth, initialToken]);

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
