// hooks/useStudentSession.js
import { useCallback, useState } from "react";
import {
  findSessionByCode, addStudentToSession, updateStudent, removeStudentFromSession,
} from "../sessionStore.js";

export function useStudentSession() {
  const [joined, setJoined] = useState(null);
  const [error, setError] = useState("");

  const join = useCallback(async (rawName, rawCode) => {
    setError("");
    const name = rawName.trim();
    const code = rawCode.trim();
    if (name.length < 2) return setError("اكتب اسمك (حرفين على الأقل)");
    if (!code) return setError("اكتب كود الحصة");
    try {
      const session = await findSessionByCode(code);
      if (!session) return setError("الكود غلط أو الحصة مش موجودة");

      const existing = (session.students || []).find(
        (s) => s.name.trim().toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        const updated = await updateStudent(session.id, existing.id, {
          lastSeenAt: Date.now(), leftAt: null,
        });
        const fresh = updated?.students?.find((s) => s.id === existing.id) || existing;
        return setJoined({ session: updated || session, student: fresh });
      }
      const student = {
        id: `student-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        name, attended: true, interacted: false, correctAnswers: 0, wrongAnswers: 0,
        score: 0, highestStreak: 0, currentStreak: 0, finishedAt: null,
        joinedAt: Date.now(), lastSeenAt: Date.now(), leftAt: null,
      };
      const updated = await addStudentToSession(session.id, student);
      if (!updated) return setError("مقدرناش ننضمّك، حاول تاني");
      setJoined({ session: updated, student });
    } catch (err) {
      console.error(err);
      setError("حصل خطأ في الاتصال، حاول تاني");
    }
  }, []);

  const leave = useCallback(async () => {
    if (joined?.session?.id && joined?.student?.id) {
      try {
        await updateStudent(joined.session.id, joined.student.id, {
          leftAt: Date.now(), activeNotification: null,
        });
      } catch (e) { console.warn("[leave]", e); }
    }
    setJoined(null); setError("");
  }, [joined]);

  const forceRemove = useCallback(async (msg) => {
    if (joined?.session?.id && joined?.student?.id) {
      try { await removeStudentFromSession(joined.session.id, joined.student.id); }
      catch (err) { console.error(err); }
    }
    setJoined(null); setError(msg || "تم إخراجك من الحصة.");
  }, [joined]);

  const changeName = useCallback(async (newName) => {
    if (!joined) return;
    try {
      const updated = await updateStudent(joined.session.id, joined.student.id, {
        name: newName, warnedForNameChangeAt: null, activeNotification: null,
      });
      if (!updated) return;
      const fresh = updated.students.find((s) => s.id === joined.student.id) || joined.student;
      setJoined((prev) => prev ? { ...prev, session: updated, student: fresh } : prev);
    } catch (err) { console.error(err); }
  }, [joined]);

  const updateSession = useCallback((fresh) => {
    setJoined((prev) =>
      !prev || JSON.stringify(prev.session) === JSON.stringify(fresh)
        ? prev
        : { ...prev, session: fresh }
    );
  }, []);

  const handleExternalRemoval = useCallback((msg) => {
    setJoined(null); setError(msg);
  }, []);

  const clearNotification = useCallback(async () => {
    if (!joined?.session?.id || !joined?.student?.id) return;
    try {
      await updateStudent(joined.session.id, joined.student.id, { activeNotification: null });
    } catch (err) { console.error(err); }
  }, [joined]);

  return {
    joined, error, join, leave, forceRemove, changeName,
    updateSession, handleExternalRemoval, clearNotification,
  };
}