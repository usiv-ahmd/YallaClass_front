// src/utils/reactions.js
import { STATE_REACTIONS } from "../constants/reactions.js";

export function pickStateReaction(liveState) {
  return STATE_REACTIONS[liveState] ?? null;
}