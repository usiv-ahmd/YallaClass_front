// src/adapters/quiz.adapter.js
//
// Normalizes backend quiz/question payloads for the UI and validates the
// authoring payloads the backend accepts. Backend source of truth:
//   - quiz: { title (1..150), description (<=1000) }
//   - question: { text (1..1000), options: [{ text (1..500), isCorrect }] (2..4,
//     exactly one correct), points (1..10000), timeLimitSec (5..120), order }
// The mock provider keeps its legacy storage shape, so the normalizer also
// accepts the old option strings/weight/duration aliases.

export const QUIZ_TITLE_MAX_LENGTH = 150;
export const QUIZ_DESCRIPTION_MAX_LENGTH = 1000;
export const QUESTION_TEXT_MAX_LENGTH = 1000;
export const QUESTION_OPTION_MAX_LENGTH = 500;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 4;
export const DEFAULT_POINTS = 1000;
export const MIN_POINTS = 1;
export const MAX_POINTS = 10000;
export const DEFAULT_TIME_LIMIT_SEC = 10;
export const MIN_TIME_LIMIT_SEC = 5;
export const MAX_TIME_LIMIT_SEC = 120;
export const QUESTION_TIME_OPTIONS = [5, 10, 15, 30, 60, 90, 120];

function toInteger(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? n : null;
}

function clampInteger(value, min, max, fallback) {
  const n = toInteger(value);
  if (n === null) return fallback;
  return Math.min(max, Math.max(min, n));
}

function findCorrectIndex(rawOptions, raw) {
  const explicit = toInteger(
    raw?.correctOptionIndex ?? raw?.correctIndex
  );

  if (explicit !== null) {
    return explicit;
  }

  if (Array.isArray(rawOptions)) {
    const flagIndex = rawOptions.findIndex((option) =>
      Boolean(option && typeof option === "object" && option.isCorrect)
    );

    if (flagIndex >= 0) {
      return flagIndex;
    }

    if (typeof raw?.correctAnswer === "string") {
      return rawOptions.findIndex(
        (option) => normalizeOptionText(option) === raw.correctAnswer.trim()
      );
    }
  }

  return -1;
}

function normalizeOptionText(option) {
  if (option && typeof option === "object") {
    return String(option.text ?? option.label ?? "").trim();
  }

  return String(option ?? "").trim();
}

export function normalizeQuestion(raw, index = 0) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const rawOptions = Array.isArray(raw.options) ? raw.options : [];
  const correctIndex = findCorrectIndex(rawOptions, raw);

  const options = rawOptions.map((option, optionIndex) => {
    const objectOption = option && typeof option === "object" ? option : null;

    return {
      id: objectOption?.id ?? objectOption?._id ?? null,
      text: normalizeOptionText(option),
      isCorrect: objectOption?.isCorrect !== undefined
        ? Boolean(objectOption.isCorrect)
        : optionIndex === correctIndex,
    };
  });

  const order = toInteger(raw.order);

  return {
    id: raw.id ?? raw._id ?? null,
    quizId: raw.quiz ?? raw.quizId ?? null,
    text: String(raw.text ?? raw.question ?? "").trim(),
    points: clampInteger(
      raw.points ?? raw.weight,
      MIN_POINTS,
      MAX_POINTS,
      DEFAULT_POINTS
    ),
    timeLimitSec: clampInteger(
      raw.timeLimitSec ?? raw.duration,
      MIN_TIME_LIMIT_SEC,
      MAX_TIME_LIMIT_SEC,
      DEFAULT_TIME_LIMIT_SEC
    ),
    order: order !== null && order >= 0 ? order : index,
    options,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

export function normalizeQuestionList(rawQuestions) {
  if (!Array.isArray(rawQuestions)) {
    return [];
  }

  return rawQuestions
    .map((question, index) => normalizeQuestion(question, index))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

export function normalizeQuiz(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const rawQuestions = Array.isArray(raw.questions)
    ? normalizeQuestionList(raw.questions)
    : null;

  const status = raw.status ?? (raw.archived ? "ARCHIVED" : "ACTIVE");
  const questionCount = toInteger(raw.questionCount);
  const estimatedDurationSec = toInteger(raw.estimatedDurationSec);

  const quiz = {
    id: raw.id ?? raw._id ?? null,
    title: String(raw.title ?? "").trim(),
    description: String(raw.description ?? "").trim(),
    organizationId: raw.organization ?? raw.organizationId ?? null,
    createdBy: raw.createdBy ?? null,
    status,
    archived: status === "ARCHIVED",
    archivedAt: raw.archivedAt ?? null,
    questionCount: questionCount !== null
      ? questionCount
      : rawQuestions?.length ?? 0,
    estimatedDurationSec: estimatedDurationSec !== null
      ? estimatedDurationSec
      : rawQuestions?.reduce((total, question) => total + question.timeLimitSec, 0) ?? 0,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };

  if (rawQuestions) {
    quiz.questions = rawQuestions;
  }

  return quiz;
}

export function normalizeQuizList(rawQuizzes) {
  if (!Array.isArray(rawQuizzes)) {
    return [];
  }

  return rawQuizzes.map(normalizeQuiz).filter(Boolean);
}

function validationError(message) {
  const error = new Error(message);
  error.name = "ValidationError";
  error.status = 400;
  return error;
}

export function buildQuizPayload({ title, description } = {}) {
  const cleanTitle = String(title ?? "").trim();

  if (!cleanTitle) {
    throw validationError("اكتب عنوان الكويز.");
  }

  if (cleanTitle.length > QUIZ_TITLE_MAX_LENGTH) {
    throw validationError(`عنوان الكويز لازم يكون ${QUIZ_TITLE_MAX_LENGTH} حرف أو أقل.`);
  }

  const cleanDescription = String(description ?? "").trim();

  if (cleanDescription.length > QUIZ_DESCRIPTION_MAX_LENGTH) {
    throw validationError(
      `وصف الكويز لازم يكون ${QUIZ_DESCRIPTION_MAX_LENGTH} حرف أو أقل.`
    );
  }

  return {
    title: cleanTitle,
    description: cleanDescription,
  };
}

export function buildQuizPatch({ title, description } = {}) {
  const patch = {};

  if (title !== undefined) {
    const cleanTitle = String(title ?? "").trim();

    if (!cleanTitle) {
      throw validationError("اكتب عنوان الكويز.");
    }

    if (cleanTitle.length > QUIZ_TITLE_MAX_LENGTH) {
      throw validationError(
        `عنوان الكويز لازم يكون ${QUIZ_TITLE_MAX_LENGTH} حرف أو أقل.`
      );
    }

    patch.title = cleanTitle;
  }

  if (description !== undefined) {
    const cleanDescription = String(description ?? "").trim();

    if (cleanDescription.length > QUIZ_DESCRIPTION_MAX_LENGTH) {
      throw validationError(
        `وصف الكويز لازم يكون ${QUIZ_DESCRIPTION_MAX_LENGTH} حرف أو أقل.`
      );
    }

    patch.description = cleanDescription;
  }

  if (Object.keys(patch).length === 0) {
    throw validationError("عدّل حاجة قبل الحفظ.");
  }

  return patch;
}

/**
 * Builds the strict backend question payload from the editor form.
 * `options` is an array of strings and `correctIndex` points at the correct one.
 */
export function buildQuestionPayload({
  text,
  options,
  correctIndex,
  points,
  timeLimitSec,
  order,
} = {}) {
  const cleanText = String(text ?? "").trim();

  if (!cleanText) {
    throw validationError("اكتب نص السؤال.");
  }

  if (cleanText.length > QUESTION_TEXT_MAX_LENGTH) {
    throw validationError(
      `نص السؤال لازم يكون ${QUESTION_TEXT_MAX_LENGTH} حرف أو أقل.`
    );
  }

  if (!Array.isArray(options)) {
    throw validationError("لازم تضيف خيارات للسؤال.");
  }

  const cleanOptions = options.map((option) => String(option ?? "").trim());

  if (cleanOptions.length < MIN_OPTIONS || cleanOptions.length > MAX_OPTIONS) {
    throw validationError(
      `السؤال لازم يكون فيه من ${MIN_OPTIONS} لـ ${MAX_OPTIONS} خيارات.`
    );
  }

  if (cleanOptions.some((option) => !option)) {
    throw validationError("كل الخيارات لازم تكون مكتوبة.");
  }

  if (cleanOptions.some((option) => option.length > QUESTION_OPTION_MAX_LENGTH)) {
    throw validationError(
      `كل خيار لازم يكون ${QUESTION_OPTION_MAX_LENGTH} حرف أو أقل.`
    );
  }

  const correct = toInteger(correctIndex);

  if (correct === null || correct < 0 || correct >= cleanOptions.length) {
    throw validationError("اختار الإجابة الصحيحة.");
  }

  const cleanPoints = toInteger(points);

  if (
    cleanPoints === null ||
    cleanPoints < MIN_POINTS ||
    cleanPoints > MAX_POINTS
  ) {
    throw validationError(
      `درجة السؤال لازم تكون من ${MIN_POINTS} لـ ${MAX_POINTS}.`
    );
  }

  const cleanTime = toInteger(timeLimitSec);

  if (
    cleanTime === null ||
    cleanTime < MIN_TIME_LIMIT_SEC ||
    cleanTime > MAX_TIME_LIMIT_SEC
  ) {
    throw validationError(
      `مدة السؤال لازم تكون من ${MIN_TIME_LIMIT_SEC} لـ ${MAX_TIME_LIMIT_SEC} ثانية.`
    );
  }

  const payload = {
    text: cleanText,
    options: cleanOptions.map((option, index) => ({
      text: option,
      isCorrect: index === correct,
    })),
    points: cleanPoints,
    timeLimitSec: cleanTime,
  };

  const cleanOrder = toInteger(order);

  if (cleanOrder !== null && cleanOrder >= 0) {
    payload.order = cleanOrder;
  }

  return payload;
}

export function questionToForm(question) {
  if (!question) {
    return null;
  }

  const options = Array.isArray(question.options) ? question.options : [];
  const correctIndex = options.findIndex((option) => option.isCorrect);

  return {
    text: question.text ?? "",
    options: options.map((option) => option.text ?? ""),
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    points: question.points ?? DEFAULT_POINTS,
    timeLimitSec: question.timeLimitSec ?? DEFAULT_TIME_LIMIT_SEC,
  };
}
