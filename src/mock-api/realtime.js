// src/mock-api/realtime.js
import { API } from "./config";
import { EP } from "./endpoints";

export function subscribeSession(sessionId, onMessage) {
  if (API.useMock) {
    const handler = (e) => {
      const s = e.detail?.[sessionId];
      if (s) onMessage(s);
    };
    window.addEventListener("live-quiz:sessions-updated", handler);
    return () => window.removeEventListener("live-quiz:sessions-updated", handler);
  }

  let ws, closed = false, retryMs = 1000;
  const connect = () => {
    if (closed) return;
    ws = new WebSocket(`${API.wsUrl}${EP.wsSession(sessionId)}`);
    ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch {} };
    ws.onclose   = () => { if (!closed) { setTimeout(connect, retryMs); retryMs = Math.min(retryMs*2, 15000); } };
    ws.onerror   = () => ws.close();
  };
  connect();
  return () => { closed = true; try { ws?.close(); } catch {} };
}
