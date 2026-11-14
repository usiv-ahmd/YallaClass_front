// src/providers/http/quiz.http.js
function notConnected(method) {
  return async () => {
    throw {
      status: 0,
      message: `[http:quiz] ${method}() — backend not connected`,
    };
  };
}

export const quizHttp = {
  list: notConnected("list"),
  getById: notConnected("getById"),
  create: notConnected("create"),
  update: notConnected("update"),
  delete: notConnected("delete"),
  duplicate: notConnected("duplicate"),
  archive: notConnected("archive"),
  updateQuestions: notConnected("updateQuestions"),
  addQuestion: notConnected("addQuestion"),
  updateQuestion: notConnected("updateQuestion"),
  deleteQuestion: notConnected("deleteQuestion"),
};