// src/adapters/session.adapter.js
//
// Canonical session/game shapes shared by the HTTP and mock providers.
// Backend source of truth:
//   - session: id, quiz, joinCode, joinUrl, status, joinOpen, gameState,
//     currentQuestionIndex, totalQuestions, questionProgress, phase times,
//     commandSettings {gift,thief,rocket}, phaseSettings, activeCommand,
//     participantCount, startedAt, endedAt.
//   - public join: joinCode, joinUrl, status, joinOpen, quiz summary,
//     participantCount, startedAt, endedAt.
//   - participant: id, name, nickname, student, section, avatar {preset,color},
//     status, score, streak, bestStreak, answeredCount, correctCount,
//     totalResponseTimeMs, connected, doublePointsActive, streakShieldActive,
//     colorShards, unlockedColors, giftsReceived, lastGiftCards, finalRank,
//     joinedAt, lastSeenAt, kickedAt.
//   - Socket game state adds question/leaderboard/you/yourAnswer/command data.
// Legacy mock documents use code/live/students/questions and are normalized
// here so pages never branch on the provider mode.

export const SESSION_STATUSES = ["LOBBY", "LIVE", "PAUSED", "FINISHED"];

export const GAME_STATES = [
  "IDLE",
  "COUNTDOWN",
  "QUESTION",
  "REVEAL",
  "EXPLANATION",
  "POINTS",
  "LEADERBOARD",
  "PHONE_LEADERBOARD",
  "GIFT",
  "THIEF",
  "ROCKET",
  "FINISHED",
];

export const SESSION_STATUS_LABELS = {
  LOBBY: "لوبي",
  LIVE: "شغّالة",
  PAUSED: "متوقفة",
  FINISHED: "خلصت",
};

export const GAME_STATE_LABELS = {
  IDLE: "جاهزة",
  COUNTDOWN: "عد تنازلي",
  QUESTION: "سؤال شغّال",
  REVEAL: "مراجعة الإجابة",
  EXPLANATION: "شرح",
  POINTS: "النقاط",
  LEADERBOARD: "المتصدرين",
  PHONE_LEADERBOARD: "متصدرين الموبايل",
  GIFT: "هدية",
  THIEF: "سرقة",
  ROCKET: "صاروخ",
  FINISHED: "خلصت",
};

export const COMMAND_TYPES = ["gift", "thief", "rocket"];

export const COMMAND_LABELS = {
  gift: "هدية",
  thief: "سرقة",
  rocket: "صاروخ",
};

export const PHASE_SETTING_KEYS = [
  "revealMs",
  "explanationMs",
  "pointsMs",
  "leaderboardMs",
  "phoneLeaderboardMs",
];

export const PHASE_VISIBILITY_KEYS = [
  "showReveal",
  "showExplanation",
  "showPoints",
  "showLeaderboard",
  "showPhoneLeaderboard",
];

export const PHASE_SETTING_LABELS = {
  revealMs: "مدة مراجعة الإجابة",
  explanationMs: "مدة الشرح",
  pointsMs: "مدة عرض النقاط",
  leaderboardMs: "مدة المتصدرين",
  phoneLeaderboardMs: "مدة متصدرين الموبايل",
  showReveal: "إظهار مراجعة الإجابة",
  showExplanation: "إظهار الشرح",
  showPoints: "إظهار النقاط",
  showLeaderboard: "إظهار المتصدرين",
  showPhoneLeaderboard: "إظهار متصدرين الموبايل",
};

export const PHASE_DURATION_MAX_MS = 600000;
export const NICKNAME_MAX_LENGTH = 50;
export const STUDENT_NAME_MAX_LENGTH = 80;

export const GAME_ERROR_MESSAGES = {
  UNAUTHORIZED: "الجلسة المباشرة محتاجة تسجيل دخول من جديد.",
  FORBIDDEN: "مش مسموح لك بالإجراء ده.",
  SESSION_NOT_FOUND: "الجلسة مش موجودة.",
  PARTICIPANT_NOT_FOUND: "الطالب مش موجود في الجلسة.",
  PARTICIPANT_KICKED: "تم استبعادك من الجلسة.",
  INVALID_PARTICIPANT_TOKEN: "جلسة الطالب انتهت، انضم تاني بالكود.",
  GAME_NOT_ACTIVE: "اللعبة مش شغالة دلوقتي.",
  GAME_ALREADY_STARTED: "اللعبة بدأت بالفعل.",
  INVALID_GAME_STATE: "المرحلة الحالية مش بتسمح بالإجراء ده.",
  NO_ACTIVE_QUESTION: "مفيش سؤال شغّال دلوقتي.",
  QUESTION_MISMATCH: "السؤال اتغيّر، حدّث الصفحة.",
  INVALID_OPTION: "الاختيار مش تابع للسؤال الحالي.",
  DEADLINE_PASSED: "الوقت خلص قبل إرسال الإجابة.",
  ALREADY_ANSWERED: "جاوبت على السؤال ده بالفعل.",
  INVALID_PAYLOAD: "البيانات المرسلة غير صحيحة.",
  COMMAND_DISABLED: "الأمر ده متوقف في الجلسة.",
  COMMAND_NOT_ACTIVE: "مفيش أمر شغّال دلوقتي.",
  COMMAND_NOT_FOUND: "الأمر مش موجود.",
  COMMAND_ALREADY_RESOLVED: "الأمر اتنفّذ بالفعل.",
  NOT_COMMAND_OWNER: "الأمر ده مش بتاعك.",
  INVALID_TARGET: "الهدف المختار غير صحيح.",
  TARGET_INELIGIBLE: "الهدف ده مش متاح دلوقتي.",
  NO_ELIGIBLE_TARGET: "مفيش هدف متاح للأمر ده.",
  PHASE_NOT_CONTROLLABLE: "المرحلة الحالية مش بتتقدر تتقدّم.",
};

export function gameErrorMessage(error) {
  if (!error) return "";
  return GAME_ERROR_MESSAGES[error.code] || error.message || "حصل خطأ غير متوقع.";
}

export const DEFAULT_AVATAR = { preset: "FOX", color: "#3B82F6" };

const DEFAULT_PHASE_SETTINGS = {
  revealMs: 5000,
  explanationMs: 5000,
  pointsMs: 3000,
  leaderboardMs: 5000,
  phoneLeaderboardMs: 3000,
  showReveal: true,
  showExplanation: true,
  showPoints: true,
  showLeaderboard: true,
  showPhoneLeaderboard: true,
};

function toId(value) {
  if (!value) return null;
  if (typeof value === "object") return value.id ?? value._id ?? null;
  return value;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function validationError(message) {
  const error = new Error(message);
  error.name = "ValidationError";
  error.status = 400;
  return error;
}

function normalizeAvatar(raw) {
  return {
    preset: raw?.preset || DEFAULT_AVATAR.preset,
    color: raw?.color || DEFAULT_AVATAR.color,
  };
}

export function normalizeParticipant(raw) {
  if (!raw || typeof raw !== "object") return null;

  const legacy = raw.currentStreak !== undefined || raw.correctAnswers !== undefined;

  return {
    id: raw.id ?? raw._id ?? null,
    name: String(raw.name ?? "").trim(),
    nickname: String(raw.nickname ?? raw.name ?? "").trim(),
    studentId: raw.studentId ?? toId(raw.student) ?? null,
    sectionId: raw.sectionId ?? toId(raw.section) ?? null,
    avatar: normalizeAvatar(
      raw.avatar && raw.avatar.hairColor
        ? { preset: raw.avatar.preset, color: raw.avatar.hairColor }
        : raw.avatar
    ),
    status: raw.status || (raw.attended === false ? "KICKED" : "ACTIVE"),
    score: toNumber(raw.score),
    streak: toNumber(raw.streak ?? raw.currentStreak),
    bestStreak: toNumber(raw.bestStreak ?? raw.highestStreak),
    answeredCount: toNumber(raw.answeredCount),
    correctCount: toNumber(raw.correctCount ?? raw.correctAnswers),
    totalResponseTimeMs: toNumber(raw.totalResponseTimeMs),
    connected: Boolean(raw.connected ?? raw.leftAt == null),
    doublePointsActive: Boolean(raw.doublePointsActive),
    streakShieldActive: Boolean(raw.streakShieldActive),
    colorShards: toNumber(raw.colorShards),
    unlockedColors: Array.isArray(raw.unlockedColors) ? raw.unlockedColors : [],
    giftsReceived: toNumber(raw.giftsReceived),
    lastGiftCards: Array.isArray(raw.lastGiftCards) ? raw.lastGiftCards : [],
    finalRank: raw.finalRank ?? raw.rank ?? null,
    joinedAt: raw.joinedAt ?? null,
    lastSeenAt: raw.lastSeenAt ?? null,
    kickedAt: raw.kickedAt ?? null,
    commandEligible: raw.commandEligible,
    legacy,
  };
}

export function normalizeParticipantList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeParticipant).filter(Boolean);
}

export function normalizeLeaderboardEntry(raw, index = 0) {
  if (!raw || typeof raw !== "object") return null;

  return {
    rank: toNumber(raw.rank, index + 1),
    position: toNumber(raw.position, index + 1),
    participantId: raw.participantId ?? raw.id ?? null,
    nickname: String(raw.nickname ?? raw.name ?? "").trim(),
    name: String(raw.name ?? raw.nickname ?? "").trim(),
    avatar: normalizeAvatar(raw.avatar),
    score: toNumber(raw.score),
    streak: toNumber(raw.streak),
    bestStreak: toNumber(raw.bestStreak),
    answeredCount: toNumber(raw.answeredCount),
    correctCount: toNumber(raw.correctCount),
    totalResponseTimeMs: toNumber(raw.totalResponseTimeMs),
  };
}

export function normalizeLeaderboard(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeLeaderboardEntry).filter(Boolean);
}

export function normalizeGameOption(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    id: raw.id ?? raw._id ?? null,
    text: String(raw.text ?? "").trim(),
    isCorrect:
      raw.isCorrect === undefined ? undefined : Boolean(raw.isCorrect),
  };
}

export function normalizeGameQuestion(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    id: raw.id ?? raw._id ?? null,
    text: String(raw.text ?? "").trim(),
    points: toNumber(raw.points, 1000),
    timeLimitSec: toNumber(raw.timeLimitSec, 10),
    order: toNumber(raw.order),
    options: Array.isArray(raw.options)
      ? raw.options.map(normalizeGameOption).filter(Boolean)
      : [],
  };
}

export function normalizeCommand(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    id: raw.id ?? null,
    commandId: raw.commandId ?? null,
    type: raw.type ?? null,
    status: raw.status ?? null,
    actorId: raw.actorId ?? null,
    targetId: raw.targetId ?? null,
    questionId: raw.questionId ?? null,
    questionIndex: raw.questionIndex ?? null,
    selectionEndsAt: raw.selectionEndsAt ?? null,
    remainingSelectionMs: raw.remainingSelectionMs ?? null,
    startedAt: raw.startedAt ?? null,
    completedAt: raw.completedAt ?? null,
    result: raw.result || {},
    error: raw.error || null,
    createdAt: raw.createdAt ?? null,
  };
}

export function normalizeCommandTarget(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    participantId: raw.participantId ?? raw.id ?? null,
    nickname: String(raw.nickname ?? raw.name ?? "").trim(),
    name: String(raw.name ?? raw.nickname ?? "").trim(),
    avatar: normalizeAvatar(raw.avatar),
    score: toNumber(raw.score),
    streak: toNumber(raw.streak),
    connected: Boolean(raw.connected),
  };
}

export function normalizeYourAnswer(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    selectedOptionId: raw.selectedOptionId ?? null,
    responseTimeMs: toNullableNumber(raw.responseTimeMs),
    submittedAt: raw.submittedAt ?? null,
    isCorrect: raw.isCorrect === undefined ? undefined : Boolean(raw.isCorrect),
    pointsAwarded: toNullableNumber(raw.pointsAwarded),
    basePointsAwarded: toNullableNumber(raw.basePointsAwarded),
    doublePointsApplied: Boolean(raw.doublePointsApplied),
    streakShieldApplied: Boolean(raw.streakShieldApplied),
    streakAfter: toNullableNumber(raw.streakAfter),
  };
}

export function normalizeCommandSettings(raw) {
  return {
    gift: Boolean(raw?.gift),
    thief: Boolean(raw?.thief),
    rocket: Boolean(raw?.rocket),
  };
}

export function normalizePhaseSettings(raw) {
  return {
    revealMs: toNumber(raw?.revealMs, DEFAULT_PHASE_SETTINGS.revealMs),
    explanationMs: toNumber(
      raw?.explanationMs,
      DEFAULT_PHASE_SETTINGS.explanationMs
    ),
    pointsMs: toNumber(raw?.pointsMs, DEFAULT_PHASE_SETTINGS.pointsMs),
    leaderboardMs: toNumber(
      raw?.leaderboardMs,
      DEFAULT_PHASE_SETTINGS.leaderboardMs
    ),
    phoneLeaderboardMs: toNumber(
      raw?.phoneLeaderboardMs,
      DEFAULT_PHASE_SETTINGS.phoneLeaderboardMs
    ),
    showReveal: raw?.showReveal !== false,
    showExplanation: raw?.showExplanation !== false,
    showPoints: raw?.showPoints !== false,
    showLeaderboard: raw?.showLeaderboard !== false,
    showPhoneLeaderboard: raw?.showPhoneLeaderboard !== false,
  };
}

function normalizeQuizSummary(raw, session) {
  if (raw && typeof raw === "object" && (raw.title || raw.id)) {
    return {
      id: raw.id ?? null,
      title: String(raw.title ?? "").trim(),
      description: String(raw.description ?? "").trim(),
      questionCount: toNumber(raw.questionCount),
      estimatedDurationSec: toNumber(raw.estimatedDurationSec),
    };
  }

  return {
    id: session?.quizId ?? null,
    title: String(session?.title ?? "").trim(),
    description: "",
    questionCount: toNumber(
      session?.questionCount ?? session?.questions?.length
    ),
    estimatedDurationSec: toNumber(session?.estimatedDurationSec),
  };
}

export function normalizeSession(raw) {
  if (!raw || typeof raw !== "object") return null;

  const legacy = raw.joinCode === undefined && raw.code !== undefined;
  const participants = normalizeParticipantList(
    raw.participants ?? raw.students
  );
  const currentQuestionIndex = toNumber(
    raw.currentQuestionIndex ?? raw.live?.currentQuestionIndex,
    legacy ? 0 : -1
  );
  const totalQuestions = toNumber(
    raw.totalQuestions ?? raw.questions?.length,
    0
  );
  const gameState = raw.gameState
    ? String(raw.gameState)
    : mapLegacyLiveState(raw.live?.state, raw.live?.isLive);
  const status =
    raw.status ||
    (raw.finishedAt
      ? "FINISHED"
      : raw.live?.isLive
        ? raw.live?.state === "paused"
          ? "PAUSED"
          : "LIVE"
        : "LOBBY");

  return {
    id: raw.id ?? raw._id ?? null,
    quiz: normalizeQuizSummary(raw.quiz, raw),
    organizationId: raw.organization ?? raw.organizationId ?? null,
    createdBy: raw.createdBy ?? null,
    joinCode: String(raw.joinCode ?? raw.code ?? "").toUpperCase(),
    joinUrl: raw.joinUrl ?? null,
    status,
    joinOpen: Boolean(
      raw.joinOpen ?? raw.settings?.allowJoining ?? false
    ),
    gameState,
    currentQuestionIndex,
    totalQuestions,
    questionProgress: {
      current:
        raw.questionProgress?.current ??
        (currentQuestionIndex >= 0 ? currentQuestionIndex + 1 : 0),
      total: raw.questionProgress?.total ?? totalQuestions,
      answeredCount: raw.questionProgress?.answeredCount ?? null,
      totalPlayers: raw.questionProgress?.totalPlayers ?? null,
    },
    phaseStartedAt: raw.phaseStartedAt ?? null,
    phaseEndsAt: raw.phaseEndsAt ?? null,
    remainingTimeMs: raw.remainingTimeMs ?? null,
    commandSettings: normalizeCommandSettings(
      raw.commandSettings ?? raw.settings?.commandsEnabled
    ),
    phaseSettings: normalizePhaseSettings(raw.phaseSettings),
    activeCommand: normalizeCommand(raw.activeCommand),
    participantCount: raw.participantCount ?? participants.length,
    participants,
    startedAt: raw.startedAt ?? raw.live?.startedAt ?? null,
    endedAt: raw.endedAt ?? raw.finishedAt ?? null,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

function mapLegacyLiveState(state, isLive) {
  if (!isLive) return state === "finished" ? "FINISHED" : "IDLE";

  switch (state) {
    case "countdown":
      return "COUNTDOWN";
    case "question":
      return "QUESTION";
    case "reveal":
      return "REVEAL";
    case "explanation":
      return "EXPLANATION";
    case "leaderboard":
      return "LEADERBOARD";
    case "finished":
      return "FINISHED";
    case "paused":
      return "QUESTION";
    default:
      return "IDLE";
  }
}

export function normalizeSessionList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeSession).filter(Boolean);
}

export function normalizePublicSession(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    joinCode: String(raw.joinCode ?? raw.code ?? "").toUpperCase(),
    joinUrl: raw.joinUrl ?? null,
    status: raw.status || "LOBBY",
    joinOpen: Boolean(raw.joinOpen ?? raw.settings?.allowJoining ?? false),
    quiz: {
      title: String(raw.quiz?.title ?? raw.title ?? "").trim(),
      questionCount: toNumber(
        raw.quiz?.questionCount ?? raw.questions?.length
      ),
      estimatedDurationSec: toNumber(raw.quiz?.estimatedDurationSec),
    },
    participantCount: toNumber(
      raw.participantCount ?? raw.students?.length
    ),
    startedAt: raw.startedAt ?? raw.live?.startedAt ?? null,
    endedAt: raw.endedAt ?? raw.finishedAt ?? null,
  };
}

export function normalizePublicParticipant(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    id: raw.id ?? raw._id ?? null,
    name: String(raw.name ?? "").trim(),
    nickname: String(raw.nickname ?? raw.name ?? "").trim(),
    sectionId: raw.sectionId ?? toId(raw.section) ?? null,
    avatar: normalizeAvatar(
      raw.avatar && raw.avatar.hairColor
        ? { preset: raw.avatar.preset, color: raw.avatar.hairColor }
        : raw.avatar
    ),
    joinedAt: raw.joinedAt ?? null,
    lastSeenAt: raw.lastSeenAt ?? null,
    participantToken: raw.participantToken ?? null,
  };
}

export function normalizeGameState(raw) {
  if (!raw || typeof raw !== "object") return null;

  const participants = normalizeParticipantList(raw.participants);

  return {
    sessionId: raw.sessionId ?? null,
    status: raw.status ?? null,
    gameState: raw.gameState ?? "IDLE",
    currentQuestionIndex: toNumber(raw.currentQuestionIndex, -1),
    totalQuestions: toNumber(raw.totalQuestions),
    questionProgress: {
      current: toNumber(raw.questionProgress?.current),
      total: toNumber(raw.questionProgress?.total),
      answeredCount: toNullableNumber(raw.questionProgress?.answeredCount),
      totalPlayers: toNullableNumber(raw.questionProgress?.totalPlayers),
    },
    phaseStartedAt: raw.phaseStartedAt ?? null,
    phaseEndsAt: raw.phaseEndsAt ?? null,
    phaseRemainingMs: toNullableNumber(raw.phaseRemainingMs),
    remainingTimeMs: toNullableNumber(raw.remainingTimeMs),
    serverTime: raw.serverTime ?? null,
    question: normalizeGameQuestion(raw.question),
    leaderboard: normalizeLeaderboard(raw.leaderboard),
    commandSettings: normalizeCommandSettings(raw.commandSettings),
    phaseSettings: normalizePhaseSettings(raw.phaseSettings),
    answerCounts: Array.isArray(raw.answerCounts)
      ? raw.answerCounts.map((item) => ({
          optionId: item.optionId,
          count: toNumber(item.count),
        }))
      : [],
    answerCount: toNullableNumber(raw.answerCount),
    commandQueue: Array.isArray(raw.commandQueue)
      ? raw.commandQueue.map(normalizeCommand).filter(Boolean)
      : [],
    participants,
    you: raw.you
      ? {
          participantId: raw.you.participantId ?? null,
          nickname: String(raw.you.nickname ?? "").trim(),
          score: toNumber(raw.you.score),
          streak: toNumber(raw.you.streak),
          bestStreak: toNumber(raw.you.bestStreak),
          rank: toNullableNumber(raw.you.rank),
          doublePointsActive: Boolean(raw.you.doublePointsActive),
          streakShieldActive: Boolean(raw.you.streakShieldActive),
          colorShards: toNumber(raw.you.colorShards),
          unlockedColors: Array.isArray(raw.you.unlockedColors)
            ? raw.you.unlockedColors
            : [],
          giftsReceived: toNumber(raw.you.giftsReceived),
          lastGiftCards: Array.isArray(raw.you.lastGiftCards)
            ? raw.you.lastGiftCards
            : [],
        }
      : null,
    yourAnswer: normalizeYourAnswer(raw.yourAnswer),
    activeCommand: normalizeCommand(raw.activeCommand),
    yourCommand: normalizeCommand(raw.yourCommand),
    commandTargets: Array.isArray(raw.commandTargets)
      ? raw.commandTargets.map(normalizeCommandTarget).filter(Boolean)
      : [],
  };
}

export function applyGameStateToSession(session, state) {
  if (!session || !state) return session;

  const finished = state.status === "FINISHED" || state.gameState === "FINISHED";
  const participants =
    Array.isArray(state.participants) && state.participants.length > 0
      ? state.participants
      : session.participants;

  return {
    ...session,
    status: state.status || session.status,
    gameState: state.gameState || session.gameState,
    currentQuestionIndex:
      state.currentQuestionIndex ?? session.currentQuestionIndex,
    totalQuestions: state.totalQuestions || session.totalQuestions,
    questionProgress: state.questionProgress || session.questionProgress,
    phaseStartedAt: state.phaseStartedAt ?? null,
    phaseEndsAt: state.phaseEndsAt ?? null,
    remainingTimeMs: state.remainingTimeMs ?? null,
    commandSettings: state.commandSettings || session.commandSettings,
    phaseSettings: state.phaseSettings || session.phaseSettings,
    activeCommand: state.activeCommand ?? null,
    participants,
    participantCount: Array.isArray(state.participants)
      ? state.participants.length
      : session.participantCount,
    endedAt: finished ? session.endedAt || new Date().toISOString() : session.endedAt,
  };
}

export function buildSessionCreatePayload({ quizId, quiz } = {}) {
  const id = quizId ?? quiz;

  if (!id) {
    throw validationError("اختار الكويز.");
  }

  return { quiz: id };
}

export function buildJoinPayload({
  name,
  nickname,
  studentId,
  section,
  sectionId,
  avatar,
} = {}) {
  const cleanNickname = String(nickname ?? "").trim();
  const cleanName = String(name ?? "").trim();

  if (!cleanNickname) {
    throw validationError("اكتب اسم الشهرة.");
  }

  if (cleanNickname.length > NICKNAME_MAX_LENGTH) {
    throw validationError(
      `اسم الشهرة لازم يكون ${NICKNAME_MAX_LENGTH} حرف أو أقل.`
    );
  }

  if (cleanName && cleanName.length > STUDENT_NAME_MAX_LENGTH) {
    throw validationError(
      `الاسم لازم يكون ${STUDENT_NAME_MAX_LENGTH} حرف أو أقل.`
    );
  }

  const payload = {
    nickname: cleanNickname,
  };

  if (cleanName) {
    payload.name = cleanName;
  }

  if (studentId) {
    payload.studentId = studentId;
  }

  const sectionValue = section ?? sectionId;

  if (sectionValue) {
    payload.section = sectionValue;
  }

  if (avatar && (avatar.preset || avatar.color)) {
    payload.avatar = {};

    if (avatar.preset) {
      payload.avatar.preset = avatar.preset;
    }

    if (avatar.color) {
      payload.avatar.color = avatar.color;
    }
  }

  return payload;
}

export function buildCommandSettingsPatch(settings = {}) {
  const patch = {};

  for (const key of COMMAND_TYPES) {
    if (settings[key] !== undefined) {
      patch[key] = Boolean(settings[key]);
    }
  }

  if (Object.keys(patch).length === 0) {
    throw validationError("اختار إعداد أمر واحد على الأقل.");
  }

  return patch;
}

export function buildPhaseSettingsPatch(settings = {}) {
  const patch = {};

  for (const key of PHASE_SETTING_KEYS) {
    if (settings[key] === undefined) continue;

    const value = Math.round(Number(settings[key]));

    if (!Number.isFinite(value) || value < 0 || value > PHASE_DURATION_MAX_MS) {
      throw validationError(
        `${PHASE_SETTING_LABELS[key]} لازم تكون من 0 إلى ${PHASE_DURATION_MAX_MS} مللي ثانية.`
      );
    }

    patch[key] = value;
  }

  for (const key of PHASE_VISIBILITY_KEYS) {
    if (settings[key] !== undefined) {
      patch[key] = Boolean(settings[key]);
    }
  }

  if (Object.keys(patch).length === 0) {
    throw validationError("عدّل إعداد مرحلة واحد على الأقل.");
  }

  return patch;
}

export function phaseSettingsToDraft(settings) {
  const normalized = normalizePhaseSettings(settings);

  return {
    ...normalized,
    revealMs: normalized.revealMs,
    explanationMs: normalized.explanationMs,
    pointsMs: normalized.pointsMs,
    leaderboardMs: normalized.leaderboardMs,
    phoneLeaderboardMs: normalized.phoneLeaderboardMs,
  };
}

export function isSessionJoinable(session) {
  if (!session) return false;
  if (!session.joinOpen) return false;
  if (session.status === "FINISHED" || session.status === "PAUSED") {
    return false;
  }
  return session.status === "LOBBY" || session.status === "LIVE";
}

export function sessionStatusLabel(session) {
  if (!session) return "";
  if (session.status === "LOBBY") return SESSION_STATUS_LABELS.LOBBY;
  if (session.status === "PAUSED") return SESSION_STATUS_LABELS.PAUSED;
  return GAME_STATE_LABELS[session.gameState] || SESSION_STATUS_LABELS[session.status] || session.status;
}

export function remainingMsFrom(phaseEndsAt, now = Date.now(), serverOffset = 0) {
  if (!phaseEndsAt) return null;
  const end = new Date(phaseEndsAt).getTime();
  if (!Number.isFinite(end)) return null;
  return Math.max(0, end - (now + serverOffset));
}
