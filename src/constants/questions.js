// src/constants/questions.js
//
// Question limits mirror the backend question validation. The backend has no
// question "type" or explanation field; a true/false question is simply a
// two-option question. QUESTION_TYPES remains for display helpers only.
import {
  DEFAULT_POINTS,
  MAX_OPTIONS,
  MAX_POINTS,
  MAX_TIME_LIMIT_SEC,
  MIN_OPTIONS,
  MIN_POINTS,
  MIN_TIME_LIMIT_SEC,
  QUESTION_OPTION_MAX_LENGTH,
  QUESTION_TEXT_MAX_LENGTH,
  QUESTION_TIME_OPTIONS,
} from "../adapters/quiz.adapter.js";

export {
  DEFAULT_POINTS,
  MAX_OPTIONS,
  MAX_POINTS,
  MAX_TIME_LIMIT_SEC,
  MIN_OPTIONS,
  MIN_POINTS,
  MIN_TIME_LIMIT_SEC,
  QUESTION_OPTION_MAX_LENGTH,
  QUESTION_TEXT_MAX_LENGTH,
  QUESTION_TIME_OPTIONS,
};

export const DEFAULT_TIME_LIMIT_SEC = 10;

export const QUESTION_TYPES = {
  mcq: {
    id: "mcq",
    label: "اختيار من متعدد",
    hasOptions: true,
    hasCorrect: true,
    durations: QUESTION_TIME_OPTIONS,
    defaultOptions: ["", "", "", ""],
  },
  true_false: {
    id: "true_false",
    label: "صح / غلط",
    hasOptions: true,
    hasCorrect: true,
    durations: [5, 10, 15, 30],
    fixedOptions: ["صح", "غلط"],
  },
};

export const QUESTION_TYPE_LABELS = {
  mcq: QUESTION_TYPES.mcq.label,
  true_false: QUESTION_TYPES.true_false.label,
};

export const ANSWER_COLORS = ["purple", "blue", "orange", "pink", "cyan", "lime"];

export const QUESTION_STATES = ["question", "paused", "reveal"];

// Legacy aliases kept for older mock code paths. Points are now the only
// scoring value the backend stores.
export const DEFAULT_WEIGHT = DEFAULT_POINTS;
export const MAX_WEIGHT = MAX_POINTS;
export const MIN_WEIGHT = MIN_POINTS;

export const DEFAULT_DEGREE = DEFAULT_POINTS;
export const MAX_DEGREE = MAX_POINTS;
export const MIN_DEGREE = MIN_POINTS;
