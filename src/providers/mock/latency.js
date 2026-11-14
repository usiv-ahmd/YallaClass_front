// providers/mock/latency.js
import { db } from "./db";

const MIN_MS = 80;
const MAX_MS = 220;

export function delay(ms) {
  const wait = typeof ms === "number" ? ms : MIN_MS + Math.random() * (MAX_MS - MIN_MS);
  return new Promise((resolve) => setTimeout(resolve, wait));
}

export function maybeFail(rate = 0) {
  if (Math.random() < rate) {
    throw { status: 503, message: "الشبكة مش مستقرة، حاول تاني" };
  }
}

export function requireAuth() {
  const user = db.users.current();
  if (!user) throw { status: 401, message: "غير مصرح" };
  if (user.status === "SUSPENDED") throw { status: 403, message: "الحساب موقوف" };
  return user;
}

export function requireRole(...roles) {
  const user = requireAuth();
  if (!roles.includes(user.role)) {
    throw { status: 403, message: "غير مصرح" };
  }
  return user;
}

export function requireOrg() {
  const user = requireAuth();
  if (!user.organizationId) {
    throw { status: 403, message: "لازم تكون عضو في منظمة" };
  }
  return user;
}

export function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}