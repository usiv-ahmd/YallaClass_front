// src/api/quiz.api.js
import { client } from "./client";

export const quizApi = {
  list: (params) => client.quiz.list(params),
  getById: (quizId) => client.quiz.getById(quizId),
  create: (payload) => client.quiz.create(payload),
  update: (quizId, patch) => client.quiz.update(quizId, patch),
  delete: (quizId) => client.quiz.delete(quizId),
  duplicate: (quizId) => client.quiz.duplicate(quizId),
  archive: (quizId, archived) => client.quiz.archive(quizId, archived),

  updateQuestions: (quizId, questions) => client.quiz.updateQuestions(quizId, questions),
  addQuestion: (quizId, question) => client.quiz.addQuestion(quizId, question),
  updateQuestion: (quizId, qid, patch) => client.quiz.updateQuestion(quizId, qid, patch),
  deleteQuestion: (quizId, qid) => client.quiz.deleteQuestion(quizId, qid),
};