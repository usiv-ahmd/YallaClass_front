// src/hooks/useReopenedQuestion.js
import { useEffect, useRef, useState } from "react";
import { submitAnswer } from "../sessionStore.js";

export function useReopenedQuestion({
  liveState, questions, studentAnswers, sessionId, studentId, now, refreshNow,
}) {
  const [started, setStarted]       = useState(false);
  const [startedAt, setStartedAt]   = useState(null);
  const [questionId, setQuestionId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [firstShown, setFirstShown] = useState(false);
  const timedOutRef                 = useRef(null);
  const advanceTimer                = useRef(null);

  const unanswered = questions.filter((q) => !studentAnswers[q.id]);
  const current = (() => {
    if (questionId) {
      const q = unanswered.find((x) => x.id === questionId);
      if (q) return q;
    }
    return unanswered[0] || null;
  })();

  const duration = Number(current?.duration) || 30;
  const timeLeft = (() => {
    if (!started || !startedAt) return duration;
    return Math.max(0, duration - Math.floor((now - startedAt) / 1000));
  })();

  const index  = current ? questions.indexOf(current) : 0;
  const answer = current ? studentAnswers[current.id] : null;

  useEffect(() => {
    if (liveState !== "reopened") {
      setStarted(false);
      setStartedAt(null);
      setQuestionId(null);
      setFirstShown(false);
    }
  }, [liveState]);

  useEffect(() => {
    if (liveState !== "reopened") return;
    if (questionId) return;
    if (unanswered.length === 0) return;
    setQuestionId(unanswered[0].id);
  }, [liveState, questionId, unanswered.length]);

  const start = () => {
    setStarted(true);
    setStartedAt(Date.now());
    timedOutRef.current = null;
    refreshNow?.();
  };

  useEffect(() => {
    if (liveState !== "reopened") return;
    if (!current) return;
    if (started || submitting) return;
    if (answer) return;
    if (!firstShown) return;
    if (timedOutRef.current === current.id) return;
    start();
  }, [liveState, current?.id, started, submitting, answer, firstShown]);

  const submit = async (optionIndex) => {
    if (!studentId || !sessionId || !current || submitting) return;
    setSubmitting(true);
    const submittedId = current.id;

    try {
      if (optionIndex !== null) {
        await submitAnswer({
          sessionId,
          studentId,
          questionId: submittedId,
          selectedOption: optionIndex,
        });
      }
      setStarted(false);
      setStartedAt(null);

      const remaining = unanswered.filter((q) => q.id !== submittedId);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => {
        setQuestionId(remaining[0]?.id || null);
        setSubmitting(false);
      }, 2500);
    } catch (err) {
      console.error("[reopened.submit]", err);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (liveState !== "reopened") return;
    if (!started || !current) return;
    if (timeLeft > 0) return;
    if (timedOutRef.current === current.id) return;
    timedOutRef.current = current.id;
    submit(null);
  }, [timeLeft, started, current?.id, liveState]);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  return {
    current, index, answer, duration, timeLeft,
    started, submitting, firstShown,
    setFirstShown, start, submit,
  };
}