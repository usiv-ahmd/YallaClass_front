// src/store/quiz.store.jsx
import { useCallback, useEffect, useState } from "react";
import { quizApi } from "../api/quiz.api.js";
import { useAuth } from "./auth.store.jsx";

function questionStats(questions) {
  return {
    questionCount: questions.length,
    estimatedDurationSec: questions.reduce(
      (total, question) => total + (Number(question.timeLimitSec) || 0),
      0
    ),
  };
}

function sortQuestions(questions) {
  return [...questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function useQuizLibrary({ archived = false } = {}) {
  const { isAuthenticated } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await quizApi.list({ archived });
      setQuizzes(res.data || []);
    } catch (e) {
      setError(e.message || "تعذّر تحميل الكويزات");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, archived]);

  const createQuiz = useCallback(async (payload) => {
    const res = await quizApi.create(payload);
    setQuizzes((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const duplicateQuiz = useCallback(async (quizId) => {
    const res = await quizApi.duplicate(quizId);
    setQuizzes((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const archiveQuiz = useCallback(async (quizId, archivedFlag) => {
    await quizApi.archive(quizId, archivedFlag);
    setQuizzes((prev) => prev.filter((quiz) => quiz.id !== quizId));
  }, []);

  const deleteQuiz = useCallback(async (quizId) => {
    await quizApi.delete(quizId);
    setQuizzes((prev) => prev.filter((quiz) => quiz.id !== quizId));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return {
    quizzes,
    loading,
    error,
    refresh,
    createQuiz,
    duplicateQuiz,
    archiveQuiz,
    deleteQuiz,
  };
}

export function useQuiz(quizId) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!quizId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await quizApi.getById(quizId);
      setQuiz(res.data);
    } catch (e) {
      setError(e.message || "تعذّر تحميل الكويز");
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  const saveMeta = useCallback(
    async (patch) => {
      const res = await quizApi.update(quizId, patch);
      setQuiz((prev) => ({
        ...prev,
        ...res.data,
        questions: prev?.questions || [],
      }));
      return res.data;
    },
    [quizId]
  );

  const addQuestion = useCallback(
    async (payload) => {
      const res = await quizApi.addQuestion(quizId, payload);
      const question = res.data;

      setQuiz((prev) => {
        if (!prev) return prev;
        const questions = sortQuestions([...(prev.questions || []), question]);
        return { ...prev, questions, ...questionStats(questions) };
      });

      return question;
    },
    [quizId]
  );

  const updateQuestion = useCallback(
    async (questionId, payload) => {
      const res = await quizApi.updateQuestion(quizId, questionId, payload);
      const updated = res.data;

      setQuiz((prev) => {
        if (!prev) return prev;
        const questions = sortQuestions(
          (prev.questions || []).map((question) =>
            question.id === questionId ? updated : question
          )
        );
        return { ...prev, questions, ...questionStats(questions) };
      });

      return updated;
    },
    [quizId]
  );

  const deleteQuestion = useCallback(
    async (questionId) => {
      await quizApi.deleteQuestion(quizId, questionId);

      setQuiz((prev) => {
        if (!prev) return prev;
        const questions = (prev.questions || []).filter(
          (question) => question.id !== questionId
        );
        return { ...prev, questions, ...questionStats(questions) };
      });
    },
    [quizId]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return {
    quiz,
    questions: quiz?.questions || [],
    loading,
    error,
    refresh,
    saveMeta,
    addQuestion,
    updateQuestion,
    deleteQuestion,
  };
}
