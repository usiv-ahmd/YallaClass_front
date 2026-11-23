// src/hooks/usePlayerSession.js
//
// Student (public) session flow. Students have no platform account; they join
// with a 6-character code and a session-scoped participant token. The server is
// the source of truth for gameplay state.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { sessionApi } from "../api/session.api";
import {
  CONNECTION_STATUS,
  LIVE_SYNC_EVENTS,
  SOCKET_EVENTS,
  createPlayerLiveClient,
} from "../realtime";
import { normalizeGameState } from "../adapters/session.adapter.js";
import { buildJoinPayload } from "../adapters/session.adapter.js";

const STORAGE_PREFIX = "yalla-class:player:";

export function storePlayerSeat(joinCode, participant) {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + String(joinCode).toUpperCase(),
      JSON.stringify({
        participantToken: participant.participantToken,
        participant,
      })
    );
  } catch {
    // Storage can be unavailable; the join still works for this tab.
  }
}

export function loadStoredPlayer(joinCode) {
  try {
    const raw = localStorage.getItem(
      STORAGE_PREFIX + String(joinCode).toUpperCase()
    );
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStoredPlayer(joinCode) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + String(joinCode).toUpperCase());
  } catch {
    // Ignore storage errors.
  }
}

export function usePlayerSession(joinCode) {
  const code = String(joinCode || "").trim().toUpperCase();
  const [publicSession, setPublicSession] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [connection, setConnection] = useState(CONNECTION_STATUS.CONNECTING);
  const [clock, setClock] = useState(() => Date.now());
  const [serverOffset, setServerOffset] = useState(0);
  const [kicked, setKicked] = useState(false);

  const clientRef = useRef(null);
  const syncTimerRef = useRef(null);

  const applyState = useCallback((raw) => {
    const state = normalizeGameState(raw);

    if (!state) return;

    setGame(state);

    if (state.serverTime) {
      const serverTime = new Date(state.serverTime).getTime();

      if (Number.isFinite(serverTime)) {
        setServerOffset(serverTime - Date.now());
      }
    }

    setLoading(false);
  }, []);

  const scheduleSync = useCallback(() => {
    if (syncTimerRef.current) return;

    syncTimerRef.current = setTimeout(() => {
      syncTimerRef.current = null;
      clientRef.current?.emit(SOCKET_EVENTS.SYNC).catch(() => {});
    }, 350);
  }, []);

  const init = useCallback(async () => {
    if (!code) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const stored = loadStoredPlayer(code);

    try {
      if (stored?.participantToken) {
        const res = await sessionApi.reconnect(code, stored.participantToken);
        setPublicSession(res.data.session);
        setParticipant(res.data.participant);
        storePlayerSeat(code, res.data.participant);
      } else {
        const res = await sessionApi.getByCode(code);
        setPublicSession(res.data);
      }
    } catch {
      if (stored) clearStoredPlayer(code);
      setParticipant(null);

      try {
        const res = await sessionApi.getByCode(code);
        setPublicSession(res.data);
      } catch (e2) {
        setError(e2.message || "الجلسة مش موجودة");
      }
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init();
  }, [init]);

  useEffect(() => {
    if (!code || !participant?.participantToken) return undefined;

    let disposed = false;
    let client = null;

    try {
      client = createPlayerLiveClient({
        joinCode: code,
        participantToken: participant.participantToken,
        onStatus: (status, extra) => {
          if (disposed) return;
          setConnection(status);

          if (status === CONNECTION_STATUS.ERROR && extra?.error) {
            setActionError(extra.error.message);
          }
        },
      });
    } catch (error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConnection(CONNECTION_STATUS.ERROR);
      setActionError(error.message || "تعذّر الاتصال بالجلسة");
      return undefined;
    }

    clientRef.current = client;

    const unsubscribers = [
      client.on(SOCKET_EVENTS.GAME_STATE, applyState),
      client.on("game:error", (liveError) => {
        if (!disposed) setActionError(liveError.message);
      }),
      client.on(SOCKET_EVENTS.SESSION_KICKED, () => {
        if (disposed) return;
        setKicked(true);
        clearStoredPlayer(code);
        client.disconnect();
      }),
    ];

    for (const event of LIVE_SYNC_EVENTS) {
      unsubscribers.push(client.on(event, scheduleSync));
    }

    const periodic = setInterval(() => {
      if (client.connected) {
        client.emit(SOCKET_EVENTS.SYNC).catch(() => {});
      }
    }, 12000);

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
  }, [code, participant?.participantToken, applyState, scheduleSync]);

  const isLive = game?.status === "LIVE" || game?.status === "PAUSED";

  useEffect(() => {
    if (!isLive) return undefined;

    const interval = setInterval(() => setClock(Date.now()), 250);
    return () => clearInterval(interval);
  }, [isLive]);

  const join = useCallback(
    async (payload = {}) => {
      setError(null);
      setActionError(null);

      try {
        const request = buildJoinPayload(payload);
        const res = await sessionApi.join({ code, ...request });
        storePlayerSeat(code, res.data.participant);
        setPublicSession(res.data.session);
        setParticipant(res.data.participant);
        return res.data;
      } catch (e) {
        setError(e.message || "تعذّر الانضمام للجلسة");
        throw e;
      }
    },
    [code]
  );

  const answer = useCallback(
    async (optionId) => {
      const client = clientRef.current;
      const question = game?.question;

      if (!client || !question || !optionId) return null;

      setActionError(null);

      try {
        const data = await client.emit(SOCKET_EVENTS.ANSWER_SUBMIT, {
          questionId: question.id,
          optionId,
        });
        await client.emit(SOCKET_EVENTS.SYNC).catch(() => {});
        return data;
      } catch (e) {
        setActionError(e.message || "تعذّر إرسال الإجابة");
        return null;
      }
    },
    [game?.question]
  );

  const selectTarget = useCallback(async (targetParticipantId) => {
    const client = clientRef.current;

    if (!client || !targetParticipantId) return null;

    setActionError(null);

    try {
      const data = await client.emit(SOCKET_EVENTS.SELECT_TARGET, {
        targetParticipantId,
      });
      await client.emit(SOCKET_EVENTS.SYNC).catch(() => {});
      return data;
    } catch (e) {
      setActionError(e.message || "تعذّر اختيار الهدف");
      return null;
    }
  }, []);

  const leave = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    clearStoredPlayer(code);
    setParticipant(null);
    setGame(null);
  }, [code]);

  const remainingMs = useMemo(() => {
    if (!game) return null;

    if (game.status === "PAUSED") {
      return game.remainingTimeMs ?? null;
    }

    if (!game.phaseEndsAt) {
      return game.remainingTimeMs ?? null;
    }

    const end = new Date(game.phaseEndsAt).getTime();

    if (!Number.isFinite(end)) return game.remainingTimeMs ?? null;

    return Math.max(0, end - (clock + serverOffset));
  }, [game, clock, serverOffset]);

  return {
    code,
    publicSession,
    participant,
    game,
    loading,
    error,
    actionError,
    clearActionError: () => setActionError(null),
    connection,
    remainingMs,
    kicked,
    join,
    answer,
    selectTarget,
    leave,
  };
}
