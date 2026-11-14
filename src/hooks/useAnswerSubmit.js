// src/hooks/useAnswerSubmit.js
import { useCallback } from "react";
import { submitAnswer } from "../sessionStore.js";
import { getQuestions } from "../utils/session.js";

export function useAnswerSubmit({ joined, triggerReaction }) {
  return useCallback(async (payload) => {
    if (!joined) return;
    const { session, student } = joined;
    const live = session.live || {};
    const questions = getQuestions(session);
    const q = questions[live.currentQuestionIndex ?? 0];
    if (!q) return;

    const already = Boolean(session.answers?.[student.id]?.[q.id]);
    if (live.state === "question" && already) return;
    if (live.state === "reopened") {
      const allowed = session.reopenedFor?.studentIds?.includes(student.id);
      const allowEdit = session.reopenedFor?.allowEdit;
      if (!allowed || (already && !allowEdit)) return;
    } else if (live.state !== "question" && live.state !== "reopened") {
      return;
    }

    const optionIndex = payload.selectedOption;
    if (!Number.isInteger(optionIndex)) return;

    try {
      const res = await submitAnswer({
        sessionId: session.id,
        studentId: student.id,
        questionId: q.id,
        selectedOption: optionIndex,
      });

      const reactionKey = res?.answer?.reactionKey;
      if (reactionKey) triggerReaction(reactionKey);
    } catch (err) {
      console.error("[useAnswerSubmit]", err);
    }
  }, [joined, triggerReaction]);
}