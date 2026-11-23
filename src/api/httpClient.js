// src/api/httpClient.js
import { CONFIG } from "../config";

export const TOKEN_STORAGE_KEY = "yalla-class:token";

const DEFAULT_TIMEOUT_MS = 30000;

let unauthorizedHandler = null;
let notifyingUnauthorized = false;

/**
 * Normalized transport error. Mirrors the shape the mock providers throw
 * ({ status, message }) so stores/hooks can keep using `e.message` and `e.status`.
 */
export class HttpError extends Error {
  constructor(message, { status = 0, data = null, errors = undefined, url = "" } = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
    this.errors = errors;
    this.url = url;
    this.isHttpError = true;
  }
}

/**
 * Registered by the auth store so a 401 can clear local state. The client never
 * redirects on its own, which keeps 401 handling free of redirect loops.
 */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === "function" ? handler : null;
}

function notifyUnauthorized(error) {
  if (!unauthorizedHandler || notifyingUnauthorized) {
    return;
  }

  notifyingUnauthorized = true;

  try {
    unauthorizedHandler(error);
  } finally {
    notifyingUnauthorized = false;
  }
}

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = String(CONFIG.API_BASE_URL || "").replace(/\/+$/, "");
  const suffix = String(path || "").startsWith("/") ? path : `/${path}`;

  return `${base}${suffix}`;
}

function parseErrorMessage(payload, response) {
  if (payload && typeof payload === "object") {
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }

    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error.trim();
    }
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload.trim().slice(0, 300);
  }

  return response.statusText || `Request failed with status ${response.status}`;
}

async function readPayload(response, responseType) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  if (responseType === "arraybuffer") {
    return response.arrayBuffer();
  }

  if (responseType === "blob") {
    return response.blob();
  }

  if (responseType === "text") {
    return response.text();
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.toLowerCase().includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      // The backend claimed JSON but the body is malformed. Keep the raw text
      // so callers still get a useful message instead of a parse crash.
      return text;
    }
  }

  return text;
}

function parseFilename(disposition) {
  if (!disposition) {
    return null;
  }

  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);

  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ""));
    } catch {
      return encoded[1].trim().replace(/^"|"$/g, "");
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(disposition);

  return plain ? plain[1].trim() : null;
}

async function perform(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    auth = true,
    responseType = "json",
    timeoutMs = DEFAULT_TIMEOUT_MS,
    handleUnauthorized = true,
    signal: externalSignal,
  } = options;

  const url = buildUrl(path);
  const finalHeaders = { Accept: "application/json", ...headers };
  const token = auth ? readStoredToken() : null;

  if (token && !finalHeaders.Authorization) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let requestBody;

  if (body !== undefined && body !== null) {
    if (body instanceof FormData || body instanceof Blob || typeof body === "string") {
      requestBody = body;
    } else {
      requestBody = JSON.stringify(body);

      if (!finalHeaders["Content-Type"]) {
        finalHeaders["Content-Type"] = "application/json";
      }
    }
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeoutId =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs)
      : null;

  const abortFromExternal = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", abortFromExternal, { once: true });
    }
  }

  let response;

  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: requestBody,
      signal: controller.signal,
    });
  } catch (error) {
    const message =
      error?.name === "AbortError"
        ? timedOut
          ? "Request timed out"
          : "Request cancelled"
        : "Unable to reach the server";

    throw new HttpError(message, { status: 0, url });
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (externalSignal) {
      externalSignal.removeEventListener("abort", abortFromExternal);
    }
  }

  // Error responses are JSON even for binary endpoints, so always decode them
  // as JSON; only successful responses use the requested response type.
  const payload = await readPayload(response, response.ok ? responseType : "json");

  if (!response.ok) {
    const error = new HttpError(parseErrorMessage(payload, response), {
      status: response.status,
      data: payload,
      errors: payload && typeof payload === "object" ? payload.errors : undefined,
      url,
    });

    if (response.status === 401 && handleUnauthorized) {
      notifyUnauthorized(error);
    }

    throw error;
  }

  return { response, payload };
}

/**
 * Performs a request and returns the parsed body. For JSON endpoints this is
 * the untouched backend envelope ({ success, message, data? }) so providers can
 * extract each endpoint's specific keys instead of assuming a common nesting.
 */
export async function request(path, options = {}) {
  const { payload } = await perform(path, options);
  return payload;
}

/**
 * Performs a binary request (report export) and returns the bytes plus the
 * filename advertised by Content-Disposition.
 */
export async function requestBinary(path, options = {}) {
  const { response, payload } = await perform(path, {
    ...options,
    responseType: "arraybuffer",
  });

  return {
    buffer: payload,
    filename: parseFilename(response.headers.get("content-disposition")),
    contentType: response.headers.get("content-type") || "application/octet-stream",
  };
}

export const http = {
  request,
  requestBinary,
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};
