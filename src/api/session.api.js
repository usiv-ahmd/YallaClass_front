// src/api/session.api.js
import { client } from "./client";

export const sessionApi = {
  list: (params) => client.session.list(params),
  getById: (id) => client.session.getById(id),
  getLobby: (id) => client.session.getLobby(id),
  getPublicById: (id) => client.session.getPublicById(id),
  getByCode: (code) => client.session.getByCode(code),
  create: (payload) => client.session.create(payload),

  updateCommandSettings: (id, settings) =>
    client.session.updateCommandSettings(id, settings),
  updatePhaseSettings: (id, settings) =>
    client.session.updatePhaseSettings(id, settings),
  updateSettings: (id, patch) => client.session.updateSettings(id, patch),
  lockJoining: (id, allow) => client.session.lockJoining(id, allow),

  join: (payload) => client.session.join(payload),
  reconnect: (code, token) => client.session.reconnect(code, token),
  leave: (id, studentId) => client.session.leave(id, studentId),
  heartbeat: (id, studentId) => client.session.heartbeat(id, studentId),
  markSeen: (id, studentId, qid) => client.session.markSeen(id, studentId, qid),
  kick: (id, participantId) => client.session.kickParticipant(id, participantId),
  kickParticipant: (id, participantId) =>
    client.session.kickParticipant(id, participantId),

  start: (id) => client.session.start(id),
  pause: (id) => client.session.pause(id),
  resume: (id) => client.session.resume(id),
  reveal: (id) => client.session.reveal(id),
  next: (id) => client.session.next(id),
  skip: (id) => client.session.skip(id),
  finish: (id) => client.session.finish(id),
  end: (id) => client.session.finish(id),
};
