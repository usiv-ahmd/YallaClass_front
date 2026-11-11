// src/utils/questions.js
import { QUESTION_TYPES } from "../constants/questions.js";

export function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getCorrectIndex(question) {
  if (Number.isInteger(question?.correctOptionIndex)) return question.correctOptionIndex;
  if (Array.isArray(question?.options) && typeof question?.correctAnswer === "string") {
    return question.options.indexOf(question.correctAnswer);
  }
  return -1;
}

export function clampNumber(value, min, max, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function clampDuration(value, durations, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  if (durations.includes(n)) return n;
  return durations.reduce(
    (best, sec) => (Math.abs(sec - n) < Math.abs(best - n) ? sec : best),
    durations[0]
  );
}

export function getTypeDurations(type) {
  return QUESTION_TYPES[type]?.durations ?? QUESTION_TYPES.mcq.durations;
}