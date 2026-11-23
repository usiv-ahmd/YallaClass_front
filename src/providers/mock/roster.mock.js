// src/providers/mock/roster.mock.js
//
// Mock roster provider: sections, students, avatars, and student history.
// Storage stays in the shared mock DB; responses use the same normalized shape
// as the HTTP provider so the roster UI is mode-agnostic.
import { db } from "./db";
import { broadcast } from "./broadcast";
import { delay, requireRole } from "./latency";
import {
  AVATAR_COLORS,
  AVATAR_PRESETS,
  DEFAULT_AVATAR,
  buildAvatarPayload,
  buildImportPayload,
  buildSectionPatch,
  buildSectionPayload,
  buildStudentPatch,
  buildStudentPayload,
  normalizeAvatarOptions,
  normalizeSection,
  normalizeStudent,
  normalizeStudentHistory,
} from "../../adapters/roster.adapter.js";

const READ_ROLES = ["OWNER", "TEACHER", "ASSISTANT"];
const WRITE_ROLES = ["OWNER", "TEACHER"];
const LATE_THRESHOLD_MS = 60 * 1000;

function sectionsFor(user) {
  return db.sections.findMany({ organizationId: user.organizationId });
}

function studentsFor(user) {
  return db.students.findMany({ organizationId: user.organizationId });
}

function findSectionOrThrow(sectionId, user) {
  const section = db.sections.findById(sectionId);

  if (!section || section.organizationId !== user.organizationId) {
    throw { status: 404, message: "القسم مش موجود" };
  }

  return section;
}

function findStudentOrThrow(studentId, user) {
  const student = db.students.findById(studentId);

  if (!student || student.organizationId !== user.organizationId) {
    throw { status: 404, message: "الطالب مش موجود" };
  }

  return student;
}

function studentCount(sectionId) {
  return db.students.findMany({ section: sectionId }).length;
}

function sectionToApi(section, includeStudents = false) {
  const students = db.students
    .findMany({ section: section.id })
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));

  return normalizeSection({
    ...section,
    studentCount: students.length,
    ...(includeStudents
      ? { students: students.map((student) => normalizeStudent(student)) }
      : {}),
  });
}

function assertSectionNameAvailable(user, name, excludeId) {
  const existing = sectionsFor(user).find(
    (section) => section.name === name && section.id !== excludeId
  );

  if (existing) {
    throw { status: 409, message: "فيه قسم بنفس الاسم بالفعل" };
  }
}

function createStudentDocument(user, payload) {
  const section = findSectionOrThrow(payload.section, user);
  const avatar = payload.avatar || {};

  return {
    id: crypto.randomUUID(),
    organizationId: user.organizationId,
    name: payload.name,
    nickname: payload.nickname || "",
    section: section.id,
    avatar: {
      preset: avatar.preset || DEFAULT_AVATAR.preset,
      color: avatar.color || DEFAULT_AVATAR.color,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function ratio(part, total) {
  return total > 0 ? Math.round((part / total) * 10000) / 10000 : 0;
}

function percentage(part, total) {
  return total > 0 ? Math.round((part / total) * 10000) / 100 : 0;
}

function buildParticipantRecord(session, participant, student, sectionName, quiz) {
  const answers = session.answers?.[participant.id] || {};
  const answerList = Object.values(answers).filter(
    (answer) => answer && answer.selectedOption != null
  );
  const answeredCount = answerList.length;
  const correctCount = Number(participant.correctAnswers) || 0;
  const totalQuestions = (session.questions || []).length;
  const totalResponseTimeMs = answerList.reduce(
    (total, answer) => total + (Number(answer.responseMs) || 0),
    0
  );
  const startedAt = session.live?.startedAt || null;
  const endedAt = session.finishedAt || null;
  const joinedAt = participant.joinedAt || null;
  const status =
    participant.attendanceStatus ||
    (participant.attended === false ? "ABSENT" : "PRESENT");

  return {
    id: `${session.id}:${participant.id}`,
    session: { id: session.id, startedAt, endedAt },
    quiz: { id: session.quizId, title: quiz?.title || session.title || "" },
    section: participant.sectionId || student?.section || null,
    sectionName,
    name: participant.name,
    nickname: participant.nickname || participant.name,
    status,
    guest: !participant.studentId,
    rosterMissing: false,
    late: Boolean(
      joinedAt && startedAt && joinedAt - startedAt > LATE_THRESHOLD_MS
    ),
    connected: !participant.leftAt,
    joinedAt,
    leftAt: participant.leftAt || null,
    durationMs: joinedAt && endedAt ? Math.max(0, endedAt - joinedAt) : 0,
    answeredCount,
    correctCount,
    incorrectCount: Math.max(0, answeredCount - correctCount),
    totalQuestions,
    accuracy: ratio(correctCount, answeredCount),
    accuracyPercentage: percentage(correctCount, answeredCount),
    score: Number(participant.score) || 0,
    gameScore: Number(participant.score) || 0,
    rawScore: Number(participant.score) || 0,
    bestStreak: Number(participant.highestStreak) || 0,
    academicBestStreak: Number(participant.highestStreak) || 0,
    finalRank: participant.rank ?? null,
    totalResponseTimeMs,
    averageResponseTimeMs:
      answeredCount > 0 ? Math.round(totalResponseTimeMs / answeredCount) : 0,
  };
}

function buildAbsentRecord(session, student, sectionName, quiz) {
  const endedAt = session.finishedAt || null;

  return {
    id: `${session.id}:${student.id}`,
    session: { id: session.id, startedAt: session.live?.startedAt || null, endedAt },
    quiz: { id: session.quizId, title: quiz?.title || session.title || "" },
    section: student.section || null,
    sectionName,
    name: student.name,
    nickname: student.nickname || student.name,
    status: "ABSENT",
    guest: false,
    rosterMissing: false,
    late: false,
    connected: false,
    joinedAt: null,
    leftAt: null,
    durationMs: 0,
    answeredCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    totalQuestions: (session.questions || []).length,
    accuracy: 0,
    accuracyPercentage: 0,
    score: 0,
    gameScore: 0,
    rawScore: 0,
    bestStreak: 0,
    academicBestStreak: 0,
    finalRank: null,
    totalResponseTimeMs: 0,
    averageResponseTimeMs: 0,
  };
}

function recordTime(record) {
  const value = record.session?.endedAt ?? record.sessionEndedAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

export const rosterMock = {
  async listSections({ search } = {}) {
    await delay();
    const user = requireRole(...READ_ROLES);
    const term = String(search || "").trim().toLowerCase();

    return {
      data: sectionsFor(user)
        .filter(
          (section) =>
            !term ||
            section.name.toLowerCase().includes(term) ||
            String(section.description || "").toLowerCase().includes(term)
        )
        .sort((a, b) => a.name.localeCompare(b.name, "ar"))
        .map((section) => sectionToApi(section)),
    };
  },

  async getSection(sectionId) {
    await delay();
    const user = requireRole(...READ_ROLES);
    const section = findSectionOrThrow(sectionId, user);
    return { data: sectionToApi(section, true) };
  },

  async createSection(payload = {}) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const { name, description } = buildSectionPayload(payload);
    assertSectionNameAvailable(user, name);

    const section = db.sections.create({
      id: crypto.randomUUID(),
      organizationId: user.organizationId,
      name,
      description,
      createdBy: user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    broadcast.emit("section:created", { sectionId: section.id });
    return { data: sectionToApi(section) };
  },

  async updateSection(sectionId, patch = {}) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const section = findSectionOrThrow(sectionId, user);
    const next = buildSectionPatch(patch);

    if (next.name !== undefined) {
      assertSectionNameAvailable(user, next.name, section.id);
    }

    const updated = db.sections.update(section.id, {
      ...next,
      updatedAt: Date.now(),
    });

    broadcast.emit("section:updated", { sectionId: updated.id });
    return { data: sectionToApi(updated) };
  },

  async deleteSection(sectionId) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const section = findSectionOrThrow(sectionId, user);

    if (studentCount(section.id) > 0) {
      throw {
        status: 409,
        message: "مش ممكن تحذف قسم فيه طلاب. انقل الطلاب أو احذفهم الأول.",
      };
    }

    db.sections.delete(section.id);
    broadcast.emit("section:deleted", { sectionId });
    return { data: { id: sectionId } };
  },

  async listStudents({ search, section } = {}) {
    await delay();
    const user = requireRole(...READ_ROLES);
    const term = String(search || "").trim().toLowerCase();

    let items = studentsFor(user);

    if (section) {
      items = items.filter((student) => student.section === section);
    }

    if (term) {
      items = items.filter(
        (student) =>
          student.name.toLowerCase().includes(term) ||
          String(student.nickname || "").toLowerCase().includes(term)
      );
    }

    return {
      data: items
        .sort((a, b) => a.name.localeCompare(b.name, "ar"))
        .map((student) => normalizeStudent(student)),
    };
  },

  async getStudent(studentId) {
    await delay();
    const user = requireRole(...READ_ROLES);
    return { data: normalizeStudent(findStudentOrThrow(studentId, user)) };
  },

  async createStudent(payload = {}) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const clean = buildStudentPayload(payload);
    const student = db.students.create(createStudentDocument(user, clean));

    broadcast.emit("student:created", { studentId: student.id });
    return { data: normalizeStudent(student) };
  },

  async importStudents(section, students) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const payload = buildImportPayload(section, students);
    const created = payload.students.map((student) =>
      db.students.create(
        createStudentDocument(user, { ...student, section: payload.section })
      )
    );

    broadcast.emit("student:imported", {
      sectionId: payload.section,
      count: created.length,
    });

    return {
      data: {
        importedCount: created.length,
        students: created.map((student) => normalizeStudent(student)),
      },
    };
  },

  async updateStudent(studentId, patch = {}) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const student = findStudentOrThrow(studentId, user);
    const next = buildStudentPatch(patch);

    if (next.section !== undefined) {
      findSectionOrThrow(next.section, user);
    }

    const update = { ...next, updatedAt: Date.now() };

    if (next.avatar) {
      update.avatar = {
        preset: next.avatar.preset || student.avatar?.preset || DEFAULT_AVATAR.preset,
        color: next.avatar.color || student.avatar?.color || DEFAULT_AVATAR.color,
      };
    }

    const updated = db.students.update(student.id, update);
    broadcast.emit("student:updated", { studentId: updated.id });
    return { data: normalizeStudent(updated) };
  },

  async updateStudentAvatar(studentId, avatar = {}) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const student = findStudentOrThrow(studentId, user);
    const patch = buildAvatarPayload(avatar);

    const updated = db.students.update(student.id, {
      avatar: {
        preset: patch.preset || student.avatar?.preset || DEFAULT_AVATAR.preset,
        color: patch.color || student.avatar?.color || DEFAULT_AVATAR.color,
      },
      updatedAt: Date.now(),
    });

    broadcast.emit("student:updated", { studentId: updated.id });
    return { data: normalizeStudent(updated) };
  },

  async deleteStudent(studentId) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const student = findStudentOrThrow(studentId, user);

    db.students.delete(student.id);
    broadcast.emit("student:deleted", { studentId });
    return { data: { id: studentId } };
  },

  async getStudentHistory(studentId, params = {}) {
    await delay();
    const user = requireRole(...READ_ROLES);
    const student = findStudentOrThrow(studentId, user);
    const section = student.section ? db.sections.findById(student.section) : null;
    const sectionsById = new Map(
      sectionsFor(user).map((item) => [item.id, item])
    );

    let records = db.sessions
      .findMany({ organizationId: user.organizationId })
      .filter((session) => session.finishedAt)
      .map((session) => {
        const quiz = session.quizId
          ? db.quizzes.findById(session.quizId)
          : null;
        const participant = (session.students || []).find(
          (item) =>
            item.studentId === student.id ||
            (item.name?.trim().toLowerCase() === student.name.trim().toLowerCase() &&
              (!item.sectionId || item.sectionId === student.section))
        );
        const participantSection = participant?.sectionId
          ? sectionsById.get(participant.sectionId)
          : section;

        return participant
          ? buildParticipantRecord(
              session,
              participant,
              student,
              participantSection?.name || "",
              quiz
            )
          : buildAbsentRecord(
              session,
              student,
              section?.name || "",
              quiz
            );
      });

    if (params.session) {
      records = records.filter(
        (record) => record.session.id === params.session
      );
    }

    if (params.quiz) {
      records = records.filter((record) => record.quiz.id === params.quiz);
    }

    if (params.status) {
      records = records.filter((record) => record.status === params.status);
    }

    const fromTime = params.from ? new Date(params.from).getTime() : null;
    const toTime = params.to ? new Date(params.to).getTime() : null;

    if (fromTime !== null) {
      records = records.filter((record) => recordTime(record) >= fromTime);
    }

    if (toTime !== null) {
      records = records.filter((record) => recordTime(record) <= toTime);
    }

    records.sort((a, b) => recordTime(b) - recordTime(a));

    const total = records.length;
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 50));
    const offset = Math.max(0, Number(params.offset) || 0);
    const page = records.slice(offset, offset + limit);
    const attended = records.filter((record) => record.joinedAt);
    const totalAnswered = records.reduce(
      (sum, record) => sum + record.answeredCount,
      0
    );
    const totalCorrect = records.reduce(
      (sum, record) => sum + record.correctCount,
      0
    );
    const totalResponseTimeMs = records.reduce(
      (sum, record) => sum + record.totalResponseTimeMs,
      0
    );
    const totalScore = attended.reduce(
      (sum, record) => sum + record.score,
      0
    );

    return {
      data: normalizeStudentHistory({
        student,
        filters: {
          from: params.from || null,
          to: params.to || null,
          session: params.session || null,
          quiz: params.quiz || null,
          status: params.status || null,
        },
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + page.length < total,
        },
        summary: {
          sessions: total,
          attendedSessions: attended.length,
          present: records.filter((record) => record.status === "PRESENT")
            .length,
          absent: records.filter((record) => record.status === "ABSENT")
            .length,
          kicked: records.filter((record) => record.status === "KICKED")
            .length,
          late: records.filter((record) => record.late).length,
          totalAnswered,
          totalCorrect,
          accuracy: ratio(totalCorrect, totalAnswered),
          accuracyPercentage: percentage(totalCorrect, totalAnswered),
          averageScore:
            attended.length > 0
              ? Math.round((totalScore / attended.length) * 100) / 100
              : 0,
          bestScore: attended.reduce(
            (best, record) => Math.max(best, record.score),
            0
          ),
          averageResponseTimeMs:
            totalAnswered > 0
              ? Math.round(totalResponseTimeMs / totalAnswered)
              : 0,
        },
        history: page,
      }),
    };
  },

  async getAvatarOptions() {
    await delay(30);
    requireRole(...READ_ROLES);

    return {
      data: normalizeAvatarOptions({
        presets: AVATAR_PRESETS,
        colors: AVATAR_COLORS,
        default: DEFAULT_AVATAR,
      }),
    };
  },
};
