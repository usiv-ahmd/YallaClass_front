// src/realtime/mockClient.js
//
// Mock-mode counterpart of the Socket.IO client. It exposes the same interface
// and emits the same `game:state` snapshots, but is backed by the in-browser
// session engine and BroadcastChannel updates.
import { db } from "../providers/mock/db";
import { broadcast } from "../providers/mock/broadcast";
import { sessionMock } from "../providers/mock/session.mock";
import { normalizeGameState } from "../adapters/session.adapter.js";
import { CONNECTION_STATUS } from "./events";
import { normalizeLiveError } from "./errors";

function createListenerStore() {
  const listeners = new Map();

  return {
    dispatch(event, payload) {
      for (const handler of listeners.get(event) || []) {
        handler(payload);
      }
    },
    on(event, handler) {
      const handlers = listeners.get(event) || new Set();
      handlers.add(handler);
      listeners.set(event, handlers);
      return () => {
        handlers.delete(handler);
        if (handlers.size === 0) listeners.delete(event);
      };
    },
    clear() {
      listeners.clear();
    },
  };
}

function createStatusStore(onStatus) {
  const listeners = new Set();
  let status = CONNECTION_STATUS.CONNECTING;

  return {
    set(next, extra = {}) {
      status = next;
      onStatus?.(next, extra);
      for (const listener of listeners) listener(next, extra);
    },
    on(handler) {
      listeners.add(handler);
      handler(status);
      return () => listeners.delete(handler);
    },
    get() {
      return status;
    },
    clear() {
      listeners.clear();
    },
  };
}

export function createMockTeacherClient({ sessionId, onStatus }) {
  const events = createListenerStore();
  const status = createStatusStore(onStatus);
  let closed = false;

  async function refresh() {
    db.reload();
    const response = await sessionMock.getLiveState(sessionId);
    const state = normalizeGameState(response.data);

    if (!closed) {
      events.dispatch("game:state", state);
      status.set(CONNECTION_STATUS.CONNECTED);
    }

    return state;
  }

  const unsubscribe = broadcast.on("session:updated", (payload) => {
    if (payload?.sessionId !== sessionId) return;
    refresh().catch((error) => {
      events.dispatch("game:error", normalizeLiveError(error));
      status.set(CONNECTION_STATUS.ERROR, { error });
    });
  });

  const actions = {
    "game:sync": () => refresh(),
    "game:start": () => sessionMock.start(sessionId),
    "game:pause": () => sessionMock.pause(sessionId),
    "game:resume": () => sessionMock.resume(sessionId),
    "game:finish": () => sessionMock.finish(sessionId),
    "game:reveal": () => sessionMock.reveal(sessionId),
    "game:next": () => sessionMock.next(sessionId),
    "game:skip": () => sessionMock.skip(sessionId),
    "game:join-lock": (payload) =>
      sessionMock.lockJoining(sessionId, Boolean(payload?.joinOpen)),
    "game:command-settings": (payload) =>
      sessionMock.updateCommandSettings(sessionId, payload?.commandSettings),
    "game:phase-settings": (payload) =>
      sessionMock.updatePhaseSettings(sessionId, payload?.phaseSettings),
    "participant:kick": (payload) =>
      sessionMock.kickParticipant(sessionId, payload?.participantId),
  };

  refresh().catch((error) => {
    status.set(CONNECTION_STATUS.ERROR, { error: normalizeLiveError(error) });
    events.dispatch("game:error", normalizeLiveError(error));
  });

  return {
    mode: "mock",

    on: events.on,
    onStatus: status.on,

    async emit(event, payload = {}) {
      const action = actions[event];

      if (!action) {
        throw normalizeLiveError(null, `الإجراء ${event} غير مدعوم في وضع المحاكاة.`);
      }

      try {
        const response = await action(payload);

        if (event === "game:join-lock") {
          events.dispatch("session:join-lock-updated", {
            sessionId,
            joinOpen: Boolean(payload?.joinOpen),
          });
        }

        if (event === "game:start" || event === "game:finish") {
          events.dispatch("session:join-lock-updated", {
            sessionId,
            joinOpen: false,
          });
        }

        if (event !== "game:sync") {
          await refresh();
        }

        return response?.data ?? null;
      } catch (error) {
        const normalized = normalizeLiveError(error);
        events.dispatch("game:error", normalized);
        throw normalized;
      }
    },

    disconnect() {
      closed = true;
      unsubscribe();
      events.clear();
      status.clear();
    },

    get connected() {
      return status.get() === CONNECTION_STATUS.CONNECTED;
    },

    get status() {
      return status.get();
    },
  };
}

export function createMockPlayerClient({ joinCode, participantToken, onStatus }) {
  const events = createListenerStore();
  const status = createStatusStore(onStatus);
  const cleanCode = String(joinCode || "").trim().toUpperCase();
  let closed = false;
  let sessionId = null;
  let participantId = null;

  function resolveIdentity() {
    db.reload();
    const session = db.sessions.findByCode(cleanCode);

    if (!session) {
      throw normalizeLiveError({ code: "SESSION_NOT_FOUND" });
    }

    const participant = (session.participants || []).find(
      (item) => item.participantToken === participantToken
    );

    if (!participant) {
      throw normalizeLiveError({ code: "INVALID_PARTICIPANT_TOKEN" });
    }

    if (participant.status === "KICKED") {
      throw normalizeLiveError({ code: "PARTICIPANT_KICKED" });
    }

    sessionId = session.id;
    participantId = participant.id;
  }

  async function refresh() {
    if (closed) return null;

    db.reload();
    const session = db.sessions.findById(sessionId);

    if (!session) {
      throw normalizeLiveError({ code: "SESSION_NOT_FOUND" });
    }

    const participant = (session.participants || []).find(
      (item) => item.id === participantId
    );

    if (!participant || participant.status === "KICKED") {
      events.dispatch("session:kicked", {
        sessionId,
        participantId,
        reason: "KICKED",
      });
      status.set(CONNECTION_STATUS.DISCONNECTED, { reason: "kicked" });
      return null;
    }

    const response = await sessionMock.getLiveState(sessionId, {
      participantId,
    });
    const state = normalizeGameState(response.data);

    if (!closed) {
      events.dispatch("game:state", state);
      status.set(CONNECTION_STATUS.CONNECTED);
    }

    return state;
  }

  let unsubscribe = () => {};

  try {
    resolveIdentity();

    unsubscribe = broadcast.on("session:updated", (payload) => {
      if (payload?.sessionId !== sessionId) return;
      refresh().catch((error) => {
        events.dispatch("game:error", normalizeLiveError(error));
        status.set(CONNECTION_STATUS.ERROR, { error });
      });
    });

    refresh().catch((error) => {
      status.set(CONNECTION_STATUS.ERROR, { error: normalizeLiveError(error) });
      events.dispatch("game:error", normalizeLiveError(error));
    });
  } catch (error) {
    const normalized = normalizeLiveError(error);
    status.set(CONNECTION_STATUS.ERROR, { error: normalized });
    events.dispatch("game:error", normalized);
  }

  const actions = {
    "game:sync": () => refresh(),
    "answer:submit": (payload) => sessionMock.submitAnswer(participantId, payload),
    "command:select-target": (payload) =>
      sessionMock.selectTarget(participantId, payload?.targetParticipantId),
  };

  return {
    mode: "mock",

    on: events.on,
    onStatus: status.on,

    async emit(event, payload = {}) {
      if (!sessionId || !participantId) {
        throw normalizeLiveError(
          null,
          "جلسة الطالب مش جاهزة. انضم تاني بالكود."
        );
      }

      const action = actions[event];

      if (!action) {
        throw normalizeLiveError(null, `الإجراء ${event} غير مدعوم في وضع المحاكاة.`);
      }

      try {
        const response = await action(payload);

        if (event !== "game:sync") {
          await refresh();
        }

        return response?.data ?? null;
      } catch (error) {
        const normalized = normalizeLiveError(error);
        events.dispatch("game:error", normalized);
        throw normalized;
      }
    },

    disconnect() {
      closed = true;
      unsubscribe();
      events.clear();
      status.clear();
    },

    get connected() {
      return status.get() === CONNECTION_STATUS.CONNECTED;
    },

    get status() {
      return status.get();
    },
  };
}
