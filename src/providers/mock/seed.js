// src/providers/mock/seed.js
//
// Mock-mode seed data. The real account flow creates ADMIN through the
// backend CLI, so mock mode needs one ADMIN account to exercise the console.
import { db } from "./db";

export const MOCK_ADMIN_EMAIL = "admin@yalla.com";
export const MOCK_ADMIN_PASSWORD = "admin12345";

const DEFAULT_ORG_ID = "org-default";
const DEFAULT_OWNER_ID = "user-owner-default";

function ensureDefaultAdmin() {
  const hasAdmin = db.users.all().some((user) => user.role === "ADMIN");

  if (hasAdmin) {
    return;
  }

  db.users.create({
    id: crypto.randomUUID(),
    email: MOCK_ADMIN_EMAIL,
    passwordHash: `mock-hash-${MOCK_ADMIN_PASSWORD}`,
    name: "مدير المنصة",
    role: "ADMIN",
    status: "ACTIVE",
    organizationId: null,
    createdAt: Date.now(),
  });
}

function ensureDefaultOrganizationShape() {
  const organization = db.organizations.findById(DEFAULT_ORG_ID);

  if (!organization) {
    return;
  }

  const owner =
    db.users.findById(DEFAULT_OWNER_ID) ||
    db.users
      .all()
      .find(
        (user) =>
          user.role === "OWNER" && user.organizationId === DEFAULT_ORG_ID
      );

  const patch = {};

  if (!organization.status) {
    patch.status = "ACTIVE";
  }

  if (organization.owner === undefined && owner) {
    patch.owner = owner.id;
  }

  if (Object.keys(patch).length > 0) {
    db.organizations.update(DEFAULT_ORG_ID, patch);
  }
}

export function ensureSeedData() {
  if (db.users.all().length === 0) {
    const organization = db.organizations.create({
      id: DEFAULT_ORG_ID,
      name: "مؤسسة يلا كلاس التجريبية",
      owner: DEFAULT_OWNER_ID,
      status: "ACTIVE",
      logoUrl: null,
      timezone: "Africa/Cairo",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    db.users.create({
      id: DEFAULT_OWNER_ID,
      email: "instructor@yalla.com",
      passwordHash: "mock-hash-instructor123",
      name: "المدرس",
      role: "OWNER",
      status: "ACTIVE",
      organizationId: organization.id,
      createdAt: Date.now(),
    });
  }

  ensureDefaultOrganizationShape();
  ensureDefaultAdmin();
}
