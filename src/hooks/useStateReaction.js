// hooks/useStateReaction.js
import { useEffect } from "react";
import { pickStateReaction } from "../utils/reactions.js";

export function useStateReaction({ isLive, liveState, sessionId, onTrigger }) {
  const effective = isLive ? liveState : "not-started";
  useEffect(() => {
    if (!sessionId) return;
    const key = pickStateReaction(effective);
    if (key) onTrigger?.(key);
  }, [effective, sessionId, onTrigger]);
}