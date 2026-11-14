// src/hooks/useInstructorHandlers.js
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth } from "../mock-api/auth.js";
import { sendNotification } from "../sessionStore.js";

export function useInstructorHandlers({ data, live }) {
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    clearAuth();
    navigate("/login", { replace: true });
  }, [navigate]);

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (file && data.session) await data.uploadFile(file);
    e.target.value = "";
  }, [data]);

  const handleRemoveFile = useCallback((idx) => data.removeFile(idx), [data]);

  const handleStartLiveSession = useCallback(
    () => live.startLiveSession(),
    [live]
  );

  const handleSendNotification = useCallback(async (studentId, type) => {
    if (!live.liveSession?.id) return;
    await sendNotification(live.liveSession.id, studentId, type);
  }, [live]);

  return {
    handleLogout,
    handleFileUpload,
    handleRemoveFile,
    handleStartLiveSession,
    handleSendNotification,
  };
}