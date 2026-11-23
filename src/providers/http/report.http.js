// src/providers/http/report.http.js
import { http } from "../../api/httpClient";
import { ok, pick } from "./response";

// The report page requests five slices in parallel. The backend exposes them
// through a single GET /sessions/:id/report call (plus the attendance endpoint
// for per-student attendance rows), so share one in-flight request per session.
const inFlight = new Map();

function fetchReport(sessionId) {
  const key = String(sessionId);

  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = http
    .get(`/sessions/${key}/report`)
    .then((body) => pick(body, "report"))
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

function toSummary(report) {
  const summary = report?.summary || {};
  const sessionSummary = report?.sessionSummary || {};

  return {
    totalParticipants:
      sessionSummary.totalParticipants ??
      sessionSummary.joinedParticipants ??
      summary.joinedParticipants ??
      summary.registeredParticipants ??
      0,
    totalQuestions:
      sessionSummary.totalQuestions ??
      report?.questionAnalysis?.length ??
      0,
    durationSeconds: Math.round((summary.gameDurationMs || 0) / 1000),
    averageScore: summary.averageScore ?? 0,
    correctPercentage: summary.accuracyPercentage ?? 0,
    topPlayers: (summary.topPlayers || []).map((player) => ({
      id: player.participant,
      name: player.name,
      score: player.score,
    })),
    hardestQuestion: summary.hardestQuestion
      ? {
          text: summary.hardestQuestion.text,
          correctPercentage: summary.hardestQuestion.accuracyPercentage,
          answersCount: summary.hardestQuestion.totalAnswers,
        }
      : null,
  };
}

function toQuestions(report) {
  return (report?.questionAnalysis || []).map((question) => ({
    questionId: question.questionId,
    questionIndex: (question.index ?? 0) + 1,
    text: question.text,
    answeredCount: question.totalAnswers,
    correctCount: question.correctAnswers,
    correctPercentage: question.accuracyPercentage,
    skippedCount: question.skippedCount,
    timedOutCount: 0,
    mostCommonWrong: question.mostCommonWrongOption
      ? {
          optionText: question.mostCommonWrongOption.text,
          count: question.mostCommonWrongOption.count,
        }
      : null,
  }));
}

function toStudents(report) {
  return (report?.studentResults || []).map((student, index) => ({
    studentId: student.student || student.participant,
    rank: student.finalRank ?? index + 1,
    name: student.name,
    score: student.gameScore ?? student.score ?? 0,
    correctAnswers: student.correctAnswers,
    wrongAnswers: student.incorrectAnswers,
    answeredQuestions: student.correctAnswers + student.incorrectAnswers,
    totalQuestions: student.totalQuestions,
    avgResponseMs: Math.round((student.averageResponseTime || 0) * 1000),
    highestStreak: student.bestStreak,
    attendanceStatus: student.status,
  }));
}

function toCommands(report) {
  return (report?.commands?.log || []).map((command) => ({
    id: command.id,
    command: String(command.type || "").toLowerCase(),
    actorName: command.actorName || command.actorNickname,
    targetName: command.targetName || command.targetNickname,
    value: command.value,
    questionIndex: command.questionIndex,
    createdAt: command.createdAt,
  }));
}

export const reportHttp = {
  async getSummary(sessionId) {
    const report = await fetchReport(sessionId);
    return ok(toSummary(report));
  },

  async getQuestions(sessionId) {
    const report = await fetchReport(sessionId);
    return ok(toQuestions(report));
  },

  async getStudents(sessionId) {
    const report = await fetchReport(sessionId);
    return ok(toStudents(report));
  },

  async getAttendance(sessionId) {
    const body = await http.get(`/sessions/${sessionId}/attendance`);
    const attendance = pick(body, "attendance");
    const rows = (attendance?.records || []).map((record) => ({
      name: record.name,
      answeredQuestions: record.answeredCount,
      totalQuestions: record.totalQuestions,
      durationSeconds: Math.round((record.durationMs || 0) / 1000),
      status: record.status,
    }));

    return ok(rows);
  },

  async getCommandLog(sessionId) {
    const report = await fetchReport(sessionId);
    return ok(toCommands(report));
  },

  async exportXlsx(sessionId) {
    const file = await http.requestBinary(`/sessions/${sessionId}/report/export`);

    return {
      data: {
        buffer: file.buffer,
        filename: file.filename || `session-${sessionId}-report.xlsx`,
      },
    };
  },
};
