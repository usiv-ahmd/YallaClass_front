// src/providers/http/game.http.js
function notConnected(method) {
  return async () => {
    throw {
      status: 0,
      message: `[http:game] ${method}() — backend not connected`,
    };
  };
}

export const gameHttp = {
  submitAnswer: notConnected("submitAnswer"),
};