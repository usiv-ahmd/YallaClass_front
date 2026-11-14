// src/providers/http/report.http.js
function notConnected(method) {
  return async () => {
    throw {
      status: 0,
      message: `[http:report] ${method}() — backend not connected`,
    };
  };
}

export const reportHttp = {
  getSummary: notConnected("getSummary"),
  getQuestions: notConnected("getQuestions"),
  getStudents: notConnected("getStudents"),
  getAttendance: notConnected("getAttendance"),
  getCommandLog: notConnected("getCommandLog"),
  exportXlsx: notConnected("exportXlsx"),
};