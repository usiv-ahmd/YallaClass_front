// providers/mock/db.js
const DB_KEY = "yalla-class:db";
const TOKEN_KEY = "yalla-class:token";

function load() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function save(state) {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
}

let _state = load();

function persist() {
  save(_state);
}

function makeCollection(name) {
  const getList = () => (_state[name] ||= []);
  const setList = (list) => {
    _state[name] = list;
    persist();
  };

  return {
    all() {
      return [...getList()];
    },

    findById(id) {
      return getList().find((x) => x.id === id) || null;
    },

    findMany(filter = {}) {
      let list = getList();
      for (const [key, value] of Object.entries(filter)) {
        if (value === undefined) continue;
        list = list.filter((x) => x[key] === value);
      }
      return [...list];
    },

    create(item) {
      const list = getList();
      if (list.some((x) => x.id === item.id)) {
        throw { status: 409, message: "العنصر موجود بالفعل" };
      }
      list.push(item);
      setList(list);
      return item;
    },

    update(id, patch) {
      const list = getList();
      const idx = list.findIndex((x) => x.id === id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...patch };
      setList(list);
      return list[idx];
    },

    delete(id) {
      const list = getList();
      const next = list.filter((x) => x.id !== id);
      if (next.length === list.length) return false;
      setList(next);
      return true;
    },
  };
}

const _users = makeCollection("users");
const _organizations = makeCollection("organizations");
const _quizzes = makeCollection("quizzes");
const _sessions = makeCollection("sessions");
const _sections = makeCollection("sections");

const tokens = {
  save(token, userId) {
    localStorage.setItem(TOKEN_KEY, token);
    _state.tokenUserId = userId;
    persist();
  },

  currentUserId() {
    return _state.tokenUserId || null;
  },

  clearCurrent() {
    localStorage.removeItem(TOKEN_KEY);
    _state.tokenUserId = null;
    persist();
  },
};

export const db = {
  users: {
    ..._users,
    current() {
      const id = tokens.currentUserId();
      if (!id) return null;
      return _users.findById(id);
    },
    findByEmail(email) {
      const clean = String(email || "").trim().toLowerCase();
      return _users.all().find((u) => u.email === clean) || null;
    },
  },

  organizations: _organizations,

  quizzes: _quizzes,

  sessions: {
    ..._sessions,
    findByCode(code) {
      const clean = String(code || "").trim().toUpperCase();
      return _sessions.all().find((s) => String(s.code || "").toUpperCase() === clean) || null;
    },
  },

  sections: _sections,

  tokens,

  reload() {
    _state = load();
  },
};

if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("storage", (e) => {
    if (e.key === "yalla-class:db") {
      _state = load();
    }
  });
}

export function _resetDb() {
  _state = {};
  persist();
  localStorage.removeItem(TOKEN_KEY);
}

export function _dumpDb() {
  return JSON.parse(JSON.stringify(_state));
}