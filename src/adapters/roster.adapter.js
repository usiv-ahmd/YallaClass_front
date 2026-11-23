// src/adapters/roster.adapter.js
//
// Normalizes section/student/avatar/history payloads and validates the exact
// payloads the backend accepts:
//   section: { name (1..100), description (<=500) }
//   student: { name (1..80), nickname (<=50), section (required), avatar? }
//   import:  { section, students: [{ name, nickname?, avatar? }] } (max 500)
//   avatar:  preset in AVATAR_PRESET_IDS, color in AVATAR_COLOR_IDS

export const AVATAR_PRESETS = [
  { id: "FOX", label: "ثعلب", emoji: "🦊" },
  { id: "PANDA", label: "باندا", emoji: "🐼" },
  { id: "LION", label: "أسد", emoji: "🦁" },
  { id: "ROBOT", label: "روبوت", emoji: "🤖" },
  { id: "ALIEN", label: "فضائي", emoji: "👽" },
  { id: "CAT", label: "قطة", emoji: "🐱" },
  { id: "DOG", label: "كلب", emoji: "🐶" },
  { id: "UNICORN", label: "يونيكورن", emoji: "🦄" },
];

export const AVATAR_COLORS = [
  { id: "#EF4444", label: "أحمر" },
  { id: "#F97316", label: "برتقالي" },
  { id: "#EAB308", label: "أصفر" },
  { id: "#22C55E", label: "أخضر" },
  { id: "#06B6D4", label: "سماوي" },
  { id: "#3B82F6", label: "أزرق" },
  { id: "#8B5CF6", label: "بنفسجي" },
  { id: "#EC4899", label: "وردي" },
];

export const AVATAR_PRESET_IDS = AVATAR_PRESETS.map((preset) => preset.id);
export const AVATAR_COLOR_IDS = AVATAR_COLORS.map((color) => color.id);
export const DEFAULT_AVATAR = { preset: "FOX", color: "#3B82F6" };
export const MAX_IMPORT_STUDENTS = 500;
export const SECTION_NAME_MAX_LENGTH = 100;
export const SECTION_DESCRIPTION_MAX_LENGTH = 500;
export const STUDENT_NAME_MAX_LENGTH = 80;
export const STUDENT_NICKNAME_MAX_LENGTH = 50;

function validationError(message) {
  const error = new Error(message);
  error.name = "ValidationError";
  error.status = 400;
  return error;
}

export function normalizeSection(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    id: raw.id ?? raw._id ?? null,
    name: String(raw.name ?? "").trim(),
    description: String(raw.description ?? "").trim(),
    organizationId: raw.organization ?? raw.organizationId ?? null,
    createdBy: raw.createdBy ?? null,
    studentCount: Number(raw.studentCount) || 0,
    students: Array.isArray(raw.students)
      ? raw.students.map(normalizeStudent).filter(Boolean)
      : undefined,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

export function normalizeSectionList(rawSections) {
  if (!Array.isArray(rawSections)) return [];
  return rawSections.map(normalizeSection).filter(Boolean);
}

export function normalizeStudent(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    id: raw.id ?? raw._id ?? null,
    name: String(raw.name ?? "").trim(),
    nickname: String(raw.nickname ?? "").trim(),
    organizationId: raw.organization ?? raw.organizationId ?? null,
    sectionId: raw.section ?? raw.sectionId ?? null,
    avatar: {
      preset: raw.avatar?.preset || DEFAULT_AVATAR.preset,
      color: raw.avatar?.color || DEFAULT_AVATAR.color,
    },
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

export function normalizeStudentList(rawStudents) {
  if (!Array.isArray(rawStudents)) return [];
  return rawStudents.map(normalizeStudent).filter(Boolean);
}

export function normalizeAvatarOptions(raw) {
  const presets = Array.isArray(raw?.presets) ? raw.presets : AVATAR_PRESETS;
  const colors = Array.isArray(raw?.colors) ? raw.colors : AVATAR_COLORS;

  return {
    presets: presets.map((preset) => ({
      id: preset.id,
      label: preset.label || preset.id,
    })),
    colors: colors.map((color) => ({
      id: color.id,
      label: color.label || color.id,
    })),
    default: {
      preset: raw?.default?.preset || DEFAULT_AVATAR.preset,
      color: raw?.default?.color || DEFAULT_AVATAR.color,
    },
  };
}

function normalizeHistoryRecord(raw) {
  const sessionId =
    raw?.session && typeof raw.session === "object"
      ? raw.session.id
      : raw?.session ?? null;

  return {
    id: raw?.id ?? null,
    sessionId,
    sessionStartedAt:
      raw?.session?.startedAt ?? raw?.sessionStartedAt ?? null,
    sessionEndedAt: raw?.session?.endedAt ?? raw?.sessionEndedAt ?? null,
    quizId: raw?.quiz?.id ?? null,
    quizTitle: raw?.quiz?.title ?? raw?.quizTitle ?? "",
    sectionId: raw?.section ?? null,
    sectionName: raw?.sectionName ?? "",
    status: raw?.status ?? "PENDING",
    guest: Boolean(raw?.guest),
    late: Boolean(raw?.late),
    connected: Boolean(raw?.connected),
    joinedAt: raw?.joinedAt ?? null,
    leftAt: raw?.leftAt ?? null,
    durationMs: Number(raw?.durationMs) || 0,
    answeredCount: Number(raw?.answeredCount) || 0,
    correctCount: Number(raw?.correctCount) || 0,
    incorrectCount: Number(raw?.incorrectCount) || 0,
    totalQuestions: Number(raw?.totalQuestions) || 0,
    accuracy: Number(raw?.accuracy) || 0,
    accuracyPercentage: Number(raw?.accuracyPercentage) || 0,
    score: Number(raw?.score) || 0,
    gameScore: Number(raw?.gameScore ?? raw?.score) || 0,
    rawScore: Number(raw?.rawScore) || 0,
    bestStreak: Number(raw?.bestStreak) || 0,
    academicBestStreak: Number(raw?.academicBestStreak) || 0,
    finalRank: raw?.finalRank ?? null,
    totalResponseTimeMs: Number(raw?.totalResponseTimeMs) || 0,
    averageResponseTimeMs: Number(raw?.averageResponseTimeMs) || 0,
  };
}

export function normalizeStudentHistory(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    student: normalizeStudent(raw.student),
    filters: raw.filters || {},
    pagination: {
      total: Number(raw.pagination?.total) || 0,
      limit: Number(raw.pagination?.limit) || 50,
      offset: Number(raw.pagination?.offset) || 0,
      hasMore: Boolean(raw.pagination?.hasMore),
    },
    summary: {
      sessions: Number(raw.summary?.sessions) || 0,
      attendedSessions: Number(raw.summary?.attendedSessions) || 0,
      present: Number(raw.summary?.present) || 0,
      absent: Number(raw.summary?.absent) || 0,
      kicked: Number(raw.summary?.kicked) || 0,
      late: Number(raw.summary?.late) || 0,
      totalAnswered: Number(raw.summary?.totalAnswered) || 0,
      totalCorrect: Number(raw.summary?.totalCorrect) || 0,
      accuracy: Number(raw.summary?.accuracy) || 0,
      accuracyPercentage: Number(raw.summary?.accuracyPercentage) || 0,
      averageScore: Number(raw.summary?.averageScore) || 0,
      bestScore: Number(raw.summary?.bestScore) || 0,
      averageResponseTimeMs:
        Number(raw.summary?.averageResponseTimeMs) || 0,
    },
    history: Array.isArray(raw.history)
      ? raw.history.map(normalizeHistoryRecord)
      : [],
  };
}

function cleanText(value, max, label, required = false) {
  const text = String(value ?? "").trim();

  if (required && !text) {
    throw validationError(`${label} مطلوب.`);
  }

  if (text.length > max) {
    throw validationError(`${label} لازم يكون ${max} حرف أو أقل.`);
  }

  return text;
}

export function buildSectionPayload({ name, description } = {}) {
  return {
    name: cleanText(name, SECTION_NAME_MAX_LENGTH, "اسم القسم", true),
    description: cleanText(
      description,
      SECTION_DESCRIPTION_MAX_LENGTH,
      "وصف القسم"
    ),
  };
}

export function buildSectionPatch({ name, description } = {}) {
  const patch = {};

  if (name !== undefined) {
    patch.name = cleanText(name, SECTION_NAME_MAX_LENGTH, "اسم القسم", true);
  }

  if (description !== undefined) {
    patch.description = cleanText(
      description,
      SECTION_DESCRIPTION_MAX_LENGTH,
      "وصف القسم"
    );
  }

  if (Object.keys(patch).length === 0) {
    throw validationError("عدّل حاجة قبل الحفظ.");
  }

  return patch;
}

export function buildAvatarPayload({ preset, color } = {}) {
  const avatar = {};

  if (preset !== undefined) {
    if (!AVATAR_PRESET_IDS.includes(preset)) {
      throw validationError("شكل الأفاتار غير صالح.");
    }
    avatar.preset = preset;
  }

  if (color !== undefined) {
    if (!AVATAR_COLOR_IDS.includes(color)) {
      throw validationError("لون الأفاتار غير صالح.");
    }
    avatar.color = color;
  }

  if (Object.keys(avatar).length === 0) {
    throw validationError("اختار شكل أو لون للأفاتار.");
  }

  return avatar;
}

export function buildStudentPayload({
  name,
  nickname,
  section,
  avatar,
} = {}) {
  const cleanSection = String(section ?? "").trim();

  if (!cleanSection) {
    throw validationError("اختار القسم.");
  }

  const payload = {
    name: cleanText(name, STUDENT_NAME_MAX_LENGTH, "اسم الطالب", true),
    nickname: cleanText(
      nickname,
      STUDENT_NICKNAME_MAX_LENGTH,
      "اسم الشهرة"
    ),
    section: cleanSection,
  };

  if (avatar && (avatar.preset || avatar.color)) {
    payload.avatar = {
      preset: avatar.preset || DEFAULT_AVATAR.preset,
      color: avatar.color || DEFAULT_AVATAR.color,
    };
    buildAvatarPayload(payload.avatar);
  }

  return payload;
}

export function buildStudentPatch({
  name,
  nickname,
  section,
  avatar,
} = {}) {
  const patch = {};

  if (name !== undefined) {
    patch.name = cleanText(name, STUDENT_NAME_MAX_LENGTH, "اسم الطالب", true);
  }

  if (nickname !== undefined) {
    patch.nickname = cleanText(
      nickname,
      STUDENT_NICKNAME_MAX_LENGTH,
      "اسم الشهرة"
    );
  }

  if (section !== undefined) {
    const cleanSection = String(section ?? "").trim();
    if (!cleanSection) throw validationError("اختار القسم.");
    patch.section = cleanSection;
  }

  if (avatar !== undefined) {
    patch.avatar = buildAvatarPayload(avatar);
  }

  if (Object.keys(patch).length === 0) {
    throw validationError("عدّل حاجة قبل الحفظ.");
  }

  return patch;
}

export function parseImportText(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw validationError("اكتب اسم طالب واحد على الأقل.");
  }

  if (lines.length > MAX_IMPORT_STUDENTS) {
    throw validationError(
      `أقصى عدد للاستيراد في المرة الواحدة ${MAX_IMPORT_STUDENTS} طالب.`
    );
  }

  return lines.map((line, index) => {
    const [namePart, ...rest] = line.split(/[,\t]/);
    const name = cleanText(
      namePart,
      STUDENT_NAME_MAX_LENGTH,
      `اسم الطالب في السطر ${index + 1}`,
      true
    );
    const nickname = cleanText(
      rest.join(" "),
      STUDENT_NICKNAME_MAX_LENGTH,
      `اسم الشهرة في السطر ${index + 1}`
    );

    return { name, nickname };
  });
}

export function buildImportPayload(section, students) {
  const cleanSection = String(section ?? "").trim();

  if (!cleanSection) {
    throw validationError("اختار القسم.");
  }

  if (!Array.isArray(students) || students.length === 0) {
    throw validationError("مفيش طلاب للاستيراد.");
  }

  if (students.length > MAX_IMPORT_STUDENTS) {
    throw validationError(
      `أقصى عدد للاستيراد في المرة الواحدة ${MAX_IMPORT_STUDENTS} طالب.`
    );
  }

  return {
    section: cleanSection,
    students: students.map((student) => ({
      name: cleanText(
        student.name,
        STUDENT_NAME_MAX_LENGTH,
        "اسم الطالب",
        true
      ),
      nickname: cleanText(
        student.nickname,
        STUDENT_NICKNAME_MAX_LENGTH,
        "اسم الشهرة"
      ),
    })),
  };
}
