// hooks/useOnlineStudents.js
import { useCallback, useEffect, useState } from "react";
import { isStudentOnline } from "../utils/instructorView.js";

export function useOnlineStudents(students = [], intervalMs = 10_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(i);
  }, [intervalMs]);

  const isOnline = useCallback((s) => isStudentOnline(s, now), [now]);
  const onlineCount = students.filter(isOnline).length;

  return { now, isOnline, onlineCount };
}