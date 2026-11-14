// src/providers/http/session.http.js
function notConnected(method) {
  return async () => {
    throw {
      status: 0,
      message: `[http:session] ${method}() — backend not connected`,
    };
  };
}

export const sessionHttp = {
  list: notConnected("list"),
  getById: notConnected("getById"),
  getByCode: notConnected("getByCode"),
  create: notConnected("create"),
  updateSettings: notConnected("updateSettings"),
  lockJoining: notConnected("lockJoining"),

  join: notConnected("join"),
  leave: notConnected("leave"),
  heartbeat: notConnected("heartbeat"),
  markSeen: notConnected("markSeen"),
  kickStudent: notConnected("kickStudent"),

  start: notConnected("start"),
  cancelCountdown: notConnected("cancelCountdown"),
  startQuestion: notConnected("startQuestion"),
  pause: notConnected("pause"),
  resume: notConnected("resume"),
  reveal: notConnected("reveal"),
  showExplanation: notConnected("showExplanation"),
  showLeaderboard: notConnected("showLeaderboard"),
  next: notConnected("next"),
  finishRound: notConnected("finishRound"),
  end: notConnected("end"),

  submitAnswer: notConnected("submitAnswer"),
  useCommand: notConnected("useCommand"),
};