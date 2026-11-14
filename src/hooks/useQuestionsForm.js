// src/hooks/useQuestionsForm.js
import { useState } from "react";
import { QUESTION_TYPES, DEFAULT_POINTS, MAX_POINTS, MIN_POINTS } from "../constants/questions.js";
import { makeId, getCorrectIndex, clampNumber, clampDuration } from "../utils/questions.js";

function useQuestionsForm({ quiz, updateQuestions }) {
  const [formOpen, setFormOpen] = useState(false);
  const [type, setTypeState] = useState("mcq");
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [duration, setDuration] = useState(30);
  const [points, setPoints] = useState(DEFAULT_POINTS);
  const [editingId, setEditingId] = useState(null);

  const typeConfig = QUESTION_TYPES[type];
  const rawQuestions = quiz?.questions;
  const questions = rawQuestions ? (Array.isArray(rawQuestions) ? rawQuestions : Object.values(rawQuestions)) : [];

  const commit = async (nextQuestions) => {
    if (typeof updateQuestions === "function") {
      await updateQuestions(nextQuestions);
    }
  };

  function resetForm() {
    setFormOpen(false);
    setEditingId(null);
    setTypeState("mcq");
    setText("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);
    setDuration(30);
    setPoints(DEFAULT_POINTS);
  }

  function setType(newType) {
    if (!QUESTION_TYPES[newType] || newType === type) return;
    setTypeState(newType);

    if (newType === "true_false") {
      setOptions(["صح", "غلط"]);
      setCorrectIndex(0);
    } else {
      setOptions(["", "", "", ""]);
      setCorrectIndex(0);
    }

    const durations = QUESTION_TYPES[newType].durations;
    if (!durations.includes(Number(duration))) {
      setDuration(durations[0]);
    }
  }

  function startAdd() {
    resetForm();
    setFormOpen(true);
  }

  function startEdit(question) {
    if (!question) return;
    const qType = QUESTION_TYPES[question.type] ? question.type : "mcq";
    const qDurations = QUESTION_TYPES[qType].durations;

    setEditingId(question.id);
    setTypeState(qType);
    setText(question.question ?? question.text ?? "");

    const qOpts = Array.isArray(question.options) ? [...question.options] : [];
    if (qType === "true_false") {
      setOptions(["صح", "غلط"]);
      setCorrectIndex(Math.max(0, Math.min(1, getCorrectIndex(question))));
    } else {
      setOptions(qOpts.length >= 2 ? qOpts : ["", "", "", ""]);
      setCorrectIndex(Math.max(0, getCorrectIndex(question)));
    }

    setDuration(clampDuration(question.duration, qDurations, qDurations[0]));
    setPoints(clampNumber(question.points ?? question.weight, MIN_POINTS, MAX_POINTS, DEFAULT_POINTS));
    setFormOpen(true);
  }

  async function addQuestion(event) {
    event.preventDefault();

    if (!text.trim()) {
      alert("اكتب نص السؤال الأول");
      return;
    }

    const safeDuration = clampDuration(duration, typeConfig.durations, typeConfig.durations[0]);
    const safePoints = clampNumber(points, MIN_POINTS, MAX_POINTS, DEFAULT_POINTS);

    let finalOptions = [];
    let finalCorrectIndex = -1;

    if (typeConfig.hasOptions) {
      if (type === "true_false") {
        finalOptions = ["صح", "غلط"];
        finalCorrectIndex = correctIndex === 1 ? 1 : 0;
      } else {
        finalOptions = options.map((o) => o.trim());
        if (finalOptions.some((o) => !o)) {
          alert("كل الخيارات لازم تكون مكتوبة");
          return;
        }
        if (finalOptions.length < 2) {
          alert("لازم يكون فيه على الأقل خيارين");
          return;
        }
        finalCorrectIndex = Math.min(correctIndex, finalOptions.length - 1);
      }
    }

    try {
      if (editingId) {
        await commit(
          questions.map((q) =>
            q.id === editingId
              ? {
                  ...q,
                  type,
                  text: text.trim(),
                  options: finalOptions,
                  correctOptionIndex: finalCorrectIndex,
                  duration: safeDuration,
                  weight: safePoints,
                }
              : q
          )
        );
      } else {
        const newQuestion = {
          id: makeId("question"),
          type,
          text: text.trim(),
          options: finalOptions,
          correctOptionIndex: finalCorrectIndex,
          duration: safeDuration,
          weight: safePoints,
        };
        await commit([...questions, newQuestion]);
      }
      resetForm();
    } catch (e) {
      console.error("[addQuestion]", e);
      alert("حصل خطأ أثناء حفظ السؤال، حاول تاني");
    }
  }

  function updateOption(index, value) {
    setOptions((cur) => cur.map((o, i) => (i === index ? value : o)));
  }

  function removeOption(index) {
    setOptions((cur) => cur.filter((_, i) => i !== index));
    setCorrectIndex((cur) => cur === index ? Math.max(0, index - 1) : cur > index ? cur - 1 : cur);
  }

  async function deleteQuestion(questionId) {
    try {
      await commit(questions.filter((item) => item.id !== questionId));
      if (editingId === questionId) resetForm();
    } catch (e) {
      console.error("[deleteQuestion]", e);
      alert("حصل خطأ أثناء حذف السؤال، حاول تاني");
    }
  }

  return {
    questions,
    formOpen, setFormOpen,
    type, setType,
    text, setText,
    options, setOptions,
    correctIndex, setCorrectIndex,
    duration, setDuration,
    points, setPoints,
    addQuestion,
    updateOption,
    removeOption,
    deleteQuestion,
    editingId,
    startAdd,
    startEdit,
    cancelForm: resetForm,
  };
}

export { useQuestionsForm };