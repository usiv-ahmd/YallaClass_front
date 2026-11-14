// src/store/session.store.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { sessionApi } from "../api/session.api.js";
import { subscribeRemoteSession } from "../providers/mock/realtimeAdapter.js";
import { useAuth } from "./auth.store.jsx";

export function useSessionList() {
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sessionApi.list();
      setSessions(res.data || []);
    } catch (e) {
      setError(e.message || "تعذّر تحميل الجلسات");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const createSession = useCallback(async (payload) => {
    const res = await sessionApi.create(payload);
    setSessions((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sessions, loading, error, refresh, createSession };
}

export function useSession(sessionId) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sessionApi.getById(sessionId);
      setSession(res.data);
    } catch (e) {
      setError(e.message || "تعذّر تحميل الجلسة");
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const lockJoining = useCallback(async (allow) => {
    const res = await sessionApi.lockJoining(sessionId, allow);
    setSession(res.data);
    return res.data;
  }, [sessionId]);

  const updateSettings = useCallback(async (patch) => {
    const res = await sessionApi.updateSettings(sessionId, patch);
    setSession(res.data);
    return res.data;
  }, [sessionId]);

  const kickStudent = useCallback(async (studentId) => {
    const res = await sessionApi.kick(sessionId, studentId);
    setSession(res.data);
    return res.data;
  }, [sessionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!sessionId) return;
    unsubRef.current = subscribeRemoteSession(sessionId, (fresh) => {
      setSession((prev) => (prev ? { ...prev, ...fresh } : fresh));
    });
    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [sessionId]);

  return {
    session,
    loading,
    error,
    refresh,
    lockJoining,
    updateSettings,
    kickStudent,
  };
}