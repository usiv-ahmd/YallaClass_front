// src/utils/questions.js
import { QUESTION_TYPES } from "../constants/questions.js";

export function getCorrectIndex(question) {
  const options = Array.isArray(question?.options) ? question.options : [];

  const flaggedIndex = options.findIndex((option) =>
    Boolean(option && typeof option === "object" && option.isCorrect)
  );

  if (flaggedIndex >= 0) {
    return flaggedIndex;
  }

  if (Number.isInteger(question?.correctOptionIndex)) {
    return question.correctOptionIndex;
  }

  if (Number.isInteger(question?.correctIndex)) {
    return question.correctIndex;
  }

  if (typeof question?.correctAnswer === "string") {
    return options.findIndex(
      (option) =>
        (option && typeof option === "object" ? option.text : option) ===
        question.correctAnswer
    );
  }

  return -1;
}

export function getOptionText(option) {
  if (option && typeof option === "object") {
    return String(option.text ?? "");
  }

  return String(option ?? "");
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
