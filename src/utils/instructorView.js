// src/utils/instructorView.js
import { getQuestions } from "./session.js";
import { getStudentStatusLabel, escapeCSVCell } from "./formatting.js";

export { getQuestions };

export const ONLINE_THRESHOLD_MS = 45_000;

export function isStudentOnline(student, now) {
  if (!student) return false;
  if (student.leftAt) return false;
  if (!student.lastSeenAt) return false;
  return (now - student.lastSeenAt) < ONLINE_THRESHOLD_MS;
}

export function getUnansweredCount(studentId, session) {
  if (!studentId || !session) return 0;
  const qs = getQuestions(session);
  const answers = session.answers?.[studentId] || {};
  return qs.filter((q) => !answers[q.id]).length;
}

export function sortStudentsForLeaderboard(students = []) {
  return [...students].sort((a, b) => {
    const scoreDiff = (b.score || 0) - (a.score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    const streakDiff = (b.highestStreak || 0) - (a.highestStreak || 0);
    if (streakDiff !== 0) return streakDiff;
    return (a.name || "").localeCompare(b.name || "", "ar");
  });
}

export function buildStudentsCSV({ students }) {
  const headers = [
    "#", "الاسم", "صح", "غلط", "حضور",
    "الحالة", "انتهى وقتها", "غاب عنها",
    "Score", "Streak",
  ];
  const rows = students.map((s, i) => [
    i + 1,
    s.name,
    s.correctAnswers || 0,
    s.wrongAnswers || 0,
    s.attended ? "حاضر" : "غائب",
    getStudentStatusLabel(s),
    s.timedOutCount || 0,
    s.missedCount || 0,
    s.score || 0,
    s.highestStreak || 0,
  ]);
  return [
    headers.map(escapeCSVCell).join(","),
    ...rows.map((r) => r.map(escapeCSVCell).join(",")),
  ].join("\n");
}

export function downloadCSV(csv, filename) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}