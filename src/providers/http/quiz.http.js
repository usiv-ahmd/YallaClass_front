// src/providers/http/quiz.http.js
import { http } from "../../api/httpClient";
import { ok, pick } from "./response";
import {
  buildQuestionPayload,
  buildQuizPatch,
  buildQuizPayload,
  normalizeQuestion,
  normalizeQuestionList,
  normalizeQuiz,
  normalizeQuizList,
} from "../../adapters/quiz.adapter.js";

function requireQuizId(quizId) {
  if (!quizId) {
    const error = new Error("Quiz id is required");
    error.status = 400;
    throw error;
  }
}

function requireQuestionId(questionId) {
  if (!questionId) {
    const error = new Error("Question id is required");
    error.status = 400;
    throw error;
  }
}

export const quizHttp = {
  async list(params = {}) {
    const query = new URLSearchParams();
    const status = params.status ?? (params.archived ? "ARCHIVED" : "ACTIVE");

    query.set("status", status);

    if (params.search) {
      query.set("search", params.search);
    }

    const body = await http.get(`/quizzes?${query.toString()}`);
    return ok(normalizeQuizList(pick(body, "quizzes") ?? []));
  },

  async getById(quizId) {
    requireQuizId(quizId);
    const body = await http.get(`/quizzes/${quizId}`);
    return ok(normalizeQuiz(pick(body, "quiz")));
  },

  async create(payload = {}) {
    const body = await http.post("/quizzes", buildQuizPayload(payload));
    return ok(normalizeQuiz(pick(body, "quiz")));
  },

  async update(quizId, patch = {}) {
    requireQuizId(quizId);
    const body = await http.patch(`/quizzes/${quizId}`, buildQuizPatch(patch));
    return ok(normalizeQuiz(pick(body, "quiz")));
  },

  async delete(quizId) {
    requireQuizId(quizId);
    const body = await http.delete(`/quizzes/${quizId}`);
    return ok(pick(body, "id") ?? quizId);
  },

  async duplicate(quizId) {
    requireQuizId(quizId);
    const body = await http.post(`/quizzes/${quizId}/duplicate`);
    return ok(normalizeQuiz(pick(body, "quiz")));
  },

  async archive(quizId, archived) {
    requireQuizId(quizId);
    const action = archived ? "archive" : "unarchive";
    const body = await http.patch(`/quizzes/${quizId}/${action}`);
    return ok(normalizeQuiz(pick(body, "quiz")));
  },

  async listQuestions(quizId) {
    requireQuizId(quizId);
    const body = await http.get(`/quizzes/${quizId}/questions`);
    return ok(normalizeQuestionList(pick(body, "questions") ?? []));
  },

  async getQuestion(quizId, questionId) {
    requireQuizId(quizId);
    requireQuestionId(questionId);
    const body = await http.get(`/quizzes/${quizId}/questions/${questionId}`);
    return ok(normalizeQuestion(pick(body, "question")));
  },

  async addQuestion(quizId, payload = {}) {
    requireQuizId(quizId);
    const body = await http.post(
      `/quizzes/${quizId}/questions`,
      buildQuestionPayload(payload)
    );
    return ok(normalizeQuestion(pick(body, "question")));
  },

  async updateQuestion(quizId, questionId, patch = {}) {
    requireQuizId(quizId);
    requireQuestionId(questionId);
    const body = await http.patch(
      `/quizzes/${quizId}/questions/${questionId}`,
      buildQuestionPayload(patch)
    );
    return ok(normalizeQuestion(pick(body, "question")));
  },

  async deleteQuestion(quizId, questionId) {
    requireQuizId(quizId);
    requireQuestionId(questionId);
    const body = await http.delete(
      `/quizzes/${quizId}/questions/${questionId}`
    );
    return ok(pick(body, "id") ?? questionId);
  },
};
