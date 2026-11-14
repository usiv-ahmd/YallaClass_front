// hooks/useVisibilityTracking.js
import { useEffect } from "react";
import { updateStudent } from "../sessionStore.js";

export function useVisibilityTracking(sessionId, studentId) {
  useEffect(() => {
    if (!sessionId || !studentId) return;
    const markLeft = () =>
      updateStudent(sessionId, studentId, { leftAt: Date.now() }).catch(() => {});
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        updateStudent(sessionId, studentId, {
          lastSeenAt: Date.now(),
          leftAt: null,
        }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", markLeft);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", markLeft);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [sessionId, studentId]);
}