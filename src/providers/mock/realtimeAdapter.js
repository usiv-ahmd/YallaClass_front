// src/providers/mock/realtimeAdapter.js
import { broadcast } from "./broadcast";
import { db } from "./db";

export function subscribeRemoteSession(sessionId, onUpdate) {
  return broadcast.on("session:updated", ({ sessionId: sid }) => {
    if (sid !== sessionId) return;
    db.reload();
    const fresh = db.sessions.findById(sessionId);
    if (fresh) onUpdate(fresh);
  });
}