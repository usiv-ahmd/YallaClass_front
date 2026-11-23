// src/hooks/useQuestionsForm.js
import { useState } from "react";
import {
  DEFAULT_POINTS,
  DEFAULT_TIME_LIMIT_SEC,
  MAX_OPTIONS,
  MIN_OPTIONS,
} from "../constants/questions.js";
import {
  buildQuestionPayload,
  questionToForm,
} from "../adapters/quiz.adapter.js";

const EMPTY_OPTIONS = ["", ""];

function useQuestionsForm({ questions = [], addQuestion, updateQuestion, deleteQuestion }) {
  const [formOpen, setFormOpen] = useState(false);
  const [text, setText] = useState("");
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [points, setPoints] = useState(DEFAULT_POINTS);
  const [timeLimitSec, setTimeLimitSec] = useState(DEFAULT_TIME_LIMIT_SEC);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  function resetForm() {
    setFormOpen(false);
    setEditingId(null);
    setText("");
    setOptions(EMPTY_OPTIONS);
    setCorrectIndex(0);
    setPoints(DEFAULT_POINTS);
    setTimeLimitSec(DEFAULT_TIME_LIMIT_SEC);
    setFormError(null);
    setBusy(false);
  }

  function startAdd() {
    resetForm();
    setFormOpen(true);
  }

  function startEdit(question) {
    const form = questionToForm(question);
    if (!form) return;

    setEditingId(question.id);
    setText(form.text);
    setOptions(form.options.length >= MIN_OPTIONS ? form.options : EMPTY_OPTIONS);
    setCorrectIndex(form.correctIndex);
    setPoints(form.points);
    setTimeLimitSec(form.timeLimitSec);
    setFormError(null);
    setBusy(false);
    setFormOpen(true);
  }

  async function submitQuestion(event) {
    event.preventDefault();
    setFormError(null);

    let payload;

    try {
      payload = buildQuestionPayload({
        text,
        options,
        correctIndex,
        points,
        timeLimitSec,
      });
    } catch (error) {
      setFormError(error.message || "راجع بيانات السؤال.");
      return;
    }

    setBusy(true);

    try {
      if (editingId) {
        await updateQuestion(editingId, payload);
      } else {
        await addQuestion(payload);
      }
      resetForm();
    } catch (error) {
      setFormError(error.message || "حصل خطأ أثناء حفظ السؤال، حاول تاني.");
    } finally {
      setBusy(false);
    }
  }

  function updateOption(index, value) {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? value : option
      )
    );
  }

  function addOption() {
    setOptions((current) =>
      current.length >= MAX_OPTIONS ? current : [...current, ""]
    );
  }

  function removeOption(index) {
    setOptions((current) => {
      if (current.length <= MIN_OPTIONS) return current;

      return current.filter((_, optionIndex) => optionIndex !== index);
    });

    setCorrectIndex((current) => {
      if (current === index) return Math.max(0, index - 1);
      if (current > index) return current - 1;
      return current;
    });
  }

  async function removeQuestion(questionId) {
    if (
      typeof window !== "undefined" &&
      !window.confirm("حذف السؤال؟ لا يمكن التراجع.")
    ) {
      return;
    }

    try {
      await deleteQuestion(questionId);
      if (editingId === questionId) resetForm();
    } catch (error) {
      alert(error.message || "حصل خطأ أثناء حذف السؤال، حاول تاني.");
    }
  }

  return {
    questions,
    formOpen,
    text,
    setText,
    options,
    correctIndex,
    setCorrectIndex,
    points,
    setPoints,
    timeLimitSec,
    setTimeLimitSec,
    editingId,
    formError,
    busy,
    startAdd,
    startEdit,
    submitQuestion,
    updateOption,
    addOption,
    removeOption,
    deleteQuestion: removeQuestion,
    cancelForm: resetForm,
  };
}

export { useQuestionsForm };
