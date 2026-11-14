// src/providers/http/organization.http.js
function notConnected(method) {
  return async () => {
    throw {
      status: 0,
      message: `[http:organization] ${method}() — backend not connected`,
    };
  };
}

export const organizationHttp = {
  get: notConnected("get"),
  update: notConnected("update"),
  listMembers: notConnected("listMembers"),
  addMember: notConnected("addMember"),
  updateMember: notConnected("updateMember"),
  removeMember: notConnected("removeMember"),
};