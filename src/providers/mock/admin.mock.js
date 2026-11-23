// src/providers/mock/admin.mock.js
import { db } from "./db";
import { delay, publicUser, requireRole } from "./latency";
import { ensureSeedData } from "./seed";

const STATUSES = ["ACTIVE", "SUSPENDED"];

function requireAdmin() {
  ensureSeedData();
  return requireRole("ADMIN");
}

function assertStatus(status) {
  if (!STATUSES.includes(status)) {
    throw { status: 400, message: "الحالة لازم تكون ACTIVE أو SUSPENDED" };
  }
}

function cleanOrganizationName(name) {
  const clean = String(name || "").trim();

  if (clean.length < 2 || clean.length > 100) {
    throw { status: 400, message: "اسم المنظمة لازم يكون بين حرفين و100 حرف" };
  }

  return clean;
}

function cleanPersonName(name) {
  const clean = String(name || "").trim();

  if (clean.length < 2 || clean.length > 80) {
    throw { status: 400, message: "الاسم لازم يكون بين حرفين و80 حرف" };
  }

  return clean;
}

function cleanEmail(email) {
  const clean = String(email || "").trim().toLowerCase();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
    throw { status: 400, message: "البريد الإلكتروني غير صالح" };
  }

  return clean;
}

function cleanPassword(password) {
  const clean = String(password || "");

  if (clean.length < 8 || clean.length > 72) {
    throw { status: 400, message: "كلمة المرور لازم تكون بين 8 و72 حرف" };
  }

  return clean;
}

function findOwner(organization) {
  if (organization.owner) {
    const owner = db.users.findById(organization.owner);
    if (owner) {
      return owner;
    }
  }

  return (
    db.users
      .all()
      .find(
        (user) =>
          user.role === "OWNER" && user.organizationId === organization.id
      ) || null
  );
}

function serializeAdminOrganization(organization) {
  const owner = findOwner(organization);

  return {
    id: organization.id,
    name: organization.name,
    status: organization.status || "ACTIVE",
    owner: owner
      ? {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          status: owner.status || "ACTIVE",
        }
      : null,
    memberCount: db.users.findMany({ organizationId: organization.id }).length,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt || organization.createdAt,
  };
}

function findOrganization(organizationId) {
  const organization = db.organizations.findById(organizationId);

  if (!organization) {
    throw { status: 404, message: "المنظمة مش موجودة" };
  }

  return organization;
}

export const adminMock = {
  async listOrganizations() {
    await delay();
    requireAdmin();

    const organizations = db.organizations
      .all()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return { data: organizations.map(serializeAdminOrganization) };
  },

  async getOrganization(organizationId) {
    await delay();
    requireAdmin();

    return {
      data: serializeAdminOrganization(findOrganization(organizationId)),
    };
  },

  async createOrganization({ name, owner } = {}) {
    await delay();
    requireAdmin();

    const cleanName = cleanOrganizationName(name);
    const ownerInput = owner || {};
    const ownerName = cleanPersonName(ownerInput.name);
    const email = cleanEmail(ownerInput.email);
    const password = cleanPassword(ownerInput.password);

    if (db.users.findByEmail(email)) {
      throw { status: 409, message: "البريد مستخدم بالفعل" };
    }

    const ownerUser = db.users.create({
      id: crypto.randomUUID(),
      email,
      passwordHash: `mock-hash-${password}`,
      name: ownerName,
      role: "OWNER",
      status: "ACTIVE",
      organizationId: null,
      createdAt: Date.now(),
    });

    let organization;

    try {
      organization = db.organizations.create({
        id: crypto.randomUUID(),
        name: cleanName,
        owner: ownerUser.id,
        status: "ACTIVE",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      db.users.delete(ownerUser.id);
      throw error;
    }

    const updatedOwner = db.users.update(ownerUser.id, {
      organizationId: organization.id,
    });

    return {
      data: {
        organization: serializeAdminOrganization(organization),
        owner: publicUser(updatedOwner),
      },
    };
  },

  async updateOrganization(organizationId, patch = {}) {
    await delay();
    requireAdmin();

    const organization = findOrganization(organizationId);
    const name = cleanOrganizationName(patch.name);

    const updated = db.organizations.update(organization.id, {
      name,
      updatedAt: Date.now(),
    });

    return { data: serializeAdminOrganization(updated) };
  },

  async updateOrganizationStatus(organizationId, status) {
    await delay();
    requireAdmin();
    assertStatus(status);

    const organization = findOrganization(organizationId);

    const updated = db.organizations.update(organization.id, {
      status,
      updatedAt: Date.now(),
    });

    return { data: serializeAdminOrganization(updated) };
  },

  async listUsers() {
    await delay();
    requireAdmin();

    const users = db.users
      .all()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .map(publicUser);

    return { data: users };
  },

  async getUser(userId) {
    await delay();
    requireAdmin();

    const user = db.users.findById(userId);

    if (!user) {
      throw { status: 404, message: "المستخدم مش موجود" };
    }

    return { data: publicUser(user) };
  },

  async updateUserStatus(userId, status) {
    await delay();
    const actor = requireAdmin();
    assertStatus(status);

    if (actor.id === userId) {
      throw { status: 400, message: "مش ممكن تغيّر حالة حسابك بنفسك" };
    }

    const user = db.users.findById(userId);

    if (!user) {
      throw { status: 404, message: "المستخدم مش موجود" };
    }

    const updated = db.users.update(user.id, { status });

    return { data: publicUser(updated) };
  },
};
