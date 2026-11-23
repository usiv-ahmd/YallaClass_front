// src/realtime/errors.js
import { gameErrorMessage } from "../adapters/session.adapter.js";

export function normalizeLiveError(raw, fallback = "تعذّر تنفيذ الإجراء.") {
  const error = new Error(gameErrorMessage(raw) || fallback);
  error.code = raw?.code || null;
  error.status = raw?.status ?? 0;
  error.details = raw?.details ?? null;
  error.isLiveError = true;
  return error;
}
