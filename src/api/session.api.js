// src/api/session.api.js
import { client } from "./client";

export const sessionApi = {
  list: () => client.session.list(),
  getById: (id) => client.session.getById(id),
  getPublicById: (id) => client.session.getPublicById(id),
  getByCode: (code) => client.session.getByCode(code),
  create: (payload) => client.session.create(payload),
  updateSettings: (id, patch) => client.session.updateSettings(id, patch),
  lockJoining: (id, allow) => client.session.lockJoining(id, allow),

  join: (payload) => client.session.join(payload),
  leave: (id, studentId) => client.session.leave(id, studentId),
  heartbeat: (id, studentId) => client.session.heartbeat(id, studentId),
  markSeen: (id, studentId, qid) => client.session.markSeen(id, studentId, qid),
  kick: (id, studentId) => client.session.kickStudent(id, studentId),

  start: (id) => client.session.start(id),
  cancelCountdown: (id) => client.session.cancelCountdown(id),
  startQuestion: (id) => client.session.startQuestion(id),
  pause: (id) => client.session.pause(id),
  resume: (id) => client.session.resume(id),
  reveal: (id) => client.session.reveal(id),
  showExplanation: (id) => client.session.showExplanation(id),
  showLeaderboard: (id) => client.session.showLeaderboard(id),
  next: (id) => client.session.next(id),
  finishRound: (id) => client.session.finishRound(id),
  end: (id) => client.session.end(id),

  submitAnswer: (payload) => client.session.submitAnswer(payload),
  useCommand: (payload) => client.session.useCommand(payload),
};