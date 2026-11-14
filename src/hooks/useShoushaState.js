// src/hooks/useShoushaState.js
import { useEffect, useMemo, useState } from "react";

export function useShoushaState({ liveState, currentAnswer, student, timeLeft = 0, duration = 0, rank, totalPlayers = 0 }) {
  const [tempState, setTempState] = useState(null);

  useEffect(() => {
    if (!currentAnswer) return;

    const streak = currentAnswer.streak ?? student?.currentStreak ?? 0;
    let next;
    if (currentAnswer.isCorrect) {
      if (streak >= 5) next = "legend";
      else if (streak >= 3) next = "fire";
      else if (streak === 2) next = "gamed";
      else next = "aash";
    } else {
      next = "wrong";
    }
    setTempState(next);
    const t = setTimeout(() => setTempState(null), 1800);
    return () => clearTimeout(t);
  }, [currentAnswer?.id]);

  return useMemo(() => {
    if (tempState) return tempState;

    if (liveState === "lobby") return "yalla";
    if (liveState === "countdown") return "surprise";
    if (liveState === "paused") return "wait";

    if (liveState === "finished") {
      return (student?.highestStreak ?? 0) >= 5 ? "hero" : "keepgoing";
    }

    if (liveState === "question") {
      if (duration > 0 && timeLeft > 0 && timeLeft <= 4) return "hurry";
      if (rank === 2 && totalPlayers > 2) return "close";
      return "focus";
    }

    if (liveState === "reveal") {
      if (currentAnswer?.isCorrect) return "aash";
      if (currentAnswer && !currentAnswer.isCorrect) return "wrong";
      return "idle";
    }

    return "idle";
  }, [tempState, liveState, timeLeft, duration, rank, totalPlayers, currentAnswer, student?.highestStreak]);
}

export function getStudentShoushaState(student, rank) {
  if (rank === 1) return "hero";
  const streak = student?.highestStreak ?? 0;
  if (streak >= 5) return "legend";
  if (streak >= 3) return "fire";
  if (streak >= 2) return "gamed";
  return "idle";
}