// src/hooks/useFocusNotification.js
import { useEffect } from "react";
import { updateStudent } from "../sessionStore.js";

export function useFocusNotification({ notification, sessionId, studentId, onTrigger }) {
  useEffect(() => {
    if (!notification || notification.type !== "focus") return;
    onTrigger?.("focus");
    updateStudent(sessionId, studentId, { activeNotification: null }).catch(() => {});
  }, [notification, sessionId, studentId, onTrigger]);
}