// src/mock-api/auth.js

const TOKEN_KEY = "yalla-class:token";
const TEACHER_ID_KEY = "live-quiz:teacher-id";
const TEACHER_NAME_KEY = "live-quiz:teacher-name";

function genId() {
  return `teacher-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/* ===== Teacher identity ===== */

export function getCurrentTeacherId() {
  let id = localStorage.getItem(TEACHER_ID_KEY);
  if (!id) {
    id = genId();
    localStorage.setItem(TEACHER_ID_KEY, id);
  }
  return id;
}

export function getCurrentTeacherName() {
  return localStorage.getItem(TEACHER_NAME_KEY) || "المدرس";
}

export function setCurrentTeacherName(name) {
  localStorage.setItem(TEACHER_NAME_KEY, name);
}

/* ===== Auth (token + user) ===== */

export function setAuthSession({ token, user } = {}) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user?.id) localStorage.setItem(TEACHER_ID_KEY, user.id);
  if (user?.name) localStorage.setItem(TEACHER_NAME_KEY, user.name);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export const isLoggedIn = isAuthenticated;

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TEACHER_ID_KEY);
  localStorage.removeItem(TEACHER_NAME_KEY);
}

export const clearAuth = clearAuthSession;

export function getAuthState() {
  const token = getAuthToken();
  if (!token) return null;
  return {
    token,
    user: {
      id: localStorage.getItem(TEACHER_ID_KEY),
      name: getCurrentTeacherName(),
    },
  };
}