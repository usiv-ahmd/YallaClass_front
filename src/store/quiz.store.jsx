// src/store/quiz.store.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { quizApi } from "../api/quiz.api.js";
import { useAuth } from "./auth.store.jsx";

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
    setQuizzes((prev) => [{ ...res.data, questionCount: (res.data.questions || []).length }, ...prev]);
    return res.data;
  }, []);

  const duplicateQuiz = useCallback(async (quizId) => {
    const res = await quizApi.duplicate(quizId);
    setQuizzes((prev) => [{ ...res.data, questionCount: (res.data.questions || []).length }, ...prev]);
    return res.data;
  }, []);

  const archiveQuiz = useCallback(async (quizId, archivedFlag) => {
    await quizApi.archive(quizId, archivedFlag);
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  }, []);

  const deleteQuiz = useCallback(async (quizId) => {
    await quizApi.delete(quizId);
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  }, []);

  useEffect(() => {
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

  const saveMeta = useCallback(async (patch) => {
    const res = await quizApi.update(quizId, patch);
    setQuiz((prev) => ({ ...prev, ...res.data, questionCount: (res.data.questions || []).length }));
    return res.data;
  }, [quizId]);

  const updateQuestions = useCallback(async (nextQuestions) => {
    const res = await quizApi.updateQuestions(quizId, nextQuestions);
    setQuiz((prev) => ({ ...prev, ...res.data, questionCount: (res.data.questions || []).length }));
    return res.data;
  }, [quizId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const asSession = useMemo(() => ({ id: quiz?.id, questions: quiz?.questions || [] }), [quiz]);

  return { quiz, asSession, loading, error, refresh, saveMeta, updateQuestions };
}