// src/providers/http/not-implemented.js

export function createNotImplementedError(feature, method, hint = "") {
  const detail = hint ? ` ${hint}` : "";
  const error = new Error(
    `[http:${feature}] ${method}() is not available in Phase 1.${detail}`.trim()
  );

  error.name = "NotImplementedError";
  error.status = 501;
  error.code = "NOT_IMPLEMENTED";

  return error;
}

/**
 * Keeps operations that need Socket.IO (or a backend endpoint that does not
 * exist yet) explicit instead of pretending they are HTTP requests.
 */
export function notImplemented(feature, method, hint = "") {
  return async () => {
    throw createNotImplementedError(feature, method, hint);
  };
}
