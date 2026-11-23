// src/providers/http/auth.http.js
import { http } from "../../api/httpClient";
import { normalizeUser } from "../../utils/user";
import { envelopeData } from "./response";
import { notImplemented } from "./not-implemented";

export const authHttp = {
  async login({ email, password } = {}) {
    const body = await http.post(
      "/auth/login",
      { email, password },
      // A failed login must not clear an already-valid local session.
      { auth: false, handleUnauthorized: false }
    );
    const data = envelopeData(body) || {};

    return {
      data: {
        token: data.token ?? null,
        user: normalizeUser(data.user),
      },
    };
  },

  async logout() {
    await http.post("/auth/logout");
    return { data: { ok: true } };
  },

  async me() {
    const body = await http.get("/auth/me");
    const data = envelopeData(body) || {};

    return { data: { user: normalizeUser(data.user) } };
  },

  // The backend intentionally has no public registration endpoint.
  register: notImplemented(
    "auth",
    "register",
    "Public registration is not supported by the backend."
  ),
};
