// src/hooks/useAvatarReaction.js
import { useMemo } from "react";

const BASE_BY_LIVE_STATE = {
  lobby: "idle",
  countdown: "yalla",
  question: "focus",
  paused: "wait",
  reveal: "focus",
  explanation: "focus",
  leaderboard: "focus",
  finished: "hero",
};

export function useAvatarReaction({ reactionKey, liveState }) {
  return useMemo(() => {
    if (reactionKey) return reactionKey;
    return BASE_BY_LIVE_STATE[liveState] ?? "idle";
  }, [reactionKey, liveState]);
}