// src/realtime/socketClient.js
//
// Thin wrapper around socket.io-client that exposes one predictable interface
// for both teacher and player flows:
//   on(event, handler) -> unsubscribe
//   onStatus(handler)  -> unsubscribe
//   emit(event, payload) -> Promise<ack.data>
//   disconnect()
//
// The backend acknowledges every command with { success, data } or
// { success: false, error: { code, message } }, so callers can await actions.
import { io } from "socket.io-client";

import { CONFIG } from "../config";
import { CONNECTION_STATUS } from "./events";
import { normalizeLiveError } from "./errors";

export function createSocketClient({ auth, onStatus }) {
  const socket = io(CONFIG.SOCKET_URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
  });

  const listeners = new Map();
  const statusListeners = new Set();
  let currentStatus = CONNECTION_STATUS.CONNECTING;

  function emitStatus(status, extra = {}) {
    currentStatus = status;
    onStatus?.(status, extra);

    for (const listener of statusListeners) {
      listener(status, extra);
    }
  }

  function dispatch(event, payload) {
    for (const handler of listeners.get(event) || []) {
      handler(payload);
    }
  }

  socket.on("connect", () => emitStatus(CONNECTION_STATUS.CONNECTED));
  socket.on("disconnect", (reason) =>
    emitStatus(CONNECTION_STATUS.DISCONNECTED, { reason })
  );
  socket.io.on("reconnect_attempt", () =>
    emitStatus(CONNECTION_STATUS.CONNECTING)
  );
  socket.on("connect_error", (error) => {
    emitStatus(CONNECTION_STATUS.ERROR, {
      error: normalizeLiveError(error, "تعذّر الاتصال بالجلسة المباشرة."),
    });
  });
  socket.on("game:error", (error) => {
    dispatch("game:error", normalizeLiveError(error));
  });

  return {
    mode: "socket",

    on(event, handler) {
      const handlers = listeners.get(event) || new Set();
      handlers.add(handler);
      listeners.set(event, handlers);

      socket.on(event, handler);

      return () => {
        handlers.delete(handler);
        socket.off(event, handler);

        if (handlers.size === 0) {
          listeners.delete(event);
        }
      };
    },

    onStatus(handler) {
      statusListeners.add(handler);
      handler(currentStatus);
      return () => statusListeners.delete(handler);
    },

    emit(event, payload = {}, { timeoutMs = 15000 } = {}) {
      return new Promise((resolve, reject) => {
        if (!socket.connected) {
          reject(
            normalizeLiveError(
              null,
              "الاتصال بالخادم مش متاح دلوقتي. جرّب تاني بعد لحظة."
            )
          );
          return;
        }

        socket.timeout(timeoutMs).emit(event, payload, (timeoutError, response) => {
          if (timeoutError) {
            reject(
              normalizeLiveError(null, "الخادم اتأخر في الرد. جرّب تاني.")
            );
            return;
          }

          if (!response || response.success === false) {
            reject(normalizeLiveError(response?.error));
            return;
          }

          resolve(response.data ?? null);
        });
      });
    },

    disconnect() {
      for (const handlers of listeners.values()) {
        handlers.clear();
      }
      listeners.clear();
      statusListeners.clear();
      socket.removeAllListeners();
      socket.disconnect();
    },

    get connected() {
      return socket.connected;
    },

    get status() {
      return currentStatus;
    },
  };
}
