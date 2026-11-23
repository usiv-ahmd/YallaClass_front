// src/store/session.store.jsx
import { useCallback, useEffect, useState } from "react";

import { sessionApi } from "../api/session.api.js";
import { useAuth } from "./auth.store.jsx";

export function useSessionList({ status, search, quiz } = {}) {
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await sessionApi.list({
        status: status && status !== "ALL" ? status : undefined,
        search: search?.trim() || undefined,
        quiz: quiz || undefined,
      });
      setSessions(res.data || []);
    } catch (e) {
      setError(e.message || "تعذّر تحميل الجلسات");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, status, search, quiz]);

  const createSession = useCallback(async (payload) => {
    const res = await sessionApi.create(payload);
    setSessions((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { sessions, loading, error, refresh, createSession };
}
