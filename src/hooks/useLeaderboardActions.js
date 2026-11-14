// src/hooks/useLeaderboardActions.js
import { useState } from "react";
import { useNotificationCooldown } from "./useNotificationCooldown.js";
import { useOnlineStudents } from "./useOnlineStudents.js";

export function useLeaderboardActions({ students, onDelete, onSendNotification }) {
  const { isOnline, onlineCount } = useOnlineStudents(students);
  const { markCooldown, isCoolingDown } = useNotificationCooldown();

  const [targetStudent, setTargetStudent] = useState(null);
  const [sending, setSending]             = useState(false);

  const handleSendNotification = async (type) => {
    if (!targetStudent) return;
    setSending(true);
    try {
      await onSendNotification(targetStudent.id, type);
      markCooldown(targetStudent.id);
      setTargetStudent(null);
    } catch (error) {
      console.error("Failed to send notification", error);
      alert("حدث خطأ أثناء إرسال التنبيه");
    } finally {
      setSending(false);
    }
  };

  const handleAction = (student) => {
    const online = isOnline(student);
    const ok = window.confirm(
      online
        ? `إخراج "${student.name}" من الحصة الحية؟\n(يمكنه الرجوع بكود الحصة)`
        : `حذف حساب "${student.name}" نهائيًا؟\nسيتم إخراجه من الحصة الحالية فورًا.`
    );
    if (ok) onDelete?.(student.id);
  };

  return {
    isOnline,
    onlineCount,
    isCoolingDown,
    targetStudent,
    setTargetStudent,
    sending,
    handleSendNotification,
    handleAction,
  };
}