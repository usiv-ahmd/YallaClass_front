// src/api/client.js
import { CONFIG } from "../config";

const MODE = CONFIG.API_MODE === "http" ? "http" : "mock";

let _client = null;

async function loadMockProviders() {
  const [a, o, q, s, g, r, ad, ro] = await Promise.all([
    import("../providers/mock/auth.mock"),
    import("../providers/mock/organization.mock"),
    import("../providers/mock/quiz.mock"),
    import("../providers/mock/session.mock"),
    import("../providers/mock/game.mock"),
    import("../providers/mock/report.mock"),
    import("../providers/mock/admin.mock"),
    import("../providers/mock/roster.mock"),
  ]);
  return {
    auth: a.authMock,
    organization: o.organizationMock,
    quiz: q.quizMock,
    session: s.sessionMock,
    game: g.gameMock,
    report: r.reportMock,
    admin: ad.adminMock,
    roster: ro.rosterMock,
  };
}

async function loadHttpProviders() {
  const [a, o, q, s, g, r, ad, ro] = await Promise.all([
    import("../providers/http/auth.http"),
    import("../providers/http/organization.http"),
    import("../providers/http/quiz.http"),
    import("../providers/http/session.http"),
    import("../providers/http/game.http"),
    import("../providers/http/report.http"),
    import("../providers/http/admin.http"),
    import("../providers/http/roster.http"),
  ]);
  return {
    auth: a.authHttp,
    organization: o.organizationHttp,
    quiz: q.quizHttp,
    session: s.sessionHttp,
    game: g.gameHttp,
    report: r.reportHttp,
    admin: ad.adminHttp,
    roster: ro.rosterHttp,
  };
}

export async function initClient() {
  if (_client) return _client;
  _client = MODE === "http" ? await loadHttpProviders() : await loadMockProviders();
  return _client;
}

export const client = new Proxy({}, {
  get(_, prop) {
    if (!_client) {
      throw new Error(`[api/client] client.${String(prop)} used before initClient() was called`);
    }
    return _client[prop];
  },
});

export function getApiMode() {
  return MODE;
}