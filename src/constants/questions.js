// src/constants/questions.js
export const QUESTION_TYPES = {
  mcq: {
    id: "mcq",
    label: "اختيار من متعدد",
    hasOptions: true,
    hasCorrect: true,
    durations: [5, 10, 15, 30, 60],
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

<<<<<<< Updated upstream
export const DEFAULT_WEIGHT = 10;
export const MAX_WEIGHT = 100;
export const MIN_WEIGHT = 1;

export const DEFAULT_DEGREE = 1;
export const MAX_DEGREE = 100;
export const MIN_DEGREE = 1;
=======
export const ANSWER_COLORS = ["purple", "blue", "orange", "pink", "cyan", "lime"];

export const QUESTION_STATES = ["question", "paused", "reveal"];

export const DEFAULT_POINTS = 1;
export const MAX_POINTS = 100;
export const MIN_POINTS = 1;
>>>>>>> Stashed changes
