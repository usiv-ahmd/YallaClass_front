// src/providers/mock/quiz.mock.js
import { db } from "./db";
import { broadcast } from "./broadcast";
import { delay, requireOrg, requireRole } from "./latency";

const CAN_EDIT = ["OWNER", "TEACHER", "ASSISTANT"];

function clampInt(v, min, max, fallback) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeQuestion(raw) {
  const options = Array.isArray(raw?.options) ? raw.options.map((o) => String(o)) : [];
  const type = raw?.type === "true_false" ? "true_false" : "mcq";
  const text = String(raw?.text ?? raw?.question ?? "").trim();
  const duration = clampInt(raw?.duration, 5, 120, 30);
  const weight = clampInt(raw?.weight, 1, 100, 10);

  const correctOptionIndex = Number.isInteger(raw?.correctOptionIndex) ? raw.correctOptionIndex : Number.isInteger(raw?.correctIndex) ? raw.correctIndex : options.findIndex((o) => o === raw?.correctAnswer);

  if (!text) throw { status: 400, message: "نص السؤال فاضي" };
  if (type === "mcq") {
    if (options.length < 2 || options.some((o) => !o)) {
      throw { status: 400, message: "كل الخيارات لازم تكون مكتوبة (٢ على الأقل)" };
    }
    if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      throw { status: 400, message: "لازم تختار إجابة صحيحة" };
    }
  }

  return {
    id: raw?.id || `q-${crypto.randomUUID()}`,
    type,
    text,
    options: type === "true_false" ? ["صح", "غلط"] : options,
    correctOptionIndex: type === "true_false" ? (correctOptionIndex === 1 ? 1 : 0) : correctOptionIndex,
    duration,
    weight,
    explanation: raw?.explanation ? String(raw.explanation).trim() : "",
    source: "manual",
    createdAt: raw?.createdAt || Date.now(),
  };
}

function ownQuizOrThrow(quizId, user) {
  const quiz = db.quizzes.findById(quizId);
  if (!quiz) throw { status: 404, message: "الكويز مش موجود" };
  if (quiz.organizationId !== user.organizationId) {
    throw { status: 403, message: "غير مصرح" };
  }
  return quiz;
}

export const quizMock = {
  async list({ q = "", archived = false, tag = null } = {}) {
    await delay();
    const user = requireOrg();
    let items = db.quizzes.findMany({ organizationId: user.organizationId });
    items = items.filter((quiz) => Boolean(quiz.archived) === Boolean(archived));

    if (tag) {
      items = items.filter((quiz) => (quiz.tags || []).includes(tag));
    }

    const term = String(q || "").trim().toLowerCase();
    if (term) {
      items = items.filter((quiz) => quiz.title.toLowerCase().includes(term) || (quiz.subject || "").toLowerCase().includes(term) || (quiz.tags || []).some((t) => t.toLowerCase().includes(term)));
    }

    return {
      data: items
        .map((quiz) => ({ ...quiz, questionCount: (quiz.questions || []).length }))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    };
  },

  async getById(quizId) {
    await delay();
    const user = requireOrg();
    const quiz = ownQuizOrThrow(quizId, user);
    return { data: { ...quiz, questionCount: (quiz.questions || []).length } };
  },

  async create({ title, subject, tags = [] } = {}) {
    await delay();
    const user = requireRole(...CAN_EDIT);
    const cleanTitle = String(title || "").trim();
    if (cleanTitle.length < 2) {
      throw { status: 400, message: "اسم الكويز قصير أوي" };
    }

    const quiz = db.quizzes.create({
      id: crypto.randomUUID(),
      organizationId: user.organizationId,
      title: cleanTitle,
      subject: String(subject || "").trim(),
      tags: Array.isArray(tags) ? tags.map(String) : [],
      questions: [],
      archived: false,
      createdBy: user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    broadcast.emit("quiz:created", { quizId: quiz.id });
    return { data: quiz };
  },

  async update(quizId, patch = {}) {
    await delay();
    const user = requireRole(...CAN_EDIT);
    const quiz = ownQuizOrThrow(quizId, user);

    const next = {};
    if (patch.title !== undefined) {
      const clean = String(patch.title).trim();
      if (clean.length < 2) throw { status: 400, message: "اسم الكويز قصير أوي" };
      next.title = clean;
    }
    if (patch.subject !== undefined) {
      next.subject = String(patch.subject || "").trim();
    }
    if (patch.tags !== undefined) {
      if (!Array.isArray(patch.tags)) throw { status: 400, message: "tags لازم تكون array" };
      next.tags = patch.tags.map(String);
    }

    if (Object.keys(next).length === 0) return { data: quiz };

    const updated = db.quizzes.update(quiz.id, { ...next, updatedAt: Date.now() });
    broadcast.emit("quiz:updated", { quizId: updated.id });
    return { data: updated };
  },

  async delete(quizId) {
    await delay();
    const user = requireRole(...CAN_EDIT);
    ownQuizOrThrow(quizId, user);
    db.quizzes.delete(quizId);
    broadcast.emit("quiz:deleted", { quizId });
    return { data: { ok: true } };
  },

  async duplicate(quizId) {
    await delay();
    const user = requireRole(...CAN_EDIT);
    const quiz = ownQuizOrThrow(quizId, user);

    const copy = db.quizzes.create({
      ...quiz,
      id: crypto.randomUUID(),
      title: `${quiz.title} (نسخة)`,
      questions: (quiz.questions || []).map((q) => ({ ...q, id: `q-${crypto.randomUUID()}` })),
      archived: false,
      createdBy: user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    broadcast.emit("quiz:created", { quizId: copy.id });
    return { data: copy };
  },

  async archive(quizId, archived = true) {
    await delay();
    const user = requireRole(...CAN_EDIT);
    const quiz = ownQuizOrThrow(quizId, user);
    const updated = db.quizzes.update(quiz.id, { archived: Boolean(archived), updatedAt: Date.now() });
    broadcast.emit("quiz:updated", { quizId: updated.id });
    return { data: updated };
  },

  async updateQuestions(quizId, questions) {
    await delay();
    const user = requireRole(...CAN_EDIT);
    const quiz = ownQuizOrThrow(quizId, user);
    if (!Array.isArray(questions)) {
      throw { status: 400, message: "questions لازم تكون array" };
    }

    const existingById = new Map((quiz.questions || []).map((q) => [q.id, q]));
    const next = questions.map((raw) => {
      const merged = raw?.id && existingById.has(raw.id) ? { ...existingById.get(raw.id), ...raw } : raw;
      return normalizeQuestion(merged);
    });

    const updated = db.quizzes.update(quiz.id, { questions: next, updatedAt: Date.now() });
    broadcast.emit("quiz:updated", { quizId: updated.id });
    return { data: updated };
  },

  async addQuestion(quizId, raw) {
    await delay();
    const user = requireRole(...CAN_EDIT);
    const quiz = ownQuizOrThrow(quizId, user);
    const question = normalizeQuestion(raw);
    const updated = db.quizzes.update(quiz.id, { questions: [...(quiz.questions || []), question], updatedAt: Date.now() });
    broadcast.emit("quiz:updated", { quizId: updated.id });
    return { data: question };
  },

  async updateQuestion(quizId, questionId, raw) {
    await delay();
    const user = requireRole(...CAN_EDIT);
    const quiz = ownQuizOrThrow(quizId, user);
    const existing = (quiz.questions || []).find((q) => q.id === questionId);
    if (!existing) throw { status: 404, message: "السؤال مش موجود" };

    const merged = normalizeQuestion({ ...existing, ...raw, id: existing.id });
    db.quizzes.update(quiz.id, { questions: (quiz.questions || []).map((q) => (q.id === questionId ? merged : q)), updatedAt: Date.now() });
    broadcast.emit("quiz:updated", { quizId });
    return { data: merged };
  },

  async deleteQuestion(quizId, questionId) {
    await delay();
    const user = requireRole(...CAN_EDIT);
    const quiz = ownQuizOrThrow(quizId, user);
    const updated = db.quizzes.update(quiz.id, { questions: (quiz.questions || []).filter((q) => q.id !== questionId), updatedAt: Date.now() });
    broadcast.emit("quiz:updated", { quizId: updated.id });
    return { data: { ok: true } };
  },
};