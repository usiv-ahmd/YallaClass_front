// src/utils/studentView.js
export function getQuestions(session) {
  const raw = session?.questions;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : Object.values(raw);
}

export function getCorrectIndex(question) {
  if (Number.isInteger(question?.correctOptionIndex)) return question.correctOptionIndex;
  if (Array.isArray(question?.options) && typeof question?.correctAnswer === "string") {
    return question.options.indexOf(question.correctAnswer);
  }
  return -1;
}

export function computeTimeLeft(live, duration, now) {
  if (live?.state === "question" && live?.startedAt) {
    const elapsed = Math.floor((now - live.startedAt) / 1000);
    return Math.max(0, duration - elapsed);
  }
  return live?.timeLeft ?? 0;
}

export function computeAnswerState(liveState, currentAnswer) {
  const inRange = liveState === "question" || liveState === "paused" || liveState === "reveal";
  if (inRange && currentAnswer) return currentAnswer.isCorrect ? "correct" : "wrong";
  return "pending";
}

export function sortStudentsByScore(students = []) {
  return [...students].sort((a, b) => (b.score || 0) - (a.score || 0));
}

export function computeRankLabel(rankGain) {
  if (rankGain > 0) return `طلعت ${rankGain} ${rankGain === 1 ? "مركز" : "مراكز"} لفوق!`;
  if (rankGain < 0) return "لسه قدامك فرصة ترجع";
  return "كل نقطة هتقربك للصدارة";
}

export const QUESTION_TYPE_LABELS = {
  mcq: "اختيار من متعدد",
  true_false: "صح / غلط",
};

export function isOptionBased(q) {
  return q?.type === "mcq" || q?.type === "true_false";
}

export function getQuestionWeight(q) {
  return Number(q?.weight) > 0 ? Number(q.weight) : 10;
}