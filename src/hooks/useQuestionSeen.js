// hooks/useQuestionSeen.js
import { useEffect } from "react";
import { markQuestionSeen } from "../sessionStore.js";

export function useQuestionSeen({ liveState, questionId, studentId, sessionId }) {
  useEffect(() => {
    if (liveState !== "question") return;
    if (!questionId || !studentId || !sessionId) return;
    markQuestionSeen(sessionId, studentId, questionId).catch(() => {});
  }, [liveState, questionId, studentId, sessionId]);
}