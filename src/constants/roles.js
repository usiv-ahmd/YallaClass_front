// src/constants/roles.js
//
// The backend is the source of truth for roles (src/models/user.model.js).
// Keep these values in sync with the API; never let the UI select a role.

export const ROLES = {
  ADMIN: "ADMIN",
  OWNER: "OWNER",
  TEACHER: "TEACHER",
  ASSISTANT: "ASSISTANT",
};

export const STAFF_ROLES = [ROLES.OWNER, ROLES.TEACHER, ROLES.ASSISTANT];

export const ROLE_LABELS = {
  ADMIN: "أدمن المنصة",
  OWNER: "مالك",
  TEACHER: "مدرس",
  ASSISTANT: "مساعد",
};

export const STATUS_LABELS = {
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
};

export const ROLE_HOME_PATH = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.OWNER]: "/instructor-dashboard",
  [ROLES.TEACHER]: "/instructor-dashboard",
  [ROLES.ASSISTANT]: "/instructor-dashboard",
};

// Path prefixes mapped to the roles the backend allows to use them.
// `/organization` is readable by all staff, but only OWNER can mutate it.
export const PROTECTED_ROUTE_ROLES = [
  { prefix: "/admin", roles: [ROLES.ADMIN] },
  { prefix: "/instructor-dashboard", roles: STAFF_ROLES },
  { prefix: "/organization", roles: STAFF_ROLES },
  { prefix: "/library", roles: STAFF_ROLES },
  { prefix: "/sessions", roles: STAFF_ROLES },
  { prefix: "/reports", roles: STAFF_ROLES },
];

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

export function homePathForRole(role) {
  return ROLE_HOME_PATH[role] || "/";
}

export function canRoleAccessPath(role, path) {
  if (!role || typeof path !== "string") {
    return false;
  }

  const rule = PROTECTED_ROUTE_ROLES.find(
    (entry) => path === entry.prefix || path.startsWith(`${entry.prefix}/`)
  );

  if (!rule) {
    return false;
  }

  return rule.roles.includes(role);
}

// After login, only honour the original destination when the authenticated
// role is actually allowed to open it. Otherwise send the user to their own
// dashboard. This prevents an ADMIN from being bounced to a staff route (or
// vice versa) just because they were interrupted by the login screen.
export function resolvePostLoginPath(role, from) {
  const safeFrom =
    typeof from === "string" && from.startsWith("/") && !from.startsWith("//")
      ? from
      : null;

  if (safeFrom && canRoleAccessPath(role, safeFrom)) {
    return safeFrom;
  }

  return homePathForRole(role);
}
