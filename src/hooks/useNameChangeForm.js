// src/hooks/useNameChangeForm.js
import { useState } from "react";

export function useNameChangeForm({ currentName, onSave }) {
  const [newName, setNewName] = useState("");
  const [error, setError]     = useState("");

  const handleChange = (value) => {
    setNewName(value);
    if (error) setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (trimmed.length < 2) {
      setError("اكتب اسم جديد (حرفين على الأقل)");
      return;
    }
    if (trimmed.toLowerCase() === currentName.trim().toLowerCase()) {
      setError("الاسم الجديد لازم يكون مختلف عن القديم");
      return;
    }
    onSave(trimmed);
  };

  return { newName, error, handleChange, handleSubmit };
}