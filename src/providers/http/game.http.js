// src/providers/http/game.http.js
import { notImplemented } from "./not-implemented";

export const gameHttp = {
  // Answers are submitted through Socket.IO and scored by the game engine.
  // There is no REST endpoint for this operation.
  submitAnswer: notImplemented(
    "game",
    "submitAnswer",
    "Answer submission is handled over Socket.IO (Phase 4/5)."
  ),
};
