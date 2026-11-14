// src/providers/mock/organization.mock.js
import { db } from "./db";
import { broadcast } from "./broadcast";
import { delay, requireOrg, requireRole, publicUser } from "./latency";

const OWNER_ONLY = ["OWNER"];
const OWNER_OR_ASSISTANT = ["OWNER", "ASSISTANT"];
const EDITABLE_ROLES = ["TEACHER", "ASSISTANT"];

export const organizationMock = {
  async get() {
    await delay();
    const user = requireOrg();
    const org = db.organizations.findById(user.organizationId);
    if (!org) throw { status: 404, message: "المنظمة مش موجودة" };
    return { data: org };
  },

  async update(payload = {}) {
    await delay();
    const user = requireRole(...OWNER_ONLY);
    const org = db.organizations.findById(user.organizationId);
    if (!org) throw { status: 404, message: "المنظمة مش موجودة" };

    const patch = {};
    if (payload.name !== undefined) {
      const clean = String(payload.name).trim();
      if (clean.length < 2) {
        throw { status: 400, message: "اسم المنظمة قصير أوي" };
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

    const updated = db.organizations.update(org.id, patch);
    broadcast.emit("organization:updated", { orgId: org.id });
    return { data: updated };
  },

  async listMembers() {
    await delay();
    const user = requireOrg();
    const members = db.users.findMany({ organizationId: user.organizationId }).map(publicUser);
    return { data: members };
  },

  async addMember({ name, email, password, role } = {}) {
    await delay();
    const actor = requireRole(...OWNER_OR_ASSISTANT);

    if (!EDITABLE_ROLES.includes(role)) {
      throw { status: 400, message: "الدور لازم يكون TEACHER أو ASSISTANT" };
    }
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(name || "").trim();
    const cleanPass = String(password || "");

    if (cleanName.length < 2) {
      throw { status: 400, message: "اسم العضو قصير أوي" };
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      throw { status: 400, message: "البريد الإلكتروني غير صالح" };
    }
    if (cleanPass.length < 6) {
      throw { status: 400, message: "كلمة المرور 6 حروف على الأقل" };
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
    const actor = requireRole(...OWNER_OR_ASSISTANT);
    const member = db.users.findById(memberId);
    if (!member || member.organizationId !== actor.organizationId) {
      throw { status: 404, message: "العضو مش موجود" };
    }
    if (member.role === "OWNER") {
      throw { status: 403, message: "مش مسموح تعديل الـOwner" };
    }
    if (actor.role === "TEACHER" && member.id !== actor.id) {
      throw { status: 403, message: "غير مصرح" };
    }

    const next = {};
    if (patch.name !== undefined) {
      const clean = String(patch.name).trim();
      if (clean.length < 2) {
        throw { status: 400, message: "الاسم قصير أوي" };
      }
      next.name = clean;
    }
    if (patch.role !== undefined) {
      if (!EDITABLE_ROLES.includes(patch.role)) {
        throw { status: 400, message: "دور غير صالح" };
      }
      next.role = patch.role;
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
    if (member.role === "OWNER") {
      throw { status: 403, message: "مش مسموح حذف الـOwner" };
    }
    if (member.id === actor.id) {
      throw { status: 400, message: "مش ممكن تحذف نفسك" };
    }

    db.users.update(member.id, { organizationId: null });
    broadcast.emit("organization:member-removed", { memberId });
    return { data: { ok: true } };
  },
};