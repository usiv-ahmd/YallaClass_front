// src/providers/mock/organization.mock.js
import { db } from "./db";
import { broadcast } from "./broadcast";
import { delay, requireOrg, requireRole, publicUser } from "./latency";

const OWNER_ONLY = ["OWNER"];
const EDITABLE_ROLES = ["TEACHER", "ASSISTANT"];
const EDITABLE_STATUSES = ["ACTIVE", "SUSPENDED"];

function cleanPersonName(name) {
  const clean = String(name || "").trim();

  if (clean.length < 2 || clean.length > 80) {
    throw { status: 400, message: "الاسم لازم يكون بين حرفين و80 حرف" };
  }

  return clean;
}

function assertMemberIsManageable(member) {
  if (member.role === "OWNER" || member.role === "ADMIN") {
    throw {
      status: 403,
      message: "مش مسموح إدارة حساب المالك أو أدمن المنصة من هنا",
    };
  }
}

export const organizationMock = {
  async get() {
    await delay();
    const user = requireOrg();
    const org = db.organizations.findById(user.organizationId);
    if (!org) throw { status: 404, message: "المنظمة مش موجودة" };
    return { data: { ...org, status: org.status || "ACTIVE" } };
  },

  async update(payload = {}) {
    await delay();
    const user = requireRole(...OWNER_ONLY);
    const org = db.organizations.findById(user.organizationId);
    if (!org) throw { status: 404, message: "المنظمة مش موجودة" };

    const patch = {};
    if (payload.name !== undefined) {
      const clean = String(payload.name).trim();
      if (clean.length < 2 || clean.length > 100) {
        throw { status: 400, message: "اسم المنظمة لازم يكون بين حرفين و100 حرف" };
      }
      patch.name = clean;
    }
    if (payload.logoUrl !== undefined) {
      patch.logoUrl = payload.logoUrl || null;
    }
    if (payload.timezone !== undefined) {
      patch.timezone = String(payload.timezone);
    }

    if (Object.keys(patch).length === 0) return { data: org };

    const updated = db.organizations.update(org.id, {
      ...patch,
      updatedAt: Date.now(),
    });
    broadcast.emit("organization:updated", { orgId: org.id });
    return { data: { ...updated, status: updated.status || "ACTIVE" } };
  },

  async listMembers() {
    await delay();
    const user = requireOrg();
    const members = db.users
      .findMany({ organizationId: user.organizationId })
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .map(publicUser);
    return { data: members };
  },

  async addMember({ name, email, password, role } = {}) {
    await delay();
    const actor = requireRole(...OWNER_ONLY);

    if (!EDITABLE_ROLES.includes(role)) {
      throw { status: 400, message: "الدور لازم يكون TEACHER أو ASSISTANT" };
    }

    const cleanName = cleanPersonName(name);
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPass = String(password || "");

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      throw { status: 400, message: "البريد الإلكتروني غير صالح" };
    }
    if (cleanPass.length < 8 || cleanPass.length > 72) {
      throw { status: 400, message: "كلمة المرور لازم تكون بين 8 و72 حرف" };
    }
    if (db.users.findByEmail(cleanEmail)) {
      throw { status: 409, message: "البريد مستخدم بالفعل" };
    }

    const member = db.users.create({
      id: crypto.randomUUID(),
      email: cleanEmail,
      passwordHash: `mock-hash-${cleanPass}`,
      name: cleanName,
      role,
      status: "ACTIVE",
      organizationId: actor.organizationId,
      createdAt: Date.now(),
    });

    broadcast.emit("organization:member-added", { memberId: member.id });
    return { data: publicUser(member) };
  },

  async updateMember(memberId, patch = {}) {
    await delay();
    const actor = requireRole(...OWNER_ONLY);
    const member = db.users.findById(memberId);
    if (!member || member.organizationId !== actor.organizationId) {
      throw { status: 404, message: "العضو مش موجود" };
    }

    assertMemberIsManageable(member);

    const next = {};

    if (patch.name !== undefined) {
      next.name = cleanPersonName(patch.name);
    }

    if (patch.role !== undefined) {
      if (!EDITABLE_ROLES.includes(patch.role)) {
        throw { status: 400, message: "دور غير صالح" };
      }
      next.role = patch.role;
    }

    if (patch.status !== undefined) {
      if (!EDITABLE_STATUSES.includes(patch.status)) {
        throw { status: 400, message: "حالة غير صالحة" };
      }
      next.status = patch.status;
    }

    if (Object.keys(next).length === 0) return { data: publicUser(member) };

    const updated = db.users.update(member.id, next);
    broadcast.emit("organization:member-updated", { memberId: member.id });
    return { data: publicUser(updated) };
  },

  async removeMember(memberId) {
    await delay();
    const actor = requireRole(...OWNER_ONLY);
    const member = db.users.findById(memberId);
    if (!member || member.organizationId !== actor.organizationId) {
      throw { status: 404, message: "العضو مش موجود" };
    }

    assertMemberIsManageable(member);

    db.users.delete(member.id);
    broadcast.emit("organization:member-removed", { memberId });
    return { data: memberId };
  },
};
