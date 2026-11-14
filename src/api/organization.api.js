// src/api/organization.api.js
import { client } from "./client";

export const organizationApi = {
  get: () => client.organization.get(),
  update: (patch) => client.organization.update(patch),
  listMembers: () => client.organization.listMembers(),
  addMember: (payload) => client.organization.addMember(payload),
  updateMember: (id, patch) => client.organization.updateMember(id, patch),
  removeMember: (id) => client.organization.removeMember(id),
};