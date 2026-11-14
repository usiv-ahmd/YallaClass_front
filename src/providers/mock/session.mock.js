// src/providers/mock/session.mock.js
import { db } from "./db";
import { broadcast } from "./broadcast";
import { delay, requireOrg, requireRole } from "./latency";

const CAN_CONTROL = ["OWNER", "TEACHER", "ASSISTANT"];
const COMMAND_RULES = {
  gift: { maxUses: 1, amount: 5, requiresTarget: true, canSelfTarget: false },
  thief: { maxUses: 1, percent: 0.15, min: 5, max: 15, requiresTarget: true, canSelfTarget: false },
  rocket: { maxUses: 1, multiplier: 2, requiresTarget: false, canSelfTarget: false },
};
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function genCode() {
  for (let attempt = 0; attempt < 30; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    if (!db.sessions.findByCode(code)) return code;
  }
  throw { status: 500, message: "مقدرناش نولّد كود فريد" };
}

function ownSessionOrThrow(sessionId, user) {
  const session = db.sessions.findById(sessionId);
  if (!session) throw { status: 404, message: "الحصة مش موجودة" };
  if (session.organizationId !== user.organizationId) {
    throw { status: 403, message: "غير مصرح" };
  }
  return session;
}

function findStudentOrThrow(session, studentId) {
  const student = (session.students || []).find((s) => s.id === studentId);
  if (!student) throw { status: 404, message: "الطالب مش موجود في الحصة" };
  return student;
}

function recomputeRanks(session) {
  const sorted = [...(session.students || [])].sort((a, b) => {
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    if ((b.highestStreak || 0) !== (a.highestStreak || 0)) {
      return (b.highestStreak || 0) - (a.highestStreak || 0);
    }
    return (a.name || "").localeCompare(b.name || "", "ar");
  });
  return {
    ...session,
    students: sorted.map((s, idx) => ({ ...s, rank: idx + 1 })),
  };
}

function currentQuestion(session) {
  const qs = session.questions || [];
  return qs[session.live?.currentQuestionIndex ?? 0] || null;
}

function persistAndBroadcast(updated) {
  broadcast.emit("session:updated", { sessionId: updated.id });
  return recomputeRanks(updated);
}

function assertTeacherCanControl(session, user) {
  if (!CAN_CONTROL.includes(user.role)) {
    throw { status: 403, message: "غير مصرح" };
  }
  if (session.organizationId !== user.organizationId) {
    throw { status: 403, message: "غير مصرح" };
  }
}

function finalizeAttendance(session) {
  const threshold = session.settings?.attendanceThreshold ?? 0.5;
  const totalQ = session.questions?.length || 0;
  const students = (session.students || []).map((s) => {
    const answers = session.answers?.[s.id] || {};
    const answeredCount = Object.values(answers).filter((a) => a && a.selectedOption != null).length;
    const present = totalQ > 0 && answeredCount / totalQ >= threshold;
    return {
      ...s,
      attended: present,
      attendanceStatus: present ? "PRESENT" : "ABSENT",
      isFinished: true,
    };
  });
  return students;
}

function computeTimeLeft(session) {
  const live = session.live || {};
  const q = currentQuestion(session);
  if (!q) return 0;
  if (live.state !== "question" || !live.startedAt) {
    return live.timeLeft ?? q.duration;
  }
  const elapsedMs = Date.now() - live.startedAt;
  return Math.max(0, q.duration - elapsedMs / 1000);
}

function validateSubmission(session, questionId) {
  if (session.live?.state !== "question") {
    throw { status: 409, message: "السؤال مش شغال حاليًا" };
  }
  const q = currentQuestion(session);
  if (!q || q.id !== questionId) {
    throw { status: 400, message: "سؤال غير متطابق" };
  }
  const elapsedMs = Date.now() - (session.live.startedAt || Date.now());
  if (elapsedMs > q.duration * 1000 + 1500) {
    throw { status: 409, message: "الوقت خلص" };
  }
  return q;
}

function computeAnswerResult({ question, selectedOption, elapsedMs, student }) {
  const durationMs = question.duration * 1000;
  const remainingMs = Math.max(0, durationMs - elapsedMs);
  const isCorrect = selectedOption === question.correctOptionIndex;
  const questionPoints = question.points ?? question.weight ?? 0;

  const basePoints = isCorrect ? questionPoints : 0;
  const speedBonus = isCorrect ? Math.round(questionPoints * 0.5 * (remainingMs / durationMs)) : 0;
  const points = basePoints + speedBonus;

  const newStreak = isCorrect ? (student.currentStreak || 0) + 1 : 0;
  const newHighestStreak = Math.max(student.highestStreak || 0, newStreak);

  return {
    isCorrect,
    points,
    speedBonus,
    streak: newStreak,
    highestStreak: newHighestStreak,
    responseMs: elapsedMs,
  };
}

export const sessionMock = {
  async list() {
    await delay();
    const user = requireOrg();
    const items = db.sessions.findMany({ organizationId: user.organizationId }).map(recomputeRanks).sort((a, b) => b.createdAt - a.createdAt);
    return { data: items };
  },

  async getById(sessionId) {
    await delay();
    const user = requireOrg();
    const session = ownSessionOrThrow(sessionId, user);
    return { data: recomputeRanks(session) };
  },

  async getPublicById(sessionId) {
    await delay();
    const session = db.sessions.findById(sessionId);
    if (!session) throw { status: 404, message: "الحصة مش موجودة" };
    const sanitized = {
      ...session,
      answers: {},
    };
    return { data: recomputeRanks(sanitized) };
  },

  async getByCode(code) {
    await delay();
    const clean = String(code || "").trim().toUpperCase();
    if (!clean) throw { status: 400, message: "اكتب كود الحصة" };
    const session = db.sessions.findByCode(clean);
    if (!session) throw { status: 404, message: "الكود غلط أو الحصة مش موجودة" };
    return { data: session };
  },

  async create({ quizId, settings } = {}) {
    await delay();
    const user = requireRole(...CAN_CONTROL);
    const quiz = db.quizzes.findById(quizId);
    if (!quiz || quiz.organizationId !== user.organizationId) {
      throw { status: 404, message: "الكويز مش موجود" };
    }
    if (!quiz.questions || quiz.questions.length === 0) {
      throw { status: 400, message: "ضيف سؤال واحد على الأقل للكويز" };
    }

    const session = db.sessions.create({
      id: crypto.randomUUID(),
      organizationId: user.organizationId,
      quizId: quiz.id,
      title: quiz.title,
      subject: quiz.subject,
      code: genCode(),
      questions: quiz.questions.map((q) => ({ ...q })),
      students: [],
      answers: {},
      events: [],
      live: {
        isLive: false,
        state: "lobby",
        currentQuestionIndex: 0,
        startedAt: null,
        pausedAt: null,
        timeLeft: 0,
        autoAdvance: true,
      },
      settings: {
        commandsEnabled: {
          gift: settings?.commandsEnabled?.gift ?? true,
          thief: settings?.commandsEnabled?.thief ?? true,
          rocket: settings?.commandsEnabled?.rocket ?? true,
        },
        attendanceThreshold: settings?.attendanceThreshold ?? 0.5,
        allowJoining: true,
      },
      createdBy: user.id,
      createdAt: Date.now(),
      finishedAt: null,
    });

    broadcast.emit("session:created", { sessionId: session.id });
    return { data: session };
  },

  async updateSettings(sessionId, patch = {}) {
    await delay();
    const user = requireRole(...CAN_CONTROL);
    const session = ownSessionOrThrow(sessionId, user);
    if (session.live.state !== "lobby") {
      throw { status: 409, message: "الإعدادات بس في اللوبي" };
    }

    const nextSettings = { ...session.settings };
    if (patch.commandsEnabled) {
      for (const key of ["gift", "thief", "rocket"]) {
        if (patch.commandsEnabled[key] !== undefined) {
          nextSettings.commandsEnabled[key] = Boolean(patch.commandsEnabled[key]);
        }
      }
    }
    if (Number.isFinite(patch.attendanceThreshold)) {
      nextSettings.attendanceThreshold = Math.min(1, Math.max(0, Number(patch.attendanceThreshold)));
    }

    const updated = db.sessions.update(session.id, { settings: nextSettings });
    broadcast.emit("session:updated", { sessionId: updated.id });
    return { data: updated };
  },

  async lockJoining(sessionId, allowJoining) {
    await delay();
    const user = requireRole(...CAN_CONTROL);
    const session = ownSessionOrThrow(sessionId, user);
    const updated = db.sessions.update(session.id, {
      settings: { ...session.settings, allowJoining: Boolean(allowJoining) },
    });
    broadcast.emit("session:updated", { sessionId: updated.id });
    return { data: updated };
  },

  async join({ code, name, nickname, sectionId, avatar }) {
    await delay();
    const cleanCode = String(code || "").trim().toUpperCase();
    const cleanName = String(name || "").trim();
    if (cleanName.length < 2) {
      throw { status: 400, message: "اكتب اسمك (حرفين على الأقل)" };
    }

    const session = db.sessions.findByCode(cleanCode);
    if (!session) throw { status: 404, message: "الكود غلط أو الحصة مش موجودة" };
    if (!session.settings.allowJoining) {
      throw { status: 403, message: "الانضمام مقفول حاليًا" };
    }
    if (session.live.state !== "lobby") {
      throw { status: 409, message: "الحصة بدأت — مش مسموح الانضمام" };
    }

    const existing = (session.students || []).find((s) => s.name.trim().toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      const updated = db.sessions.update(session.id, {
        students: session.students.map((s) => (s.id === existing.id ? { ...s, lastSeenAt: Date.now(), leftAt: null } : s)),
      });
      broadcast.emit("session:updated", { sessionId: updated.id });
      const fresh = updated.students.find((s) => s.id === existing.id);
      return { data: { session: recomputeRanks(updated), student: fresh } };
    }

    const student = {
      id: crypto.randomUUID(),
      name: cleanName,
      nickname: String(nickname || "").trim() || cleanName,
      sectionId: sectionId || null,
      avatar: {
        hairColor: avatar?.hairColor || s.avatar?.hairColor || "#FF5A5F",
      },
      score: 0,
      rank: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentStreak: 0,
      highestStreak: 0,
      questionsSeen: [],
      attended: true,
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
      leftAt: null,
      isFinished: false,
    };

    const updated = db.sessions.update(session.id, {
      students: [...(session.students || []), student],
    });

    const ranked = recomputeRanks(updated);
    broadcast.emit("session:updated", { sessionId: updated.id });
    return { data: { session: ranked, student } };
  },

  async leave(sessionId, studentId) {
    await delay();
    const session = db.sessions.findById(sessionId);
    if (!session) throw { status: 404, message: "الحصة مش موجودة" };
    const updated = db.sessions.update(session.id, {
      students: session.students.map((s) => (s.id === studentId ? { ...s, leftAt: Date.now() } : s)),
    });
    broadcast.emit("session:updated", { sessionId: updated.id });
    return { data: { ok: true } };
  },

  async heartbeat(sessionId, studentId) {
    await delay(30);
    const session = db.sessions.findById(sessionId);
    if (!session) throw { status: 404, message: "الحصة مش موجودة" };
    const updated = db.sessions.update(session.id, {
      students: session.students.map((s) => (s.id === studentId ? { ...s, lastSeenAt: Date.now(), leftAt: null } : s)),
    });
    return { data: { ok: true } };
  },

  async markSeen(sessionId, studentId, questionId) {
    await delay(30);
    const session = db.sessions.findById(sessionId);
    if (!session) throw { status: 404, message: "الحصة مش موجودة" };
    const updated = db.sessions.update(session.id, {
      students: session.students.map((s) => (s.id === studentId && !(s.questionsSeen || []).includes(questionId) ? { ...s, questionsSeen: [...(s.questionsSeen || []), questionId] } : s)),
    });
    return { data: { ok: true } };
  },

  async kickStudent(sessionId, studentId) {
    await delay();
    const user = requireRole(...CAN_CONTROL);
    const session = ownSessionOrThrow(sessionId, user);
    findStudentOrThrow(session, studentId);
    const updated = db.sessions.update(session.id, {
      students: session.students.filter((s) => s.id !== studentId),
    });
    broadcast.emit("session:updated", { sessionId: updated.id });
    return { data: recomputeRanks(updated) };
  },

  async start(sessionId) {
    await delay();
    const user = requireRole(...CAN_CONTROL);
    const session = ownSessionOrThrow(sessionId, user);
    if (session.live.state !== "lobby") {
      throw { status: 409, message: "الحصة بدأت بالفعل" };
    }
    if (!session.questions || session.questions.length === 0) {
      throw { status: 400, message: "مفيش أسئلة" };
    }

    const updated = db.sessions.update(session.id, {
      live: {
        ...session.live,
        isLive: true,
        state: "countdown",
        startedAt: Date.now(),
        currentQuestionIndex: 0,
      },
    });
    return { data: persistAndBroadcast(updated) };
  },

  async cancelCountdown(sessionId) {
    await delay();
    const user = requireRole(...CAN_CONTROL);
    const session = ownSessionOrThrow(sessionId, user);
    if (session.live.state !== "countdown") {
      throw { status: 409, message: "مش في وضع العد" };
    }
    const updated = db.sessions.update(session.id, {
      live: { ...session.live, state: "lobby", startedAt: null },
    });
    return { data: persistAndBroadcast(updated) };
  },

  async startQuestion(sessionId) {
    await delay();
    const user = requireRole(...CAN_CONTROL);
    const session = ownSessionOrThrow(sessionId, user);

    if (!["countdown", "leaderboard", "explanation"].includes(session.live.state)) {
      throw { status: 409, message: "مش ممكن نبدأ سؤال من الحالة الحالية" };
    }

    const idx = session.live.currentQuestionIndex ?? 0;
    const q = session.questions[idx];
    if (!q) throw { status: 400, message: "مفيش سؤال في الترتيب ده" };

    const updated = db.sessions.update(session.id, {
      live: {
        ...session.live,
        state: "question",
        startedAt: Date.now(),
        pausedAt: null,
        timeLeft: q.duration,
        currentQuestionIndex: idx,
      },
    });
    return { data: persistAndBroadcast(updated) };
  },

  async pause(sessionId) {
    await delay();
    const user = requireRole(...CAN_CONTROL);
    const session = ownSessionOrThrow(sessionId, user);
    if (session.live.state !== "question") {
      throw { status: 409, message: "مفيش سؤال شغال" };
    }
    const remaining = computeTimeLeft(session);
    const updated = db.sessions.update(session.id, {
      live: {
        ...session.live,
        state: "paused",
        pausedAt: Date.now(),
        timeLeft: remaining,
      },
    });
    return { data: persistAndBroadcast(updated) };
  },

  async resume(sessionId) {
    await delay();
    const user = requireRole(...CAN_CONTROL);
    const session = ownSessionOrThrow(sessionId, user);
    if (session.live.state !== "paused") {
      throw { status: 409, message: "الحصة مش موقوفة" };
    }

    const q = currentQuestion(session);
    const remaining = session.live.timeLeft ?? q.duration;
    const newStartedAt = Date.now() - (q.duration - remaining) * 1000;

    const updated = db.sessions.update(session.id, {
      live: {
        ...session.live,
        state: "question",
        startedAt: newStartedAt,
        pausedAt: null,
      },
    });
    return { data: persistAndBroadcast(updated) };
  },

  async getPublicById(sessionId) {
    await delay();
    const session = db.sessions.findById(sessionId);
    if (!session) throw { status: 404, message: "الحصة مش موجودة" };

    const isRevealOrAfter = ["reveal", "explanation", "leaderboard", "finished"].includes(session.live?.state);

    const sanitized = {
      ...session,
      questions: (session.questions || []).map((q) => ({
        ...q,
        correctOptionIndex: isRevealOrAfter ? q.correctOptionIndex : null,
      })),
      answers: {},
    };
    return { data: recomputeRanks(sanitized) };
  },

  async showExplanation(sessionId) {
    await delay();
    const user = requireRole(...CAN_CONTROL);
    const session = ownSessionOrThrow(sessionId, user);
    if (session.live.state !== "reveal") {
      throw { status: 409, message: "لازم تعرض الإجابة الأول" };
    }
    const updated = db.sessions.update(session.id, {
      live: { ...session.live, state: "explanation" },
    });
    return { data: persistAndBroadcast(updated) };
  },

  async showLeaderboard(sessionId) {
    await delay();
    const user = requireRole(...CAN_CONTROL);
    const session = ownSessionOrThrow(sessionId, user);
    if (!["reveal", "explanation"].includes(session.live.state)) {
      throw { status: 409, message: "لازم تعرض الإجابة الأول" };
    }
    const updated = db.sessions.update(session.id, {
      live: { ...session.live, state: "leaderboard" },
    });
    return { data: persistAndBroadcast(updated) };
  },

  async next(sessionId) {
    await delay();
    const user = requireRole(...CAN_CONTROL);
    const session = ownSessionOrThrow(sessionId, user);
    if (!["reveal", "explanation", "leaderboard"].includes(session.live.state)) {
      throw { status: 409, message: "مش ممكن نتقدم من الحالة الحالية" };
    }

    const isLast = session.live.currentQuestionIndex >= session.questions.length - 1;
    if (isLast) {
      return this.finishRound(sessionId);
    }

    const nextIdx = session.live.currentQuestionIndex + 1;
    const nextQ = session.questions[nextIdx];

    const updated = db.sessions.update(session.id, {
      live: {
        ...session.live,
        state: "question",
        currentQuestionIndex: nextIdx,
        startedAt: Date.now(),
        pausedAt: null,
        timeLeft: nextQ.duration,
      },
    });
    return { data: persistAndBroadcast(updated) };
  },

  async finishRound(sessionId) {
    await delay();
    const user = requireRole(...CAN_CONTROL);
    const session = ownSessionOrThrow(sessionId, user);
    if (session.live.state === "finished") {
      throw { status: 409, message: "الجولة خلصت بالفعل" };
    }
    const updated = db.sessions.update(session.id, {
      live: { ...session.live, state: "finished", pausedAt: null },
    });
    return { data: persistAndBroadcast(updated) };
  },

  async end(sessionId) {
    await delay();
    const user = requireRole(...CAN_CONTROL);
    const session = ownSessionOrThrow(sessionId, user);

    const students = finalizeAttendance(session);
    const updated = db.sessions.update(session.id, {
      students,
      live: { ...session.live, isLive: false, state: "finished" },
      finishedAt: Date.now(),
    });
    return { data: persistAndBroadcast(updated) };
  },

  async submitAnswer({ sessionId, studentId, questionId, selectedOption }) {
    await delay();
    const session = db.sessions.findById(sessionId);
    if (!session) throw { status: 404, message: "الحصة مش موجودة" };

    const q = validateSubmission(session, questionId);
    const student = findStudentOrThrow(session, studentId);

    const existing = session.answers?.[studentId]?.[questionId];
    if (existing) {
      throw { status: 409, message: "أجبت خلاص على السؤال ده" };
    }

    if (!Number.isInteger(selectedOption) || selectedOption < 0 || selectedOption >= q.options.length) {
      throw { status: 400, message: "خيار غير صحيح" };
    }

    const elapsedMs = Date.now() - session.live.startedAt;
    const result = computeAnswerResult({ question: q, selectedOption, elapsedMs, student });

    const rocketMultiplier = student.rocketActive ? COMMAND_RULES.rocket.multiplier : 1;
    const finalPoints = result.points * rocketMultiplier;

    const answer = {
      id: crypto.randomUUID(),
      playerId: studentId,
      questionId,
      selectedOption,
      isCorrect: result.isCorrect,
      points: finalPoints,
      basePoints: result.points,
      rocketApplied: rocketMultiplier > 1,
      speedBonus: result.speedBonus,
      responseMs: result.responseMs,
      streak: result.streak,
      timedOut: false,
      createdAt: Date.now(),
      resultState: result.isCorrect ? "correct" : "wrong",
    };

    const nextAnswers = {
      ...(session.answers || {}),
      [studentId]: {
        ...((session.answers || {})[studentId] || {}),
        [questionId]: answer,
      },
    };

    const nextStudents = session.students.map((s) => (s.id === studentId ? {
      ...s,
      score: (s.score || 0) + finalPoints,
      rocketActive: false,
      correctAnswers: (s.correctAnswers || 0) + (result.isCorrect ? 1 : 0),
      wrongAnswers: (s.wrongAnswers || 0) + (result.isCorrect ? 0 : 1),
      currentStreak: result.streak,
      highestStreak: result.highestStreak,
      lastSeenAt: Date.now(),
    } : s));

    const updated = db.sessions.update(session.id, {
      answers: nextAnswers,
      students: nextStudents,
    });

    broadcast.emit("session:updated", { sessionId: updated.id });

    return {
      data: {
        answer,
        student: updated.students.find((s) => s.id === studentId),
      },
    };
  },

  async useCommand({ sessionId, studentId, command, targetId = null }) {
    await delay();
    const session = db.sessions.findById(sessionId);
    if (!session) throw { status: 404, message: "الحصة مش موجودة" };

    const rules = COMMAND_RULES[command];
    if (!rules) throw { status: 400, message: "أمر غير معروف" };

    if (session.live?.state !== "question") {
      throw { status: 409, message: "الأوامر بس أثناء السؤال" };
    }

    if (!session.settings?.commandsEnabled?.[command]) {
      throw { status: 403, message: "الأمر مش مفعل في الجلسة دي" };
    }

    const actor = findStudentOrThrow(session, studentId);

    const usedCount = (session.events || []).filter((e) => e.type === `command:${command}` && e.actorId === studentId).length;
    if (usedCount >= rules.maxUses) {
      throw { status: 409, message: "استخدمت الأمر ده بالحد الأقصى في الجلسة" };
    }

    let target = null;
    if (rules.requiresTarget) {
      if (!targetId) {
        throw { status: 400, message: "اختار طالب" };
      }
      if (targetId === studentId && !rules.canSelfTarget) {
        throw { status: 400, message: "مش ممكن تستخدمه على نفسك" };
      }
      target = findStudentOrThrow(session, targetId);
    } else if (targetId) {
      throw { status: 400, message: "الأمر ده مش محتاج هدف" };
    }

    let nextStudents = session.students;
    let eventValue = 0;
    let eventMetadata = {};

    if (command === "gift") {
      eventValue = rules.amount;
      nextStudents = session.students.map((s) => (s.id === target.id ? { ...s, score: (s.score || 0) + rules.amount } : s));
      eventMetadata = { amount: rules.amount, targetName: target.name };
    }

    if (command === "thief") {
      const stolenRaw = Math.round((target.score || 0) * rules.percent);
      const stolen = Math.min(rules.max, Math.max(rules.min, stolenRaw));
      const actual = Math.min(stolen, target.score || 0);

      eventValue = actual;
      nextStudents = session.students.map((s) => {
        if (s.id === target.id) {
          return { ...s, score: Math.max(0, (s.score || 0) - actual) };
        }
        if (s.id === actor.id) {
          return { ...s, score: (s.score || 0) + actual };
        }
        return s;
      });
      eventMetadata = { amount: actual, targetName: target.name, targetScoreBefore: target.score || 0 };
    }

    if (command === "rocket") {
      eventValue = rules.multiplier;
      nextStudents = session.students.map((s) => (s.id === actor.id ? { ...s, rocketActive: true } : s));
      eventMetadata = { multiplier: rules.multiplier };
    }

    const q = currentQuestion(session);
    const event = {
      id: crypto.randomUUID(),
      type: `command:${command}`,
      actorId: actor.id,
      actorName: actor.name,
      targetId: target?.id ?? null,
      targetName: target?.name ?? null,
      value: eventValue,
      questionId: q?.id ?? null,
      metadata: eventMetadata,
      createdAt: Date.now(),
    };

    const updated = db.sessions.update(session.id, {
      students: nextStudents,
      events: [...(session.events || []), event],
    });

    broadcast.emit("session:updated", { sessionId: updated.id });
    broadcast.emit("command:applied", { sessionId: updated.id, event });

    return { data: { event, session: recomputeRanks(updated) } };
  },
};