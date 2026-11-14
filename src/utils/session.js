// src/utils/session.js

export function getQuestions(session) {
  const raw = session?.questions;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : Object.values(raw);
}