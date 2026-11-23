// src/providers/http/admin.http.js
import { http } from "../../api/httpClient";
import { normalizeUser } from "../../utils/user";
import { envelopeData, ok, pick } from "./response";

function buildCreateOrganizationPayload({ name, owner } = {}) {
  const ownerInput = owner || {};

  // The backend validator is a strict object:
  // { name, owner: { name, email, password } }
  return {
    name,
    owner: {
      name: ownerInput.name,
      email: ownerInput.email,
      password: ownerInput.password,
    },
  };
}

export const adminHttp = {
  async listOrganizations() {
    const body = await http.get("/admin/organizations");
    return ok(pick(body, "organizations") ?? []);
  },

  async getOrganization(organizationId) {
    const body = await http.get(`/admin/organizations/${organizationId}`);
    return ok(pick(body, "organization"));
  },

  async createOrganization(payload) {
    const body = await http.post(
      "/admin/organizations",
      buildCreateOrganizationPayload(payload)
    );
    return ok(envelopeData(body));
  },

  async updateOrganization(organizationId, patch = {}) {
    const body = await http.patch(`/admin/organizations/${organizationId}`, {
      name: patch.name,
    });
    return ok(pick(body, "organization"));
  },

  async updateOrganizationStatus(organizationId, status) {
    const body = await http.patch(
      `/admin/organizations/${organizationId}/status`,
      { status }
    );
    return ok(pick(body, "organization"));
  },

  async listUsers() {
    const body = await http.get("/admin/users");
    const users = pick(body, "users") ?? [];
    return ok(users.map(normalizeUser));
  },

  async getUser(userId) {
    const body = await http.get(`/admin/users/${userId}`);
    return ok(normalizeUser(pick(body, "user")));
  },

  async updateUserStatus(userId, status) {
    const body = await http.patch(`/admin/users/${userId}/status`, { status });
    return ok(normalizeUser(pick(body, "user")));
  },
};
