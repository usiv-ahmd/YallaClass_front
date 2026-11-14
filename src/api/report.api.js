// src/api/report.api.js
import { client } from "./client";

export const reportApi = {
  getSummary: (sessionId) => client.report.getSummary(sessionId),
  getQuestions: (sessionId) => client.report.getQuestions(sessionId),
  getStudents: (sessionId) => client.report.getStudents(sessionId),
  getAttendance: (sessionId) => client.report.getAttendance(sessionId),
  getCommandLog: (sessionId) => client.report.getCommandLog(sessionId),
  exportXlsx: (sessionId) => client.report.exportXlsx(sessionId),
};