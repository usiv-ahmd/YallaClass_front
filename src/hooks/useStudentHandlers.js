// src/hooks/useStudentHandlers.js
import { useCallback } from "react";

export function useStudentHandlers({ sessionApi, clearReaction }) {
  const handleForceKick = useCallback(async (msg) => {
    await sessionApi.forceRemove(msg);
    clearReaction();
  }, [sessionApi, clearReaction]);

  const handleLeave = useCallback(async () => {
    await sessionApi.leave();
    clearReaction();
  }, [sessionApi, clearReaction]);

  return { handleForceKick, handleLeave };
}