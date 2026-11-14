// src/hooks/useReaction.js
import { useCallback, useEffect, useRef, useState } from "react";
import { REACTION_PRIORITY, streakToReaction } from "../constants/reactions.js";

function pickHighest(keys) {
  return keys.reduce(
    (best, k) =>
      (REACTION_PRIORITY[k] || 0) > (REACTION_PRIORITY[best] || 0) ? k : best,
    keys[0]
  );
}

export function useReaction({
  liveState,
  answerState = "pending",
  score = 0,
  questionKey,
}) {
  const [current, setCurrent] = useState(null);
  const [queue, setQueue] = useState([]);
  const [triggerId, setTriggerId] = useState(0);

  const prev = useRef({
    liveState: null,
    answerState: "pending",
    questionKey: null,
    streak: 0,
  });

  useEffect(() => {
    const candidates = [];
    const prevAnswerState = prev.current.answerState;

    if (questionKey !== prev.current.questionKey) {
      prev.current.questionKey = questionKey;
      prev.current.answerState = "pending";
    }

    if (liveState !== prev.current.liveState) {
      const from = prev.current.liveState;
      const to = liveState;

      if (to === "countdown") candidates.push("yalla");
      if (to === "finished") candidates.push("hero");
      if (to === "paused") candidates.push("wait");

      if (to === "question") {
        if (from === "paused") candidates.push("go");
        else if (prevAnswerState === "wrong") candidates.push("go");
        else candidates.push("focus");
      }

      if (to === "lobby" && from === "finished") candidates.push("surprise");

      prev.current.liveState = liveState;
    }

    if (answerState !== prev.current.answerState) {
      if (answerState === "correct") {
        const nextStreak = prev.current.streak + 1;
        const key = streakToReaction(nextStreak);

        prev.current.streak = nextStreak;
        if (key) candidates.push(key);
      } else if (answerState === "wrong") {
        prev.current.streak = 0;
        candidates.push("close");
      }

      prev.current.answerState = answerState;
    }

    if (candidates.length > 0) {
      const top = pickHighest(candidates);

      setQueue((q) => [...q, top]);
    }
  }, [liveState, answerState, questionKey]);

  useEffect(() => {
    const [next, ...rest] = queue;

    if (current || queue.length === 0) return;

    setQueue(rest);
    setCurrent(next);
    setTriggerId((id) => id + 1);
  }, [current, queue]);

  const onDone = useCallback(() => setCurrent(null), []);

  return { reactionKey: current, triggerId, onDone };
}