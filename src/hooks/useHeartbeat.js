// hooks/useHeartbeat.js
import { useEffect } from "react";
import { updateStudent } from "../sessionStore.js";

export function useHeartbeat(sessionId, studentId, intervalMs = 20_000) {
  useEffect(() => {
    if (!sessionId || !studentId) return;
    const tick = () =>
      updateStudent(sessionId, studentId, { lastSeenAt: Date.now(), leftAt: null })
        .catch((err) => console.warn("[heartbeat]", err));
    tick();
    const i = setInterval(tick, intervalMs);
    return () => clearInterval(i);
  }, [sessionId, studentId, intervalMs]);
}