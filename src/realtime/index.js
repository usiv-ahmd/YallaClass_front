// src/realtime/index.js
//
// Single entry point for live game connections. Pages/hooks import from here
// and never touch socket.io or the mock engine directly.
import { CONFIG } from "../config";
import { createSocketClient } from "./socketClient";
import { createMockTeacherClient, createMockPlayerClient } from "./mockClient";

const USE_SOCKET = CONFIG.API_MODE === "http";

export function createTeacherLiveClient({ token, sessionId, onStatus }) {
  if (!token) {
    throw new Error("Teacher live connection requires an auth token");
  }

  if (!sessionId) {
    throw new Error("Teacher live connection requires a session id");
  }

  if (USE_SOCKET) {
    return createSocketClient({
      auth: { role: "teacher", token, sessionId },
      onStatus,
    });
  }

  return createMockTeacherClient({ sessionId, onStatus });
}

export function createPlayerLiveClient({ joinCode, participantToken, onStatus }) {
  if (!joinCode || !participantToken) {
    throw new Error("Player live connection requires a join code and token");
  }

  if (USE_SOCKET) {
    return createSocketClient({
      auth: { role: "player", joinCode, participantToken },
      onStatus,
    });
  }

  return createMockPlayerClient({ joinCode, participantToken, onStatus });
}

export { SOCKET_EVENTS, LIVE_SYNC_EVENTS, CONNECTION_STATUS } from "./events";
export { normalizeLiveError } from "./errors";
