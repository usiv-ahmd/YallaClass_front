// src/utils/user.js
//
// Shared user normalizer for both HTTP and mock providers. The backend
// serializes the organization reference as `organization` (an id or null),
// while the frontend stores read `organizationId`. Everything else is kept
// untouched so extra fields (status, avatar, timestamps, ...) are not lost.

export function normalizeUser(user) {
  if (!user) {
    return null;
  }

  const { organization, ...rest } = user;

  return {
    ...rest,
    id: rest.id ?? rest._id ?? null,
    role: rest.role ?? null,
    organizationId: rest.organizationId ?? organization ?? null,
  };
}
