// src/hooks/useSessionLive.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { sessionApi } from "../api/session.api";
import { useSession } from "../store/session.store.jsx";

export function useSessionLive(sessionId) {
  const {
    session,
    loading,
    error,
    refresh,
    lockJoining,
    updateSettings,
    kickStudent,
  } = useSession(sessionId);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const liveState = session?.live?.state;

  useEffect(() => {
    if (liveState !== "question") return;
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, [liveState]);

  const currentQuestion = useMemo(() => {
    if (!session?.questions || !session.live) return null;
    return session.questions[session.live.currentQuestionIndex] ?? null;
  }, [session?.questions, session?.live?.currentQuestionIndex]);

  const timeLeft = useMemo(() => {
    if (!session?.live) return 0;
    if (session.live.state !== "question") return session.live.timeLeft ?? 0;
    if (!session.live.startedAt || !currentQuestion) {
      return session.live.timeLeft ?? 0;
    }
    const elapsedSec = (now - session.live.startedAt) / 1000;
    return Math.max(0, currentQuestion.duration - elapsedSec);
  }, [session?.live, currentQuestion, now]);

  const isLastQuestion = useMemo(() => {
    if (!session?.questions || !session.live) return false;
    return session.live.currentQuestionIndex >= session.questions.length - 1;
  }, [session?.questions, session?.live?.currentQuestionIndex]);

  const run = useCallback(
    async (fn) => {
      setBusy(true);
      setActionError(null);
      try {
        const res = await fn();
        if (res?.data) refresh();
        return res;
      } catch (e) {
        setActionError(e.message || "تعذّرت العملية");
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  return {
    session,
    loading,
    error,
    actionError,
    busy,

    currentQuestion,
    timeLeft,
    isLastQuestion,
    students: session?.students || [],
    liveState,
    isLive: session?.live?.isLive ?? false,
    allowJoining: session?.settings?.allowJoining ?? true,
    currentQuestionIndex: session?.live?.currentQuestionIndex ?? 0,
    totalQuestions: session?.questions?.length ?? 0,

    lockJoining,
    updateSettings,
    kickStudent,

    start: () => run(() => sessionApi.start(sessionId)),
    cancelCountdown: () => run(() => sessionApi.cancelCountdown(sessionId)),
    startQuestion: () => run(() => sessionApi.startQuestion(sessionId)),
    pause: () => run(() => sessionApi.pause(sessionId)),
    resume: () => run(() => sessionApi.resume(sessionId)),
    reveal: () => run(() => sessionApi.reveal(sessionId)),
    showExplanation: () => run(() => sessionApi.showExplanation(sessionId)),
    showLeaderboard: () => run(() => sessionApi.showLeaderboard(sessionId)),
    next: () => run(() => sessionApi.next(sessionId)),
    finishRound: () => run(() => sessionApi.finishRound(sessionId)),
    end: () => run(() => sessionApi.end(sessionId)),
  };
}