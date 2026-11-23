// src/providers/http/organization.http.js
import { http } from "../../api/httpClient";
import { ok, pick } from "./response";

// The backend validators are strict objects, so only send supported fields.
function pickDefined(source, keys) {
  const target = {};

  for (const key of keys) {
    if (source && source[key] !== undefined) {
      target[key] = source[key];
    }
  }

  return target;
}

export const organizationHttp = {
  async get() {
    const body = await http.get("/organization");
    return ok(pick(body, "organization"));
  },

  async update(patch = {}) {
    const body = await http.patch("/organization", pickDefined(patch, ["name"]));
    return ok(pick(body, "organization"));
  },

  async listMembers() {
    const body = await http.get("/organization/members");
    return ok(pick(body, "members") ?? []);
  },

  async addMember(payload = {}) {
    const body = await http.post(
      "/organization/members",
      pickDefined(payload, ["name", "email", "password", "role"])
    );
    return ok(pick(body, "member"));
  },

  async updateMember(memberId, patch = {}) {
    const body = await http.patch(
      `/organization/members/${memberId}`,
      pickDefined(patch, ["name", "role", "status"])
    );
    return ok(pick(body, "member"));
  },

  async removeMember(memberId) {
    const body = await http.delete(`/organization/members/${memberId}`);
    return ok(pick(body, "id") ?? memberId);
  },
};
