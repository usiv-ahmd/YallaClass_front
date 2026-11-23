// src/providers/http/response.js
//
// Small helpers for the backend envelope `{ success, message, data? }`.
// Providers stay explicit about which key each endpoint returns instead of
// assuming every payload has the same nesting.

export function envelopeData(body) {
  if (body && typeof body === "object" && !Array.isArray(body) && "data" in body) {
    return body.data;
  }

  return body;
}

export function pick(body, key) {
  const data = envelopeData(body);

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return undefined;
  }

  return data[key];
}

// Matches the shape returned by the mock providers so stores can keep using
// `res.data` unchanged.
export function ok(data) {
  return { data };
}
