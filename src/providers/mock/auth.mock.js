// src/providers/mock/auth.mock.js
import { db } from "./db";
import { delay } from "./latency";
import { ensureSeedData } from "./seed";

const OLD_TEACHER_ID_KEY = "live-quiz:teacher-id";
const OLD_TEACHER_NAME_KEY = "live-quiz:teacher-name";

function publicUser(u) {
  if (!u) return null;
  const rest = { ...u };
  delete rest.passwordHash;
  return rest;
}

function mirrorLegacyKeys(user) {
  try {
    localStorage.setItem(OLD_TEACHER_ID_KEY, user.id);
    localStorage.setItem(OLD_TEACHER_NAME_KEY, user.name);
  } catch {
    // Storage can be unavailable (private mode / disabled cookies).
  }
}

function clearLegacyKeys() {
  try {
    localStorage.removeItem(OLD_TEACHER_ID_KEY);
    localStorage.removeItem(OLD_TEACHER_NAME_KEY);
  } catch {
    // Storage can be unavailable (private mode / disabled cookies).
  }
}

export const authMock = {
  async register({ email, password, name }) {
    await delay();
    ensureSeedData();

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(name || "").trim();
    const cleanPass = String(password || "");

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      throw { status: 400, message: "البريد الإلكتروني غير صالح" };
    }
    if (cleanName.length < 2) {
      throw { status: 400, message: "الاسم قصير أوي" };
    }
    if (cleanPass.length < 6) {
      throw { status: 400, message: "كلمة المرور 6 حروف على الأقل" };
    }
    if (db.users.findByEmail(cleanEmail)) {
      throw { status: 409, message: "البريد مستخدم بالفعل" };
    }

    const org = db.organizations.create({
      id: crypto.randomUUID(),
      name: `مؤسسة ${cleanName}`,
      logoUrl: null,
      timezone: "Africa/Cairo",
      createdAt: Date.now(),
    });

    const user = db.users.create({
      id: crypto.randomUUID(),
      email: cleanEmail,
      passwordHash: `mock-hash-${cleanPass}`,
      name: cleanName,
      role: "OWNER",
      status: "ACTIVE",
      organizationId: org.id,
      createdAt: Date.now(),
    });

    const token = `mock.${user.id}.${Date.now()}`;
    db.tokens.save(token, user.id);
    mirrorLegacyKeys(user);

    return { data: { token, user: publicUser(user) } };
  },

  async login({ email, password }) {
    await delay();
    ensureSeedData();

    const cleanEmail = String(email || "").trim().toLowerCase();
    const user = db.users.findByEmail(cleanEmail);
    if (!user || user.passwordHash !== `mock-hash-${password}`) {
      throw { status: 401, message: "البريد أو كلمة المرور غلط" };
    }
    if (user.status === "SUSPENDED") {
      throw { status: 403, message: "الحساب موقوف" };
    }

    if (user.organizationId) {
      const organization = db.organizations.findById(user.organizationId);

      if (!organization) {
        throw { status: 403, message: "المنظمة مش متاحة" };
      }

      if (organization.status === "SUSPENDED") {
        throw { status: 403, message: "المنظمة موقوفة" };
      }
    }

    const token = `mock.${user.id}.${Date.now()}`;
    db.tokens.save(token, user.id);
    mirrorLegacyKeys(user);

    return { data: { token, user: publicUser(user) } };
  },

  async logout() {
    await delay();
    db.tokens.clearCurrent();
    clearLegacyKeys();
    return { data: { ok: true } };
  },

  async me() {
    await delay();
    const user = db.users.current();
    if (!user) throw { status: 401, message: "غير مصرح" };
    return { data: { user: publicUser(user) } };
  },
};