// src/api/admin.api.js
import { client } from "./client";

export const adminApi = {
  listOrganizations: () => client.admin.listOrganizations(),
  getOrganization: (id) => client.admin.getOrganization(id),
  createOrganization: (payload) => client.admin.createOrganization(payload),
  updateOrganization: (id, patch) => client.admin.updateOrganization(id, patch),
  updateOrganizationStatus: (id, status) =>
    client.admin.updateOrganizationStatus(id, status),
  listUsers: () => client.admin.listUsers(),
  getUser: (id) => client.admin.getUser(id),
  updateUserStatus: (id, status) => client.admin.updateUserStatus(id, status),
};
