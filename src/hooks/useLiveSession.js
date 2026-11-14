// src/hooks/useLiveSession.js
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { liveOps } from "../sessionStore";
import { LIVE_STATES, REVEAL_AUTO_MS } from "../constants/live.js";

export function useLiveSession(session, setSession) {
  const [isLive, setIsLive]                     = useState(session?.live?.isLive ?? false);
  const [liveState, setLiveState]               = useState(session?.live?.state ?? "lobby");
  const [currentQuestionIndex, setCurrentQIdx]  = useState(session?.live?.currentQuestionIndex ?? 0);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
  const [reopenOpen, setReopenOpen]             = useState(false);
  const [now, setNow]                           = useState(() => Date.now());
  const [autoAdvanceRemaining, setAutoAdvanceRemaining] = useState(null);
  const [pendingNext, setPendingNext] = useState(false);

  const sessionId = session?.id;

  const rawQuestions = session?.questions;
  const questions = Array.isArray(rawQuestions)
    ? rawQuestions
    : rawQuestions ? Object.values(rawQuestions) : [];
  const totalQuestions          = questions.length;
  const currentQuestion         = questions[currentQuestionIndex] ?? null;
  const currentQuestionDuration = Number(currentQuestion?.duration) || 30;
  const isLastQuestion          = currentQuestionIndex >= totalQuestions - 1;
  const statusView              = LIVE_STATES[liveState] ?? LIVE_STATES.lobby;
  const allowAnswerEdit         = session?.reopenedFor?.allowEdit ?? false;

  const students                = session?.students ?? [];
  const studentAnswers          = session?.answers ?? {};

  const autoAdvance = session?.live?.autoAdvance ?? true;

  useEffect(() => {
    if (liveState !== "question") return;
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(i);
  }, [liveState]);

  const timeLeft = useMemo(() => {
    const live = session?.live;
    if (!live) return 0;
    if (live.state !== "question") return live.timeLeft ?? 0;
    if (!live.startedAt) return live.timeLeft ?? 0;
    const elapsed = Math.floor((now - live.startedAt) / 1000);
    return Math.max(0, currentQuestionDuration - elapsed);
  }, [session?.live, now, currentQuestionDuration]);

  useEffect(() => {
    if (!session?.id) return;
    setIsLive(session.live?.isLive ?? false);
    setLiveState(session.live?.state ?? "lobby");
    setCurrentQIdx(session.live?.currentQuestionIndex ?? 0);
    setIsEndConfirmOpen(false);
    setReopenOpen(false);
  }, [session?.id]);

  useEffect(() => {
    if (!session?.live) return;
    setIsLive(session.live.isLive ?? false);
    setLiveState(session.live.state ?? "lobby");
    setCurrentQIdx(session.live.currentQuestionIndex ?? 0);
  }, [session?.live?.isLive, session?.live?.state, session?.live?.currentQuestionIndex]);

  const stateRef = useRef(liveState);
  const indexRef = useRef(currentQuestionIndex);
  useEffect(() => { stateRef.current = liveState; }, [liveState]);
  useEffect(() => { indexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);

  const reopenModal = useMemo(() => ({
    isOpen: reopenOpen,
    open:   () => setReopenOpen(true),
    close:  () => setReopenOpen(false),
  }), [reopenOpen]);

  const pendingStudents       = students.filter((s) => !s.isFinished);
  const finishedStudentsCount = students.length - pendingStudents.length;
  const reopenedStudentsCount =
    session?.reopenedStudentsCount
    ?? session?.reopenedFor?.studentIds?.length
    ?? 0;

  const canTransitionTo = useCallback((target) =>
    (LIVE_STATES[liveState]?.canGoTo ?? []).includes(target), [liveState]);
  const canPause  = liveState === "question";
  const canResume = liveState === "paused";
  const canReveal = liveState === "question" || liveState === "paused";
  const canNext   = liveState === "reveal";
  const canFinish = liveState === "paused" || liveState === "reveal" ||
                    (liveState === "question" && isLastQuestion);

  const apply = (updated) => {
    if (!updated) return false;
    setSession(updated);
    if (updated.live) {
      setIsLive(updated.live.isLive ?? false);
      setLiveState(updated.live.state ?? "lobby");
      setCurrentQIdx(updated.live.currentQuestionIndex ?? 0);
    }
    return true;
  };

  const startLiveSession = async () => {
    if (!session)             { alert("اعمل الحصة الأول."); return false; }
    if (totalQuestions === 0) { alert("ضيف سؤال واحد على الأقل."); return false; }
    return apply(await liveOps.start(sessionId));
  };
  const startCountdown  = async () => apply(await liveOps.startCountdown(sessionId));
  const cancelCountdown = async () => apply(await liveOps.cancelCountdown(sessionId));

  const startQuestion = async () => {
    if (!canTransitionTo("question")) return false;
    return apply(await liveOps.startQuestion(sessionId));
  };

  const pauseQuestion  = async () => apply(await liveOps.pauseQuestion(sessionId));
  const resumeQuestion = async () => apply(await liveOps.resumeQuestion(sessionId));
  const revealAnswer   = async () => apply(await liveOps.revealAnswer(sessionId));

  const nextQuestion = async () => {
    if (liveState !== "reveal") return false;
    if (isLastQuestion) return finishSession();
    return apply(await liveOps.nextQuestion(sessionId));
  };

  const requestNextQuestion = async () => {
    if (liveState === "reveal") {
      setPendingNext(false);
      return nextQuestion();
    }
    if (!canReveal) return false;
    setPendingNext(true);
    return revealAnswer();
  };

  const finishSession = async () => {
    setPendingNext(false);
    return apply(await liveOps.finishRound(sessionId));
  };

  const confirmReopen = async (allowEdit = false) => {
    if (liveState !== "finished" || pendingStudents.length === 0) return false;
    const ok = apply(await liveOps.reopen(sessionId, allowEdit));
    if (ok) setReopenOpen(false);
    return ok;
  };

  const closeReopenedRound = async () => {
    if (liveState !== "reopened") return false;
    return apply(await liveOps.closeReopened(sessionId));
  };

  const setAllowAnswerEdit = async (value) => apply(await liveOps.setAllowEdit(sessionId, value));

  const setAutoAdvance = async (value) => {
    const ok = apply(await liveOps.setAutoAdvance(sessionId, value));
    if (!value) setAutoAdvanceRemaining(null);
    return ok;
  };

  const revealedRef = useRef(-1);
  useEffect(() => {
    if (!autoAdvance) return;
    if (liveState !== "question") return;
    if (totalQuestions === 0) return;
    if (timeLeft > 0) return;
    if (revealedRef.current === currentQuestionIndex) return;
    revealedRef.current = currentQuestionIndex;
    revealAnswer();
  }, [liveState, timeLeft, totalQuestions, currentQuestionIndex, autoAdvance]);

  useEffect(() => {
    revealedRef.current = -1;
  }, [currentQuestionIndex, session?.id]);

  const autoAdvanceTimerRef = useRef(null);
  const advancedRef = useRef(-1);

  useEffect(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    if (!autoAdvance && !pendingNext) { setAutoAdvanceRemaining(null); return; }
    if (liveState !== "reveal") { setAutoAdvanceRemaining(null); return; }
    if (advancedRef.current === currentQuestionIndex) {
      setAutoAdvanceRemaining(null);
      return;
    }

    const totalSeconds = Math.ceil(REVEAL_AUTO_MS / 1000);
    setAutoAdvanceRemaining(totalSeconds);

    const tickInterval = setInterval(() => {
      setAutoAdvanceRemaining((v) => (v === null ? null : Math.max(0, v - 1)));
    }, 1000);

    autoAdvanceTimerRef.current = setTimeout(() => {
      autoAdvanceTimerRef.current = null;
      clearInterval(tickInterval);
      setAutoAdvanceRemaining(null);

      if (stateRef.current !== "reveal") return;
      if (indexRef.current !== currentQuestionIndex) return;
      if (advancedRef.current === currentQuestionIndex) return;

      advancedRef.current = currentQuestionIndex;

      if (isLastQuestion) {
        finishSession();
      } else {
        nextQuestion();
      }
    }, REVEAL_AUTO_MS);

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      clearInterval(tickInterval);
    };
  }, [liveState, currentQuestionIndex, autoAdvance, pendingNext, isLastQuestion]);

  useEffect(() => {
    advancedRef.current = -1;
    setPendingNext(false);
  }, [currentQuestionIndex, session?.id]);

  const requestEndLive = () => setIsEndConfirmOpen(true);
  const cancelEndLive  = () => setIsEndConfirmOpen(false);
  const confirmEndLive = async () => {
    apply(await liveOps.end(sessionId));
    setIsEndConfirmOpen(false);
    setReopenOpen(false);
    setAutoAdvanceRemaining(null);
  };

  const restartRound = () => {
    setCurrentQIdx(0);
    setLiveState("lobby");
    setAutoAdvanceRemaining(null);
  };

  const goToState = async (target) => {
    if (!canTransitionTo(target)) return false;
    switch (target) {
      case "countdown": return startCountdown();
      case "lobby":     return liveState === "countdown" ? cancelCountdown() : false;
      case "question":  return liveState === "paused" ? resumeQuestion() : startQuestion();
      case "paused":    return pauseQuestion();
      case "reveal":    return revealAnswer();
      case "finished":  return finishSession();
      default:          return false;
    }
  };

  return {
    isLive, liveSession: session, liveState, statusView,
    currentQuestion, currentQuestionIndex, totalQuestions, isLastQuestion,
    isEndConfirmOpen, timeLeft, currentQuestionDuration,

    students, pendingStudents, finishedStudentsCount,
    reopenedStudentsCount,

    allowAnswerEdit, setAllowAnswerEdit,
    reopenModal, confirmReopen, closeReopenedRound,

    canTransitionTo, canPause, canResume, canReveal, canNext, canFinish,

    autoAdvance,
    setAutoAdvance,
    autoAdvanceRemaining,
    revealAutoMs: REVEAL_AUTO_MS,

    pendingNext,
    startLiveSession, startCountdown, cancelCountdown,
    startQuestion, pauseQuestion, resumeQuestion,
    revealAnswer, nextQuestion, requestNextQuestion, finishSession,
    goToState, restartRound,

    requestEndLive, cancelEndLive, confirmEndLive,
  };
}