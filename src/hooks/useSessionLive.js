// src/hooks/useSessionLive.js
//
// Teacher live-session state. REST loads the canonical session/lobby; the
// realtime client owns every gameplay transition afterwards. Server events are
// treated as hints to request a full `game:sync`, so the UI never merges
// partial payloads by hand.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { sessionApi } from "../api/session.api";
import { useAuth } from "../store/auth.store.jsx";
import {
  CONNECTION_STATUS,
  LIVE_SYNC_EVENTS,
  SOCKET_EVENTS,
  createTeacherLiveClient,
} from "../realtime";
import {
  applyGameStateToSession,
  normalizeGameState,
  remainingMsFrom,
} from "../adapters/session.adapter.js";

const SYNC_THROTTLE_MS = 350;
const PERIODIC_SYNC_MS = 12000;

export function useSessionLive(sessionId) {
  const { token } = useAuth();
  const [session, setSession] = useState(null);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [connection, setConnection] = useState(CONNECTION_STATUS.CONNECTING);
  const [clock, setClock] = useState(() => Date.now());
  const [serverOffset, setServerOffset] = useState(0);

  const clientRef = useRef(null);
  const syncTimerRef = useRef(null);

  const applyState = useCallback((raw) => {
    const state = normalizeGameState(raw);

    if (!state) return;

    setGame(state);
    setSession((prev) =>
      prev ? applyGameStateToSession(prev, state) : prev
    );

    if (state.serverTime) {
      const serverTime = new Date(state.serverTime).getTime();

      if (Number.isFinite(serverTime)) {
        setServerOffset(serverTime - Date.now());
      }
    }

    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!sessionId) return;

    setError(null);

    try {
      const res = await sessionApi.getLobby(sessionId);
      setSession(res.data);
    } catch (e) {
      setError(e.message || "تعذّر تحميل الجلسة");
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const scheduleSync = useCallback(() => {
    if (syncTimerRef.current) return;

    syncTimerRef.current = setTimeout(() => {
      syncTimerRef.current = null;
      clientRef.current?.emit(SOCKET_EVENTS.SYNC).catch(() => {});
    }, SYNC_THROTTLE_MS);
  }, []);

  useEffect(() => {
    if (!sessionId || !token) return undefined;

    let disposed = false;
    let client = null;

    try {
      client = createTeacherLiveClient({
        token,
        sessionId,
        onStatus: (status, extra) => {
          if (disposed) return;
          setConnection(status);

          if (status === CONNECTION_STATUS.ERROR && extra?.error) {
            setError(extra.error.message);
          }
        },
      });
    } catch (e) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(e.message || "تعذّر الاتصال بالجلسة المباشرة");
      setConnection(CONNECTION_STATUS.ERROR);
      setLoading(false);
      return undefined;
    }

    clientRef.current = client;

    const unsubscribers = [
      client.on(SOCKET_EVENTS.GAME_STATE, applyState),
      client.on("game:error", (liveError) => {
        if (!disposed) setActionError(liveError.message);
      }),
      client.on(SOCKET_EVENTS.JOIN_LOCK_UPDATED, (payload) => {
        if (disposed || typeof payload?.joinOpen !== "boolean") return;
        setSession((prev) =>
          prev ? { ...prev, joinOpen: payload.joinOpen } : prev
        );
      }),
      client.on(SOCKET_EVENTS.GAME_STARTED, () => {
        if (disposed) return;
        setSession((prev) => (prev ? { ...prev, joinOpen: false } : prev));
      }),
      client.on(SOCKET_EVENTS.GAME_FINISHED, () => {
        if (disposed) return;
        setSession((prev) => (prev ? { ...prev, joinOpen: false } : prev));
      }),
    ];

    for (const event of LIVE_SYNC_EVENTS) {
      unsubscribers.push(client.on(event, scheduleSync));
    }

    const periodic = setInterval(() => {
      if (client.connected) {
        client.emit(SOCKET_EVENTS.SYNC).catch(() => {});
      }
    }, PERIODIC_SYNC_MS);

    return () => {
      disposed = true;
      clearInterval(periodic);

      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }

      for (const unsubscribe of unsubscribers) unsubscribe();
      client.disconnect();
      clientRef.current = null;
    };
  }, [sessionId, token, applyState, scheduleSync]);

  const isLive = session?.status === "LIVE" || session?.status === "PAUSED";

  useEffect(() => {
    if (!isLive) return undefined;

    const interval = setInterval(() => setClock(Date.now()), 250);
    return () => clearInterval(interval);
  }, [isLive]);

  const runAction = useCallback(
    async (name, event, payload = {}) => {
      const client = clientRef.current;

      if (!client) {
        setActionError("الاتصال بالجلسة مش جاهز، استنى لحظة وحاول تاني.");
        return null;
      }

      setBusyAction(name);
      setActionError(null);

      try {
        const data = await client.emit(event, payload);
        await client.emit(SOCKET_EVENTS.SYNC).catch(() => {});
        return data;
      } catch (e) {
        setActionError(e.message || "تعذّر تنفيذ الإجراء");
        return null;
      } finally {
        setBusyAction(null);
      }
    },
    []
  );

  const start = useCallback(
    () => runAction("start", SOCKET_EVENTS.START),
    [runAction]
  );
  const pause = useCallback(
    () => runAction("pause", SOCKET_EVENTS.PAUSE),
    [runAction]
  );
  const resume = useCallback(
    () => runAction("resume", SOCKET_EVENTS.RESUME),
    [runAction]
  );
  const reveal = useCallback(
    () => runAction("reveal", SOCKET_EVENTS.REVEAL),
    [runAction]
  );
  const next = useCallback(
    () => runAction("next", SOCKET_EVENTS.NEXT),
    [runAction]
  );
  const skip = useCallback(
    () => runAction("skip", SOCKET_EVENTS.SKIP),
    [runAction]
  );
  const finish = useCallback(
    () => runAction("finish", SOCKET_EVENTS.FINISH),
    [runAction]
  );
  const setJoinOpen = useCallback(
    (joinOpen) =>
      runAction("joinLock", SOCKET_EVENTS.JOIN_LOCK, { joinOpen: Boolean(joinOpen) }),
    [runAction]
  );
  const updateCommandSettings = useCallback(
    (commandSettings) =>
      runAction("commandSettings", SOCKET_EVENTS.COMMAND_SETTINGS, {
        commandSettings,
      }),
    [runAction]
  );
  const updatePhaseSettings = useCallback(
    (phaseSettings) =>
      runAction("phaseSettings", SOCKET_EVENTS.PHASE_SETTINGS, {
        phaseSettings,
      }),
    [runAction]
  );
  const kick = useCallback(
    (participantId) =>
      runAction("kick", SOCKET_EVENTS.PARTICIPANT_KICK, { participantId }),
    [runAction]
  );

  const remainingMs = useMemo(() => {
    if (!session) return null;

    if (session.status === "PAUSED") {
      return session.remainingTimeMs ?? null;
    }

    if (!session.phaseEndsAt) {
      return session.remainingTimeMs ?? null;
    }

    return remainingMsFrom(session.phaseEndsAt, clock, serverOffset);
  }, [session, clock, serverOffset]);

  return {
    session,
    game,
    loading,
    error,
    actionError,
    clearActionError: () => setActionError(null),
    busyAction,
    connection,
    remainingMs,
    refresh,
    start,
    pause,
    resume,
    reveal,
    next,
    skip,
    finish,
    setJoinOpen,
    updateCommandSettings,
    updatePhaseSettings,
    kick,
  };
}
