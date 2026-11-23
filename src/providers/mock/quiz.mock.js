// src/providers/mock/quiz.mock.js
//
// Mock quiz provider. The mock DB keeps the legacy storage shape used by the
// mock live-session engine (option strings, correctOptionIndex, weight,
// duration). Responses are normalized to the backend quiz/question contract so
// the UI consumes one shape in both mock and HTTP modes.
import { db } from "./db";
import { broadcast } from "./broadcast";
import { delay, requireRole } from "./latency";
import {
  buildQuestionPayload,
  buildQuizPatch,
  buildQuizPayload,
  normalizeQuestion,
  normalizeQuestionList,
  normalizeQuiz,
  questionToForm,
} from "../../adapters/quiz.adapter.js";

const READ_ROLES = ["OWNER", "TEACHER", "ASSISTANT"];
const WRITE_ROLES = ["OWNER", "TEACHER"];
const DUPLICATE_SUFFIX = " (Copy)";
const QUIZ_TITLE_MAX_LENGTH = 150;

function ownQuizOrThrow(quizId, user) {
  const quiz = db.quizzes.findById(quizId);
  if (!quiz) throw { status: 404, message: "الكويز مش موجود" };
  if (quiz.organizationId !== user.organizationId) {
    throw { status: 403, message: "غير مصرح" };
  }
  return quiz;
}

function assertQuizEditable(quiz) {
  if (quiz.archived) {
    throw {
      status: 409,
      message: "الكويز المؤرشف مش قابل للتعديل. رجّعه من الأرشيف الأول.",
    };
  }
}

function questionStats(questions) {
  return {
    questionCount: questions.length,
    estimatedDurationSec: questions.reduce(
      (total, question) => total + (Number(question.timeLimitSec) || 0),
      0
    ),
  };
}

function legacyQuestions(quiz) {
  return Array.isArray(quiz?.questions) ? quiz.questions : [];
}

function toApiQuestion(quiz, question, index = 0) {
  return normalizeQuestion(
    { ...question, quiz: quiz.id, order: question.order ?? index },
    index
  );
}

function toApiQuiz(quiz, { includeQuestions = false } = {}) {
  const questions = legacyQuestions(quiz);
  const stats = questionStats(
    questions.map((question, index) => toApiQuestion(quiz, question, index))
  );

  const normalized = normalizeQuiz({
    ...quiz,
    status: quiz.archived ? "ARCHIVED" : "ACTIVE",
    ...stats,
    ...(includeQuestions ? { questions } : {}),
  });

  return normalized;
}

function toLegacyQuestion(payload, existing = {}) {
  const options = payload.options.map((option) => option.text);
  const correctOptionIndex = payload.options.findIndex(
    (option) => option.isCorrect
  );

  return {
    id: existing.id || `q-${crypto.randomUUID()}`,
    type: existing.type || "mcq",
    text: payload.text,
    options,
    correctOptionIndex,
    duration: payload.timeLimitSec,
    weight: payload.points,
    order: payload.order ?? existing.order ?? 0,
    explanation: "",
    source: existing.source || "manual",
    createdAt: existing.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
}

function mergedQuestionPayload(existing, patch) {
  const canonical = normalizeQuestion(existing);
  const form = questionToForm(canonical);

  return buildQuestionPayload({
    ...form,
    ...patch,
    options: patch.options ?? form.options,
    correctIndex: patch.correctIndex ?? form.correctIndex,
    points: patch.points ?? form.points,
    timeLimitSec: patch.timeLimitSec ?? form.timeLimitSec,
  });
}

function findQuestionOrThrow(quiz, questionId) {
  const question = legacyQuestions(quiz).find((item) => item.id === questionId);
  if (!question) throw { status: 404, message: "السؤال مش موجود" };
  return question;
}

export const quizMock = {
  async list({ search, q = "", archived = false, status } = {}) {
    await delay();
    const user = requireRole(...READ_ROLES);
    const wantedStatus = status ?? (archived ? "ARCHIVED" : "ACTIVE");

    let items = db.quizzes.findMany({ organizationId: user.organizationId });
    items = items.filter((quiz) => {
      const quizStatus = quiz.archived ? "ARCHIVED" : "ACTIVE";
      return wantedStatus === "ALL" || quizStatus === wantedStatus;
    });

    const term = String(search ?? q ?? "").trim().toLowerCase();
    if (term) {
      items = items.filter(
        (quiz) =>
          quiz.title.toLowerCase().includes(term) ||
          String(quiz.description || "").toLowerCase().includes(term)
      );
    }

    return {
      data: items
        .map((quiz) => toApiQuiz(quiz))
        .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0)),
    };
  },

  async getById(quizId) {
    await delay();
    const user = requireRole(...READ_ROLES);
    const quiz = ownQuizOrThrow(quizId, user);
    return { data: toApiQuiz(quiz, { includeQuestions: true }) };
  },

  async create(payload = {}) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const { title, description } = buildQuizPayload(payload);

    const quiz = db.quizzes.create({
      id: crypto.randomUUID(),
      organizationId: user.organizationId,
      title,
      description,
      questions: [],
      archived: false,
      createdBy: user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    broadcast.emit("quiz:created", { quizId: quiz.id });
    return { data: toApiQuiz(quiz) };
  },

  async update(quizId, patch = {}) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const quiz = ownQuizOrThrow(quizId, user);
    assertQuizEditable(quiz);

    const next = buildQuizPatch(patch);
    const updated = db.quizzes.update(quiz.id, {
      ...next,
      updatedAt: Date.now(),
    });

    broadcast.emit("quiz:updated", { quizId: updated.id });
    return { data: toApiQuiz(updated) };
  },

  async delete(quizId) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    ownQuizOrThrow(quizId, user);
    db.quizzes.delete(quizId);
    broadcast.emit("quiz:deleted", { quizId });
    return { data: { id: quizId } };
  },

  async duplicate(quizId) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const quiz = ownQuizOrThrow(quizId, user);

    const baseTitle =
      quiz.title.length > QUIZ_TITLE_MAX_LENGTH - DUPLICATE_SUFFIX.length
        ? quiz.title
            .slice(0, QUIZ_TITLE_MAX_LENGTH - DUPLICATE_SUFFIX.length)
            .trim()
        : quiz.title;

    const copy = db.quizzes.create({
      ...quiz,
      id: crypto.randomUUID(),
      title: `${baseTitle}${DUPLICATE_SUFFIX}`,
      questions: legacyQuestions(quiz).map((question) => ({
        ...question,
        id: `q-${crypto.randomUUID()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })),
      archived: false,
      createdBy: user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    broadcast.emit("quiz:created", { quizId: copy.id });
    return { data: toApiQuiz(copy, { includeQuestions: true }) };
  },

  async archive(quizId, archived = true) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const quiz = ownQuizOrThrow(quizId, user);
    const updated = db.quizzes.update(quiz.id, {
      archived: Boolean(archived),
      updatedAt: Date.now(),
    });

    broadcast.emit("quiz:updated", { quizId: updated.id });
    return { data: toApiQuiz(updated) };
  },

  async listQuestions(quizId) {
    await delay();
    const user = requireRole(...READ_ROLES);
    const quiz = ownQuizOrThrow(quizId, user);
    return {
      data: normalizeQuestionList(
        legacyQuestions(quiz).map((question, index) => ({
          ...question,
          quiz: quiz.id,
          order: question.order ?? index,
        }))
      ),
    };
  },

  async getQuestion(quizId, questionId) {
    await delay();
    const user = requireRole(...READ_ROLES);
    const quiz = ownQuizOrThrow(quizId, user);
    const question = findQuestionOrThrow(quiz, questionId);
    return { data: toApiQuestion(quiz, question) };
  },

  async addQuestion(quizId, payload = {}) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const quiz = ownQuizOrThrow(quizId, user);
    assertQuizEditable(quiz);

    const questions = legacyQuestions(quiz);
    const lastOrder = questions.reduce(
      (max, question, index) =>
        Math.max(max, Number.isInteger(question.order) ? question.order : index),
      -1
    );

    const clean = buildQuestionPayload({
      ...payload,
      order: payload.order ?? lastOrder + 1,
    });
    const question = toLegacyQuestion(clean);

    const updated = db.quizzes.update(quiz.id, {
      questions: [...questions, question],
      updatedAt: Date.now(),
    });

    broadcast.emit("quiz:updated", { quizId: updated.id });
    return { data: toApiQuestion(updated, question, questions.length) };
  },

  async updateQuestion(quizId, questionId, patch = {}) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const quiz = ownQuizOrThrow(quizId, user);
    assertQuizEditable(quiz);

    const existing = findQuestionOrThrow(quiz, questionId);
    const clean = mergedQuestionPayload(existing, patch);
    const merged = toLegacyQuestion(clean, existing);

    const updated = db.quizzes.update(quiz.id, {
      questions: legacyQuestions(quiz).map((question) =>
        question.id === questionId ? merged : question
      ),
      updatedAt: Date.now(),
    });

    broadcast.emit("quiz:updated", { quizId: updated.id });
    return { data: toApiQuestion(updated, merged) };
  },

  async deleteQuestion(quizId, questionId) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const quiz = ownQuizOrThrow(quizId, user);
    assertQuizEditable(quiz);
    findQuestionOrThrow(quiz, questionId);

    const updated = db.quizzes.update(quiz.id, {
      questions: legacyQuestions(quiz).filter(
        (question) => question.id !== questionId
      ),
      updatedAt: Date.now(),
    });

    broadcast.emit("quiz:updated", { quizId: updated.id });
    return { data: { id: questionId } };
  },
};
