// src/hooks/usePlayerSession.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sessionApi } from "../api/session.api";
import { subscribeRemoteSession } from "../providers/mock/realtimeAdapter";

const STORAGE_PREFIX = "yalla-class:player:";

const COMMAND_RULES = {
  gift:   { maxUses: 1, requiresTarget: true,  label: "هدية",   emoji: "🎁" },
  thief:  { maxUses: 1, requiresTarget: true,  label: "سرقة",   emoji: "🥷" },
  rocket: { maxUses: 1, requiresTarget: false, label: "صاروخ",  emoji: "🚀" },
};

function countCommandUses(session, studentId, command) {
  return (session?.events || []).filter(
    (e) => e.type === `command:${command}` && e.actorId === studentId
  ).length;
}

export function storePlayerSeat(sessionId, student) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + sessionId, JSON.stringify(student));
  } catch {}
}

function loadStoredPlayer(sessionId) {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + sessionId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearStoredPlayer(sessionId) {
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + sessionId);
  } catch {}
}

export function usePlayerSession(sessionId) {
  const [student, setStudent] = useState(() => loadStoredPlayer(sessionId));
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedForCurrent, setSubmittedForCurrent] = useState(false);

  const [now, setNow] = useState(() => Date.now());
  const nowRef = useRef(now);
  nowRef.current = now;

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await sessionApi.getPublicById(sessionId);
      setSession(res.data);
    } catch (e) {
      setError(e.message || "تعذّر تحميل الحصة");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!sessionId) return;
    return subscribeRemoteSession(sessionId, (fresh) => {
      const myAnswers = student ? fresh.answers?.[student.id] || {} : {};
      setSession({
        ...fresh,
        answers: { [student?.id || "__none__"]: myAnswers },
      });
    });
  }, [sessionId, student?.id]);

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

  useEffect(() => {
    setSubmittedForCurrent(false);
  }, [session?.live?.currentQuestionIndex]);

  const myAnswers = useMemo(() => {
    if (!session || !student) return {};
    return session.answers?.[student.id] || {};
  }, [session, student]);

  const currentAnswer = currentQuestion ? myAnswers[currentQuestion.id] : null;
  const hasAnsweredCurrent = Boolean(currentAnswer) || submittedForCurrent;

  const join = useCallback(
    async ({ code, name, nickname, avatar }) => {
      setError(null);
      const res = await sessionApi.join({ code, name, nickname, avatar });
      storePlayerSeat(sessionId, res.data.student);
      setStudent(res.data.student);
      setSession(res.data.session);
      return res.data;
    },
    [sessionId]
  );

  const submitAnswer = useCallback(
    async (selectedOption) => {
      if (!student || !currentQuestion || !session) return;
      if (hasAnsweredCurrent) return;
      setSubmitting(true);
      setError(null);
      try {
        const res = await sessionApi.submitAnswer({
          sessionId,
          studentId: student.id,
          questionId: currentQuestion.id,
          selectedOption,
        });
        setSubmittedForCurrent(true);
        setSession((prev) => {
          if (!prev) return prev;
          const prevAnswers = prev.answers?.[student.id] || {};
          return {
            ...prev,
            answers: {
              ...prev.answers,
              [student.id]: {
                ...prevAnswers,
                [currentQuestion.id]: res.data.answer,
              },
            },
            students: prev.students.map((s) =>
              s.id === student.id ? res.data.student : s
            ),
          };
        });
        return res.data;
      } catch (e) {
        setError(e.message || "تعذّر إرسال الإجابة");
        throw e;
      } finally {
        setSubmitting(false);
      }
    },
    [sessionId, student, currentQuestion, session, hasAnsweredCurrent]
  );

  const leave = useCallback(async () => {
    if (student) {
      try {
        await sessionApi.leave(sessionId, student.id);
      } catch {}
    }
    clearStoredPlayer(sessionId);
    setStudent(null);
    setSession(null);
  }, [sessionId, student]);

  const forgetSeat = useCallback(() => {
    clearStoredPlayer(sessionId);
    setStudent(null);
  }, [sessionId]);

  const commandsEnabled = useMemo(
    () => session?.settings?.commandsEnabled || { gift: false, thief: false, rocket: false },
    [session?.settings?.commandsEnabled]
  );

  const commandsUsed = useMemo(() => {
    if (!session || !student) return {};
    const out = {};
    for (const cmd of Object.keys(COMMAND_RULES)) {
      out[cmd] = countCommandUses(session, student.id, cmd);
    }
    return out;
  }, [session, student]);

  const canUseCommand = useCallback(
    (cmd) => {
      if (!student) return false;
      if (session?.live?.state !== "question") return false;
      const rules = COMMAND_RULES[cmd];
      if (!rules) return false;
      if (!commandsEnabled[cmd]) return false;
      if ((commandsUsed[cmd] || 0) >= rules.maxUses) return false;
      return true;
    },
    [student, session?.live?.state, commandsEnabled, commandsUsed]
  );

  const useCommand = useCallback(
    async (cmd, targetId = null) => {
      if (!sessionId || !student) return;
      setError(null);
      try {
        const res = await sessionApi.useCommand({
          sessionId,
          studentId: student.id,
          command: cmd,
          targetId,
        });
        setSession(res.data.session);
        return res.data.event;
      } catch (e) {
        setError(e.message || "تعذّر استخدام الأمر");
        throw e;
      }
    },
    [sessionId, student]
  );

  const myRank = useMemo(() => {
    if (!session || !student) return null;
    const me = session.students.find((s) => s.id === student.id);
    return me?.rank ?? null;
  }, [session, student]);

  return {
    session,
    student,
    currentQuestion,
    timeLeft,
    currentAnswer,
    hasAnsweredCurrent,
    myAnswers,
    myRank,
    students: session?.students || [],
    leaderboard: (session?.students || [])
      .slice()
      .sort((a, b) => (a.rank || 999) - (b.rank || 999)),
    liveState: session?.live?.state,
    currentQuestionIndex: session?.live?.currentQuestionIndex ?? 0,
    totalQuestions: session?.questions?.length ?? 0,

    loading,
    error,
    submitting,
    isLive: session?.live?.isLive ?? false,
    allowJoining: session?.settings?.allowJoining ?? true,

    commandsEnabled,
    commandsUsed,
    canUseCommand,
    useCommand,
    rocketActive: Boolean(student?.rocketActive),
    commandRules: COMMAND_RULES,

    join,
    submitAnswer,
    leave,
    forgetSeat,
    refresh,
  };
}