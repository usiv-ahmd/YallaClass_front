import { useEffect, useRef } from "react";
import { subscribeSessions, subscribeRemoteSession } from "../sessionStore.js";

export function useSessionSubscription({ sessionId, studentId, onSessionGone, onStudentKicked, onSessionUpdate }) {
  const handlers = useRef({ onSessionGone, onStudentKicked, onSessionUpdate });
  handlers.current = { onSessionGone, onStudentKicked, onSessionUpdate };

  useEffect(() => {
    if (!sessionId) return;
    return subscribeSessions((all) => {
      const fresh = all[sessionId];
      const h = handlers.current;
      if (!fresh) { h.onSessionGone?.(); return; }
      const still = (fresh.students || []).some((s) => s.id === studentId);
      if (!still) { h.onStudentKicked?.(); return; }
      h.onSessionUpdate?.(fresh);
    });
  }, [sessionId, studentId]);

  // Live pushes from the backend (other devices / the teacher screen).
  useEffect(() => {
    if (!sessionId) return;
    return subscribeRemoteSession(sessionId);
  }, [sessionId]);
}
