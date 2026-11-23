// src/providers/http/session.http.js
import { http } from "../../api/httpClient";
import { ok, pick } from "./response";
import { notImplemented } from "./not-implemented";
import {
  buildCommandSettingsPatch,
  buildJoinPayload,
  buildPhaseSettingsPatch,
  buildSessionCreatePayload,
  normalizeParticipantList,
  normalizePublicParticipant,
  normalizePublicSession,
  normalizeSession,
  normalizeSessionList,
} from "../../adapters/session.adapter.js";

const socketHint =
  "This operation is driven by Socket.IO and the game engine, not REST.";

function requireSessionId(sessionId) {
  if (!sessionId) {
    const error = new Error("Session id is required");
    error.status = 400;
    throw error;
  }
}

function requireCode(code) {
  if (!code) {
    const error = new Error("Join code is required");
    error.status = 400;
    throw error;
  }
}

async function fetchSession(sessionId) {
  const body = await http.get(`/sessions/${sessionId}`);
  return ok(normalizeSession(pick(body, "session")));
}

export const sessionHttp = {
  async list(params = {}) {
    const query = new URLSearchParams();

    if (params.status) query.set("status", params.status);
    if (params.quiz) query.set("quiz", params.quiz);
    if (params.search) query.set("search", params.search);

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const body = await http.get(`/sessions${suffix}`);
    return ok(normalizeSessionList(pick(body, "sessions") ?? []));
  },

  async getById(sessionId) {
    requireSessionId(sessionId);
    return fetchSession(sessionId);
  },

  async getLobby(sessionId) {
    requireSessionId(sessionId);
    const body = await http.get(`/sessions/${sessionId}/lobby`);
    const session = normalizeSession(pick(body, "session"));
    return ok(session);
  },

  // The backend exposes public sessions by join code, not by session id.
  getPublicById: notImplemented(
    "session",
    "getPublicById",
    "The backend only supports public lookup by join code (GET /api/join/:code)."
  ),

  async getByCode(code) {
    requireCode(code);
    const body = await http.get(`/join/${encodeURIComponent(code)}`, {
      auth: false,
      handleUnauthorized: false,
    });
    return ok(normalizePublicSession(pick(body, "session")));
  },

  async create(payload = {}) {
    const request = buildSessionCreatePayload(payload);
    const body = await http.post("/sessions", request);
    return ok(normalizeSession(pick(body, "session")));
  },

  async updateCommandSettings(sessionId, settings = {}) {
    requireSessionId(sessionId);
    const patch = buildCommandSettingsPatch(settings);
    const body = await http.patch(
      `/sessions/${sessionId}/command-settings`,
      patch
    );
    return ok(normalizeSession(pick(body, "session")));
  },

  async updatePhaseSettings(sessionId, settings = {}) {
    requireSessionId(sessionId);
    const patch = buildPhaseSettingsPatch(settings);
    const body = await http.patch(
      `/sessions/${sessionId}/phase-settings`,
      patch
    );
    return ok(normalizeSession(pick(body, "session")));
  },

  // Backward-compatible alias used by the session store.
  async updateSettings(sessionId, patch = {}) {
    if (patch.commandsEnabled) {
      return this.updateCommandSettings(sessionId, patch.commandsEnabled);
    }

    return this.updateCommandSettings(sessionId, patch);
  },

  async lockJoining(sessionId, allowJoining) {
    requireSessionId(sessionId);
    const body = await http.patch(`/sessions/${sessionId}/join-lock`, {
      joinOpen: Boolean(allowJoining),
    });
    return ok(normalizeSession(pick(body, "session")));
  },

  async join(payload = {}) {
    requireCode(payload.code);
    const request = buildJoinPayload(payload);
    const body = await http.post(
      `/join/${encodeURIComponent(payload.code)}`,
      request,
      { auth: false, handleUnauthorized: false }
    );
    const data = body?.data ?? body;

    return ok({
      session: normalizePublicSession(data?.session),
      participant: normalizePublicParticipant(data?.participant),
    });
  },

  async reconnect(code, participantToken) {
    requireCode(code);

    if (!participantToken) {
      const error = new Error("Participant token is required");
      error.status = 400;
      throw error;
    }

    const body = await http.post(
      `/join/${encodeURIComponent(code)}/reconnect`,
      { participantToken },
      { auth: false, handleUnauthorized: false }
    );
    const data = body?.data ?? body;

    return ok({
      session: normalizePublicSession(data?.session),
      participant: normalizePublicParticipant(data?.participant),
    });
  },

  leave: notImplemented("session", "leave", socketHint),
  heartbeat: notImplemented("session", "heartbeat", socketHint),
  markSeen: notImplemented("session", "markSeen", socketHint),

  async kickParticipant(sessionId, participantId) {
    requireSessionId(sessionId);
    await http.delete(`/sessions/${sessionId}/participants/${participantId}`);
    return fetchSession(sessionId);
  },

  // Backward-compatible alias used by the session store.
  async kickStudent(sessionId, participantId) {
    return this.kickParticipant(sessionId, participantId);
  },

  async start(sessionId) {
    requireSessionId(sessionId);
    const body = await http.post(`/sessions/${sessionId}/start`);
    return ok(normalizeSession(pick(body, "session")));
  },

  async pause(sessionId) {
    requireSessionId(sessionId);
    const body = await http.post(`/sessions/${sessionId}/pause`);
    return ok(normalizeSession(pick(body, "session")));
  },

  async resume(sessionId) {
    requireSessionId(sessionId);
    const body = await http.post(`/sessions/${sessionId}/resume`);
    return ok(normalizeSession(pick(body, "session")));
  },

  async reveal(sessionId) {
    requireSessionId(sessionId);
    const body = await http.post(`/sessions/${sessionId}/reveal`);
    return ok(normalizeSession(pick(body, "session")));
  },

  async next(sessionId) {
    requireSessionId(sessionId);
    const body = await http.post(`/sessions/${sessionId}/next`);
    return ok(normalizeSession(pick(body, "session")));
  },

  async skip(sessionId) {
    requireSessionId(sessionId);
    const body = await http.post(`/sessions/${sessionId}/skip`);
    return ok(normalizeSession(pick(body, "session")));
  },

  async finish(sessionId) {
    requireSessionId(sessionId);
    const body = await http.post(`/sessions/${sessionId}/finish`);
    return ok(normalizeSession(pick(body, "session")));
  },

  // Backward-compatible alias used by the session store.
  async end(sessionId) {
    return this.finish(sessionId);
  },

  cancelCountdown: notImplemented(
    "session",
    "cancelCountdown",
    "The backend advances COUNTDOWN automatically; only next is exposed."
  ),
  startQuestion: notImplemented(
    "session",
    "startQuestion",
    "Questions start automatically from COUNTDOWN; use next to advance phases."
  ),
  showExplanation: notImplemented(
    "session",
    "showExplanation",
    "The backend advances REVEAL to EXPLANATION automatically; use next to force it."
  ),
  showLeaderboard: notImplemented(
    "session",
    "showLeaderboard",
    "The backend advances phases automatically; use next to force it."
  ),
  finishRound: notImplemented(
    "session",
    "finishRound",
    "Use finish to end the session after the last question."
  ),

  submitAnswer: notImplemented("session", "submitAnswer", socketHint),
  useCommand: notImplemented("session", "useCommand", socketHint),
};

// Kept for callers that want raw participant lists (e.g. future tooling).
export function normalizeLobbyParticipants(raw) {
  return normalizeParticipantList(raw);
}
