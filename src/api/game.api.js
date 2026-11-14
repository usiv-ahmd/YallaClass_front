// src/api/game.api.js
import { client } from "./client";

export const gameApi = {
  submitAnswer: (payload) => client.game.submitAnswer(payload),
};