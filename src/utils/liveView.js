// src/utils/liveView.js
import { getCorrectIndex, QUESTION_TYPES } from "./questions";

const DEFAULT_DURATION = 30;

export function getQuestionDisplayState(question, live) {
  if (!question) return null;

  const duration   = Number(question.duration) || DEFAULT_DURATION;
  const displayed  = live?.timeLeft ?? 0;
  const progress   = duration > 0
    ? Math.max(0, Math.min(1, displayed / duration))
    : 0;
  const isReveal   = live?.state === "reveal";
  const type       = question.type ?? "mcq";
  const isMcq      = type === "mcq";
  const isTf       = type === "true_false";
  const typeLabel  = QUESTION_TYPES[type]?.label ?? type;
  const correctIdx = getCorrectIndex(question);
  const weight     = Number(question.weight) > 0 ? Number(question.weight) : 0;
  const isAi       = question.source === "ai";

  return {
    duration,
    displayed,
    progress,
    isReveal,
    type,
    isMcq,
    isTf,
    typeLabel,
    correctIdx,
    weight,
    isAi,
  };
}

export function getTimerLevel(progress) {
  if (progress <= 0.25) return "danger";
  if (progress <= 0.5)  return "warning";
  return "normal";
}

export function getTimerRingClass(progress) {
  const level = getTimerLevel(progress);
  if (level === "danger")  return "timer-ring is-danger";
  if (level === "warning") return "timer-ring is-warning";
  return "timer-ring";
}