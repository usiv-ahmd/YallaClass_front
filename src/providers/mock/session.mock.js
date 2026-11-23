// src/providers/mock/session.mock.js
//
// In-browser session/game engine that mirrors the backend contract used by the
// HTTP + Socket.IO mode. The document keeps legacy fields (`students`,
// `questions`, `answers`, `live`, `settings`) in sync so the mock report and
// roster history providers keep working while pages consume canonical shapes.
import { db } from "./db";
import { broadcast } from "./broadcast";
import { delay, requireOrg, requireRole } from "./latency";
import {
  normalizeParticipant,
  normalizePhaseSettings,
  normalizePublicParticipant,
  normalizePublicSession,
  normalizeSession,
} from "../../adapters/session.adapter.js";

const WRITE_ROLES = ["OWNER", "TEACHER"];
const READ_ROLES = ["OWNER", "TEACHER", "ASSISTANT"];
const ACTIVE = "ACTIVE";
const KICKED = "KICKED";
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const COUNTDOWN_MS = 3000;
const COMMAND_SELECTION_TIMEOUT_MS = 12000;
const GIFT_DRAW_COUNT = 3;
const GIFT_UNLOCK_STREAK = 2;
const THIEF_UNLOCK_STREAK = 1;
const ROCKET_UNLOCK_MULTIPLE = 5;
const THIEF_ACTIVATION_CHANCE = 0.35;
const COLOR_SHARDS_PER_UNLOCK = 3;
const POINTS_BONUS_POINTS = 100;
const LEADERBOARD_STRIKE_POINTS = 100;
const COMMAND_PRIORITIES = { GIFT: 1, THIEF: 2, ROCKET: 3 };
const AVATAR_COLORS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
];
const GIFT_CARDS = [
  { id: "DOUBLE_POINTS", weight: 35 },
  { id: "STREAK_SHIELD", weight: 25 },
  { id: "LEADERBOARD_STRIKE", weight: 10 },
  { id: "POINTS_BONUS", weight: 35 },
  { id: "COLOR_SHARDS", weight: 20 },
];
const REVEAL_STATES = [
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

const timers = new Map();
const commandTimers = new Map();

function now() {
  return Date.now();
}

function iso(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function genCode() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    let code = "";
    for (let i = 0; i < 6; i += 1) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    if (!db.sessions.findByCode(code)) return code;
  }
  throw { status: 500, message: "مقدرناش نولّد كود فريد" };
}

function buildJoinUrl(joinCode) {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost:5173";
  return `${origin}/join/${joinCode}`;
}

function ownSessionOrThrow(sessionId, user) {
  const session = db.sessions.findById(sessionId);
  if (!session) throw { status: 404, message: "الحصة مش موجودة" };
  if (session.organizationId !== user.organizationId) {
    throw { status: 404, message: "الحصة مش موجودة" };
  }
  return session;
}

function findSessionByCode(code) {
  const clean = String(code || "").trim().toUpperCase();
  if (!clean) throw { status: 400, message: "اكتب كود الحصة" };
  const session = db.sessions.findByCode(clean);
  if (!session) throw { status: 404, message: "الكود غلط أو الحصة مش موجودة" };
  return session;
}

function activeParticipants(session) {
  return (session.participants || []).filter((item) => item.status === ACTIVE);
}

function findParticipant(session, participantId) {
  return (session.participants || []).find((item) => item.id === participantId);
}

function findParticipantOrThrow(session, participantId) {
  const participant = findParticipant(session, participantId);
  if (!participant) throw { status: 404, message: "الطالب مش موجود في الحصة" };
  return participant;
}

function clearTimer(sessionId) {
  const key = String(sessionId);
  const timer = timers.get(key);
  if (timer) {
    clearTimeout(timer);
    timers.delete(key);
  }
}

function schedule(sessionId, delayMs, handler) {
  clearTimer(sessionId);
  const key = String(sessionId);
  const timer = setTimeout(() => {
    timers.delete(key);
    Promise.resolve()
      .then(handler)
      .catch((error) => {
        console.error("[mock game] phase transition failed:", error);
      });
  }, Math.max(0, delayMs));
  timers.set(key, timer);
}

function clearCommandTimer(commandId) {
  const timer = commandTimers.get(String(commandId));
  if (timer) {
    clearTimeout(timer);
    commandTimers.delete(String(commandId));
  }
}

function scheduleCommandTimeout(sessionId, commandId, selectionEndsAt) {
  clearCommandTimer(commandId);
  const wait = Math.max(0, new Date(selectionEndsAt).getTime() - now());
  const timer = setTimeout(() => {
    commandTimers.delete(String(commandId));
    handleCommandTimeout(sessionId, commandId);
  }, wait);
  commandTimers.set(String(commandId), timer);
}

function phaseMs(session, key, fallback) {
  const value = session.phaseSettings?.[key];
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function phaseDelay(session) {
  if (!session.phaseEndsAt) return 0;
  return Math.max(0, new Date(session.phaseEndsAt).getTime() - now());
}

function mapLegacyState(gameState, status) {
  if (status === "FINISHED" || gameState === "FINISHED") return "finished";
  if (status === "PAUSED") return "paused";
  if (gameState === "IDLE") return "lobby";
  if (gameState === "COUNTDOWN") return "countdown";
  if (gameState === "QUESTION") return "question";
  if (gameState === "REVEAL") return "reveal";
  if (gameState === "EXPLANATION") return "explanation";
  return "leaderboard";
}

function toLegacyStudent(participant, session) {
  return {
    id: participant.id,
    studentId: participant.studentId || null,
    sectionId: participant.sectionId || null,
    name: participant.name,
    nickname: participant.nickname,
    avatar: {
      preset: participant.avatar?.preset || "FOX",
      color: participant.avatar?.color || "#3B82F6",
      hairColor: participant.avatar?.color || "#3B82F6",
    },
    score: participant.score || 0,
    rank: participant.finalRank || participant.rank || 0,
    correctAnswers: participant.correctCount || 0,
    wrongAnswers: Math.max(
      0,
      (participant.answeredCount || 0) - (participant.correctCount || 0)
    ),
    currentStreak: participant.streak || 0,
    highestStreak: participant.bestStreak || 0,
    questionsSeen: participant.answeredQuestions || [],
    attended: participant.status === ACTIVE,
    attendanceStatus:
      participant.status === KICKED ? "KICKED" : "PRESENT",
    joinedAt: participant.joinedAt,
    lastSeenAt: participant.lastSeenAt,
    leftAt: participant.connected ? null : participant.lastSeenAt,
    isFinished: session.status === "FINISHED",
  };
}

function toLegacyQuestion(gameQuestion) {
  const options = (gameQuestion.options || []).map((option) => option.text);
  const correctIndex = (gameQuestion.options || []).findIndex(
    (option) => option.isCorrect
  );

  return {
    id: gameQuestion.question,
    text: gameQuestion.text,
    options,
    correctOptionIndex: correctIndex,
    weight: gameQuestion.points,
    duration: gameQuestion.timeLimitSec,
    order: gameQuestion.order,
    type: options.length === 2 ? "true_false" : "mcq",
  };
}

function syncLegacy(session) {
  const quiz = session.quizId ? db.quizzes.findById(session.quizId) : null;

  session.students = (session.participants || []).map((participant) =>
    toLegacyStudent(participant, session)
  );
  session.questions = (session.gameQuestions || []).map(toLegacyQuestion);
  session.live = {
    isLive: session.status === "LIVE" || session.status === "PAUSED",
    state: mapLegacyState(session.gameState, session.status),
    currentQuestionIndex: Math.max(0, session.currentQuestionIndex ?? 0),
    startedAt: session.startedAt ? new Date(session.startedAt).getTime() : null,
    pausedAt:
      session.status === "PAUSED" && session.pausedAt
        ? new Date(session.pausedAt).getTime()
        : null,
    timeLeft:
      session.remainingTimeMs != null
        ? Math.round(session.remainingTimeMs / 1000)
        : session.phaseEndsAt
          ? Math.max(
              0,
              Math.round(
                (new Date(session.phaseEndsAt).getTime() - now()) / 1000
              )
            )
          : 0,
    autoAdvance: true,
  };
  session.settings = {
    commandsEnabled: session.commandSettings,
    attendanceThreshold: 0.5,
    allowJoining: session.joinOpen,
  };
  session.code = session.joinCode;
  session.title = quiz?.title || session.title || "";
  session.subject = quiz?.subject || "";
  session.finishedAt = session.endedAt || null;
}

function save(session, { silent = false } = {}) {
  session.updatedAt = now();
  syncLegacy(session);

  const updated = db.sessions.update(session.id, session);

  if (!silent) {
    broadcast.emit("session:updated", { sessionId: updated.id });
  }

  return updated;
}

function quizSummary(session) {
  const quiz = session.quizId ? db.quizzes.findById(session.quizId) : null;
  const questions = quiz?.questions || [];

  return {
    id: quiz?.id || session.quizId || null,
    title: quiz?.title || "",
    description: quiz?.description || "",
    questionCount: questions.length,
    estimatedDurationSec: questions.reduce(
      (total, question) => total + (Number(question.duration) || 0),
      0
    ),
  };
}

function toSession(session) {
  return normalizeSession({
    ...session,
    quiz: quizSummary(session),
    totalQuestions: (session.gameQuestions || []).length,
    participants: activeParticipants(session),
    participantCount: activeParticipants(session).length,
    joinUrl: buildJoinUrl(session.joinCode),
  });
}

function toPublicSession(session) {
  return normalizePublicSession({
    ...session,
    quiz: quizSummary(session),
    participantCount: activeParticipants(session).length,
    joinUrl: buildJoinUrl(session.joinCode),
  });
}

function publicParticipant(participant) {
  return normalizePublicParticipant({
    ...participant,
    participantToken: participant.participantToken,
  });
}

function buildLeaderboard(session) {
  const players = activeParticipants(session)
    .slice()
    .sort(
      (a, b) =>
        (b.score || 0) - (a.score || 0) ||
        (a.totalResponseTimeMs || 0) - (b.totalResponseTimeMs || 0) ||
        new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime() ||
        String(a.id).localeCompare(String(b.id))
    );

  let lastScore = null;
  let lastRank = 0;

  return players.map((player, index) => {
    const score = player.score || 0;
    const rank =
      lastScore !== null && score === lastScore ? lastRank : index + 1;

    lastScore = score;
    lastRank = rank;

    return {
      rank,
      position: index + 1,
      participantId: player.id,
      nickname: player.nickname,
      name: player.name,
      avatar: player.avatar,
      score,
      streak: player.streak || 0,
      bestStreak: player.bestStreak || 0,
      answeredCount: player.answeredCount || 0,
      correctCount: player.correctCount || 0,
      totalResponseTimeMs: player.totalResponseTimeMs || 0,
    };
  });
}

function answerCounts(session, questionId) {
  const counts = new Map();

  for (const participant of activeParticipants(session)) {
    const answer = session.answers?.[participant.id]?.[questionId];
    if (!answer || answer.selectedOptionId == null) continue;
    counts.set(
      answer.selectedOptionId,
      (counts.get(answer.selectedOptionId) || 0) + 1
    );
  }

  return [...counts.entries()].map(([optionId, count]) => ({
    optionId,
    count,
  }));
}

function answeredCountFor(session, questionId) {
  return activeParticipants(session).reduce((total, participant) => {
    const answer = session.answers?.[participant.id]?.[questionId];
    return total + (answer && answer.selectedOptionId != null ? 1 : 0);
  }, 0);
}

function serializeGameQuestion(gameQuestion, includeCorrect) {
  if (!gameQuestion) return null;

  return {
    id: gameQuestion.question,
    text: gameQuestion.text,
    points: gameQuestion.points,
    timeLimitSec: gameQuestion.timeLimitSec,
    order: gameQuestion.order,
    options: (gameQuestion.options || []).map((option) => ({
      id: option.optionId,
      text: option.text,
      ...(includeCorrect ? { isCorrect: Boolean(option.isCorrect) } : {}),
    })),
  };
}

function buildCommandQueue(session) {
  return (session.commands || [])
    .filter((command) => command.status === "QUEUED")
    .sort(
      (a, b) =>
        (COMMAND_PRIORITIES[a.type] || 99) -
          (COMMAND_PRIORITIES[b.type] || 99) ||
        a.createdAt - b.createdAt
    );
}

function getActiveCommand(session) {
  if (!session.activeCommand) return null;
  return (
    (session.commands || []).find(
      (command) => command.id === session.activeCommand
    ) || null
  );
}

function eligibleTargets(session, actorId, { requirePositiveScore = false } = {}) {
  return activeParticipants(session).filter((participant) => {
    if (participant.id === actorId) return false;
    if (!participant.connected) return false;
    if (requirePositiveScore && (participant.score || 0) <= 0) return false;
    return true;
  });
}

function serializeTarget(participant) {
  return {
    participantId: participant.id,
    nickname: participant.nickname,
    name: participant.name,
    avatar: participant.avatar,
    score: participant.score || 0,
    streak: participant.streak || 0,
    connected: Boolean(participant.connected),
  };
}

function serializeCommand(command) {
  if (!command) return null;
  return {
    id: command.id,
    commandId: command.id,
    type: command.type,
    status: command.status,
    actorId: command.actorId,
    targetId: command.targetId || null,
    questionId: command.questionId || null,
    questionIndex: command.questionIndex ?? null,
    selectionEndsAt: command.selectionEndsAt || null,
    remainingSelectionMs: command.remainingSelectionMs ?? null,
    startedAt: command.startedAt || null,
    completedAt: command.completedAt || null,
    result: command.result || {},
    error: command.error || null,
    createdAt: command.createdAt,
  };
}

function getLiveState(session, { participantId = null } = {}) {
  const includeAnswerCounts = !participantId;
  const index = session.currentQuestionIndex ?? -1;
  const totalQuestions = (session.gameQuestions || []).length;
  const question =
    index >= 0 && index < totalQuestions ? session.gameQuestions[index] : null;
  const includeCorrect = REVEAL_STATES.includes(session.gameState);
  const leaderboard = buildLeaderboard(session);
  const participants = activeParticipants(session);
  const counts = question ? answerCounts(session, question.question) : [];
  const activeCommand = getActiveCommand(session);
  const serverNow = now();

  const state = {
    sessionId: session.id,
    status: session.status,
    gameState: session.gameState,
    currentQuestionIndex: index,
    totalQuestions,
    questionProgress: {
      current: index >= 0 ? index + 1 : 0,
      total: totalQuestions,
      answeredCount: includeAnswerCounts ? counts.reduce((sum, item) => sum + item.count, 0) : null,
      totalPlayers: participants.length,
    },
    phaseStartedAt: iso(session.phaseStartedAt),
    phaseEndsAt: iso(session.phaseEndsAt),
    phaseRemainingMs:
      session.status === "PAUSED"
        ? session.remainingTimeMs ?? null
        : session.phaseEndsAt
          ? Math.max(0, new Date(session.phaseEndsAt).getTime() - serverNow)
          : null,
    remainingTimeMs: session.remainingTimeMs ?? null,
    serverTime: new Date(serverNow).toISOString(),
    question: serializeGameQuestion(question, includeCorrect),
    leaderboard,
    commandSettings: session.commandSettings,
    phaseSettings: session.phaseSettings,
  };

  if (includeAnswerCounts) {
    state.answerCounts = counts;
    state.answerCount = counts.reduce((sum, item) => sum + item.count, 0);
    state.commandQueue = buildCommandQueue(session).map(serializeCommand);
    state.participants = participants.map((participant) => ({
      ...normalizeParticipant(participant),
      commandEligible: eligibleTargets(session, null).some(
        (target) => target.id === participant.id
      ),
    }));
  }

  if (participantId) {
    const participant = findParticipant(session, participantId);

    if (participant) {
      const entry = leaderboard.find(
        (item) => item.participantId === participant.id
      );

      state.you = {
        participantId: participant.id,
        nickname: participant.nickname,
        score: participant.score || 0,
        streak: participant.streak || 0,
        bestStreak: participant.bestStreak || 0,
        rank: entry ? entry.rank : null,
        doublePointsActive: Boolean(participant.doublePointsActive),
        streakShieldActive: Boolean(participant.streakShieldActive),
        colorShards: participant.colorShards || 0,
        unlockedColors: participant.unlockedColors || [],
        giftsReceived: participant.giftsReceived || 0,
        lastGiftCards: participant.lastGiftCards || [],
      };

      if (question) {
        const answer = session.answers?.[participant.id]?.[question.question];

        if (answer) {
          state.yourAnswer = {
            selectedOptionId: answer.selectedOptionId,
            responseTimeMs: answer.responseMs,
            submittedAt: iso(answer.submittedAt),
            ...(includeCorrect
              ? {
                  isCorrect: answer.isCorrect,
                  pointsAwarded: answer.pointsAwarded,
                  basePointsAwarded: answer.basePointsAwarded,
                  doublePointsApplied: answer.doublePointsApplied,
                  streakShieldApplied: answer.streakShieldApplied,
                  streakAfter: answer.streakAfter,
                }
              : {}),
          };
        } else {
          state.yourAnswer = null;
        }
      }
    }
  }

  if (activeCommand) {
    const isActor = participantId === activeCommand.actorId;
    const serialized = serializeCommand(activeCommand);

    if (includeAnswerCounts || isActor) {
      state.activeCommand = serialized;
    } else {
      state.activeCommand = {
        commandId: serialized.commandId,
        type: serialized.type,
        status: serialized.status,
        actorId: serialized.actorId,
        questionIndex: serialized.questionIndex,
        selectionEndsAt: serialized.selectionEndsAt,
      };
    }

    if (isActor) {
      state.yourCommand = serialized;

      if (activeCommand.status === "AWAITING_TARGET") {
        state.commandTargets = eligibleTargets(session, activeCommand.actorId, {
          requirePositiveScore: activeCommand.type === "THIEF",
        }).map(serializeTarget);
      }
    }
  }

  return state;
}

function scheduleCurrentPhase(session) {
  if (session.status === "PAUSED" || session.status === "FINISHED") return;

  switch (session.gameState) {
    case "COUNTDOWN":
      schedule(session.id, phaseDelay(session), () => {
        const fresh = db.sessions.findById(session.id);
        if (fresh) startQuestion(fresh, 0);
      });
      break;
    case "QUESTION":
      schedule(session.id, phaseDelay(session), () => {
        const fresh = db.sessions.findById(session.id);
        if (fresh) endQuestion(fresh);
      });
      break;
    case "REVEAL":
      schedule(session.id, phaseDelay(session), () => {
        const fresh = db.sessions.findById(session.id);
        if (fresh) showExplanation(fresh);
      });
      break;
    case "EXPLANATION":
      schedule(session.id, phaseDelay(session), () => {
        const fresh = db.sessions.findById(session.id);
        if (fresh) showPoints(fresh);
      });
      break;
    case "POINTS":
      schedule(session.id, phaseDelay(session), () => {
        const fresh = db.sessions.findById(session.id);
        if (fresh) showLeaderboard(fresh);
      });
      break;
    case "LEADERBOARD":
      schedule(session.id, phaseDelay(session), () => {
        const fresh = db.sessions.findById(session.id);
        if (fresh) showPhoneLeaderboard(fresh);
      });
      break;
    case "PHONE_LEADERBOARD":
      schedule(session.id, phaseDelay(session), () => {
        const fresh = db.sessions.findById(session.id);
        if (fresh) beginCommands(fresh);
      });
      break;
    default:
      break;
  }
}

function snapshotQuestions(quiz) {
  return (quiz.questions || []).map((question, index) => ({
    question: question.id,
    text: question.text,
    points: Number(question.weight) || 1000,
    timeLimitSec: Number(question.duration) || 10,
    order: Number(question.order ?? index),
    options: (question.options || []).map((text, optionIndex) => ({
      optionId: crypto.randomUUID(),
      text,
      isCorrect: optionIndex === question.correctOptionIndex,
    })),
  }));
}

function startQuestion(session, index) {
  if (session.status !== "LIVE") return null;

  const totalQuestions = (session.gameQuestions || []).length;

  if (index >= totalQuestions) {
    return finishGame(session);
  }

  const question = session.gameQuestions[index];
  if (!question) return finishGame(session);

  clearTimer(session.id);
  session.gameState = "QUESTION";
  session.currentQuestionIndex = index;
  session.phaseStartedAt = now();
  session.phaseEndsAt = now() + question.timeLimitSec * 1000;
  session.remainingTimeMs = null;
  session.activeCommand = null;
  save(session);
  schedule(session.id, question.timeLimitSec * 1000, () => {
    const fresh = db.sessions.findById(session.id);
    if (fresh) endQuestion(fresh);
  });
  return session;
}

function endQuestion(session) {
  if (session.status !== "LIVE" || session.gameState !== "QUESTION") {
    return null;
  }

  clearTimer(session.id);
  session.gameState = "REVEAL";
  session.phaseStartedAt = now();
  session.phaseEndsAt = now() + phaseMs(session, "revealMs", 5000);
  session.remainingTimeMs = null;
  save(session);
  scheduleCurrentPhase(session);
  return session;
}

function showExplanation(session) {
  if (session.status !== "LIVE" || session.gameState !== "REVEAL") {
    return null;
  }

  clearTimer(session.id);
  session.gameState = "EXPLANATION";
  session.phaseStartedAt = now();
  session.phaseEndsAt = now() + phaseMs(session, "explanationMs", 5000);
  save(session);
  scheduleCurrentPhase(session);
  return session;
}

function showPoints(session) {
  if (session.status !== "LIVE" || session.gameState !== "EXPLANATION") {
    return null;
  }

  clearTimer(session.id);
  session.gameState = "POINTS";
  session.phaseStartedAt = now();
  session.phaseEndsAt = now() + phaseMs(session, "pointsMs", 3000);
  save(session);
  scheduleCurrentPhase(session);
  return session;
}

function showLeaderboard(session) {
  if (session.status !== "LIVE" || session.gameState !== "POINTS") {
    return null;
  }

  clearTimer(session.id);
  session.gameState = "LEADERBOARD";
  session.phaseStartedAt = now();
  session.phaseEndsAt = now() + phaseMs(session, "leaderboardMs", 5000);
  save(session);
  scheduleCurrentPhase(session);
  return session;
}

function showPhoneLeaderboard(session) {
  if (session.status !== "LIVE" || session.gameState !== "LEADERBOARD") {
    return null;
  }

  clearTimer(session.id);
  session.gameState = "PHONE_LEADERBOARD";
  session.phaseStartedAt = now();
  session.phaseEndsAt = now() + phaseMs(session, "phoneLeaderboardMs", 3000);
  save(session);
  scheduleCurrentPhase(session);
  return session;
}

function commandEnabled(session, type) {
  switch (type) {
    case "GIFT":
      return Boolean(session.commandSettings?.gift);
    case "THIEF":
      return Boolean(session.commandSettings?.thief);
    case "ROCKET":
      return Boolean(session.commandSettings?.rocket);
    default:
      return false;
  }
}

function recordCommandEvent(session, command, result) {
  session.events = session.events || [];
  session.events.push({
    id: crypto.randomUUID(),
    type: `command:${String(command.type).toLowerCase()}`,
    actorId: command.actorId,
    actorName:
      findParticipant(session, command.actorId)?.name ||
      command.actorName ||
      "",
    targetId: result?.targetId || null,
    targetName:
      findParticipant(session, result?.targetId)?.name ||
      result?.targetNickname ||
      null,
    value: result?.value || 0,
    questionId: command.questionId,
    metadata: result || {},
    createdAt: now(),
  });
}

function enqueueCommands(session) {
  const index = session.currentQuestionIndex;
  const question = session.gameQuestions?.[index];
  if (!question) return;

  const isLastQuestion = index + 1 >= (session.gameQuestions || []).length;
  const triggers = [];

  for (const participant of activeParticipants(session)) {
    const answer = session.answers?.[participant.id]?.[question.question];
    if (!answer || !answer.isCorrect) continue;

    if (
      commandEnabled(session, "GIFT") &&
      participant.streak === GIFT_UNLOCK_STREAK
    ) {
      triggers.push({ type: "GIFT", participant });
    }

    if (
      commandEnabled(session, "THIEF") &&
      !isLastQuestion &&
      participant.streak === THIEF_UNLOCK_STREAK &&
      Math.random() < THIEF_ACTIVATION_CHANCE &&
      eligibleTargets(session, participant.id, { requirePositiveScore: true })
        .length > 0
    ) {
      triggers.push({ type: "THIEF", participant });
    }

    if (
      commandEnabled(session, "ROCKET") &&
      participant.streak > 0 &&
      participant.streak % ROCKET_UNLOCK_MULTIPLE === 0 &&
      eligibleTargets(session, participant.id).length > 0
    ) {
      triggers.push({ type: "ROCKET", participant });
    }
  }

  triggers.sort(
    (a, b) =>
      COMMAND_PRIORITIES[a.type] - COMMAND_PRIORITIES[b.type] ||
      new Date(a.participant.joinedAt).getTime() -
        new Date(b.participant.joinedAt).getTime()
  );

  session.commands = session.commands || [];

  for (const trigger of triggers) {
    const exists = session.commands.some(
      (command) =>
        command.type === trigger.type &&
        command.questionIndex === index &&
        command.actorId === trigger.participant.id
    );
    if (exists) continue;

    session.commands.push({
      id: crypto.randomUUID(),
      type: trigger.type,
      status: "QUEUED",
      actorId: trigger.participant.id,
      actorName: trigger.participant.nickname,
      targetId: null,
      questionId: question.question,
      questionIndex: index,
      selectionEndsAt: null,
      remainingSelectionMs: null,
      startedAt: null,
      completedAt: null,
      result: {},
      error: null,
      createdAt: now(),
    });
  }
}

function drawGiftCards() {
  const pool = GIFT_CARDS.map((card) => ({ ...card }));
  const cards = [];

  while (cards.length < GIFT_DRAW_COUNT && pool.length > 0) {
    const totalWeight = pool.reduce((sum, card) => sum + card.weight, 0);
    let roll = Math.random() * totalWeight;
    let index = pool.length - 1;

    for (let i = 0; i < pool.length; i += 1) {
      roll -= pool[i].weight;
      if (roll < 0) {
        index = i;
        break;
      }
    }

    cards.push(pool.splice(index, 1)[0]);
  }

  return cards;
}

function applyGiftCards(session, participant, cards) {
  const effects = [];
  let value = 0;

  for (const card of cards) {
    if (card.id === "DOUBLE_POINTS") {
      const alreadyActive = Boolean(participant.doublePointsActive);
      participant.doublePointsActive = true;
      effects.push({ card: card.id, applied: !alreadyActive });
    } else if (card.id === "STREAK_SHIELD") {
      const alreadyActive = Boolean(participant.streakShieldActive);
      participant.streakShieldActive = true;
      effects.push({ card: card.id, applied: !alreadyActive });
    } else if (card.id === "POINTS_BONUS") {
      participant.score = (participant.score || 0) + POINTS_BONUS_POINTS;
      value += POINTS_BONUS_POINTS;
      effects.push({ card: card.id, applied: true, points: POINTS_BONUS_POINTS });
    } else if (card.id === "COLOR_SHARDS") {
      participant.colorShards = (participant.colorShards || 0) + 1;
      const unlocked = [];

      while (participant.colorShards >= COLOR_SHARDS_PER_UNLOCK) {
        const nextColor = AVATAR_COLORS.find(
          (color) => !(participant.unlockedColors || []).includes(color)
        );
        if (!nextColor) break;
        participant.unlockedColors = [
          ...(participant.unlockedColors || []),
          nextColor,
        ];
        participant.colorShards -= COLOR_SHARDS_PER_UNLOCK;
        unlocked.push(nextColor);
      }

      effects.push({
        card: card.id,
        applied: true,
        shards: participant.colorShards,
        unlockedColors: unlocked,
      });
    } else if (card.id === "LEADERBOARD_STRIKE") {
      const leaderboard = buildLeaderboard(session);
      const position = leaderboard.findIndex(
        (entry) => entry.participantId === participant.id
      );
      const target =
        position > 0
          ? findParticipant(session, leaderboard[position - 1].participantId)
          : null;

      if (!target) {
        participant.score = (participant.score || 0) + LEADERBOARD_STRIKE_POINTS;
        value += LEADERBOARD_STRIKE_POINTS;
        effects.push({
          card: card.id,
          applied: true,
          amount: LEADERBOARD_STRIKE_POINTS,
          firstPlaceBonus: true,
        });
      } else {
        const amount = Math.min(
          LEADERBOARD_STRIKE_POINTS,
          target.score || 0
        );
        target.score = Math.max(0, (target.score || 0) - amount);
        participant.score = (participant.score || 0) + amount;
        value += amount;
        effects.push({
          card: card.id,
          applied: true,
          amount,
          targetId: target.id,
          firstPlaceBonus: false,
        });
      }
    }
  }

  participant.giftsReceived = (participant.giftsReceived || 0) + 1;
  participant.lastGiftCards = cards.map((card) => card.id);

  return {
    cards: cards.map((card) => card.id),
    effects,
    value,
    score: participant.score || 0,
    colorShards: participant.colorShards || 0,
    unlockedColors: participant.unlockedColors || [],
  };
}

function completeTargetCommand(session, command, target, autoSelected) {
  if (!target || command.status !== "AWAITING_TARGET") return null;

  const targetScoreBefore = target.score || 0;
  const targetStreakBefore = target.streak || 0;
  let result = null;

  if (command.type === "THIEF") {
    const owner = findParticipant(session, command.actorId);
    if (!owner) return null;
    target.score = 0;
    target.streak = 0;
    owner.score = (owner.score || 0) + targetScoreBefore;
    result = {
      targetId: target.id,
      targetNickname: target.nickname,
      value: targetScoreBefore,
      ownerScoreBefore: Math.max(0, (owner.score || 0) - targetScoreBefore),
      ownerScoreAfter: owner.score || 0,
      targetScoreBefore,
      targetScoreAfter: 0,
      targetStreakBefore,
      targetStreakAfter: 0,
      autoSelected,
      reason: autoSelected ? "TIMEOUT" : "OWNER_SELECTED",
    };
  } else if (command.type === "ROCKET") {
    target.score = 0;
    target.streak = 0;
    result = {
      targetId: target.id,
      targetNickname: target.nickname,
      value: targetScoreBefore,
      ownerPointsAwarded: 0,
      targetScoreBefore,
      targetScoreAfter: 0,
      targetStreakBefore,
      targetStreakAfter: 0,
      autoSelected,
      reason: autoSelected ? "TIMEOUT" : "OWNER_SELECTED",
    };
  }

  if (!result) return null;

  clearCommandTimer(command.id);
  command.status = "COMPLETED";
  command.targetId = target.id;
  command.completedAt = now();
  command.result = result;
  command.selectionEndsAt = null;
  command.remainingSelectionMs = null;
  session.activeCommand = null;
  recordCommandEvent(session, command, result);
  save(session);
  processQueue(session);
  return result;
}

function cancelCommand(session, command, reason) {
  clearCommandTimer(command.id);
  command.status = "CANCELLED";
  command.completedAt = now();
  command.error = reason;
  command.selectionEndsAt = null;
  command.remainingSelectionMs = null;
  if (session.activeCommand === command.id) {
    session.activeCommand = null;
  }
  save(session);
}

function startGiftCommand(session, command) {
  command.status = "PROCESSING";
  command.startedAt = now();
  session.activeCommand = command.id;
  session.gameState = "GIFT";
  session.phaseStartedAt = now();
  session.phaseEndsAt = null;
  session.remainingTimeMs = null;
  save(session);

  const participant = findParticipant(session, command.actorId);

  if (!participant) {
    cancelCommand(session, command, "PARTICIPANT_NOT_FOUND");
    return;
  }

  const result = applyGiftCards(session, participant, drawGiftCards());
  command.status = "COMPLETED";
  command.completedAt = now();
  command.result = result;
  session.activeCommand = null;
  recordCommandEvent(session, command, result);
  save(session);
}

function startTargetCommand(session, command, targets) {
  command.status = "AWAITING_TARGET";
  command.startedAt = now();
  command.selectionEndsAt = now() + COMMAND_SELECTION_TIMEOUT_MS;
  command.remainingSelectionMs = null;
  session.activeCommand = command.id;
  session.gameState = command.type;
  session.phaseStartedAt = now();
  session.phaseEndsAt = null;
  session.remainingTimeMs = null;
  save(session);
  scheduleCommandTimeout(session.id, command.id, command.selectionEndsAt);
  return targets;
}

function processQueue(session) {
  if (session.status !== "LIVE") return;

  while (true) {
    const next = buildCommandQueue(session)[0];

    if (!next) {
      session.activeCommand = null;
      save(session);
      advanceAfterCommands(session);
      return;
    }

    if (next.type === "GIFT") {
      startGiftCommand(session, next);
      continue;
    }

    const targets = eligibleTargets(session, next.actorId, {
      requirePositiveScore: next.type === "THIEF",
    });

    if (targets.length === 0) {
      cancelCommand(session, next, "NO_ELIGIBLE_TARGET");
      continue;
    }

    startTargetCommand(session, next, targets);
    return;
  }
}

function beginCommands(session) {
  if (session.status !== "LIVE") return null;
  enqueueCommands(session);
  processQueue(session);
  return session;
}

function advanceAfterCommands(session) {
  if (session.status !== "LIVE") return null;

  const nextIndex = (session.currentQuestionIndex ?? -1) + 1;

  if (nextIndex < (session.gameQuestions || []).length) {
    return startQuestion(session, nextIndex);
  }

  return finishGame(session);
}

function handleCommandTimeout(sessionId, commandId) {
  const session = db.sessions.findById(sessionId);
  if (!session || session.status !== "LIVE") return;

  const command = (session.commands || []).find(
    (item) => item.id === commandId
  );

  if (!command || command.status !== "AWAITING_TARGET") return;
  if (session.activeCommand !== command.id) return;

  const targets = eligibleTargets(session, command.actorId, {
    requirePositiveScore: command.type === "THIEF",
  });

  if (targets.length === 0) {
    cancelCommand(session, command, "NO_ELIGIBLE_TARGET");
    processQueue(session);
    return;
  }

  completeTargetCommand(session, command, targets[0], true);
}

function forceResolveActiveCommand(session) {
  const command = getActiveCommand(session);

  if (!command) {
    processQueue(session);
    return null;
  }

  if (command.status === "AWAITING_TARGET") {
    const targets = eligibleTargets(session, command.actorId, {
      requirePositiveScore: command.type === "THIEF",
    });

    if (targets.length === 0) {
      cancelCommand(session, command, "NO_ELIGIBLE_TARGET");
      processQueue(session);
      return null;
    }

    return completeTargetCommand(session, command, targets[0], true);
  }

  processQueue(session);
  return command;
}

function finishGame(session) {
  if (session.status === "FINISHED") return session;

  clearTimer(session.id);

  for (const command of session.commands || []) {
    if (["QUEUED", "PROCESSING", "AWAITING_TARGET"].includes(command.status)) {
      clearCommandTimer(command.id);
      command.status = "CANCELLED";
      command.completedAt = now();
      command.error = "GAME_FINISHED";
    }
  }

  const leaderboard = buildLeaderboard(session);
  for (const entry of leaderboard) {
    const participant = findParticipant(session, entry.participantId);
    if (participant) participant.finalRank = entry.rank;
  }

  session.status = "FINISHED";
  session.gameState = "FINISHED";
  session.endedAt = now();
  session.joinOpen = false;
  session.phaseEndsAt = null;
  session.remainingTimeMs = null;
  session.activeCommand = null;
  session.pausedAt = null;
  save(session);
  return session;
}

function calculatePoints(points, responseTimeMs, timeLimitMs) {
  if (!timeLimitMs || timeLimitMs <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, responseTimeMs / timeLimitMs));
  return Math.max(0, Math.round(points * (1 - ratio * 0.5)));
}

function submitAnswer(session, participantId, payload = {}) {
  const participant = findParticipant(session, participantId);

  if (!participant) {
    throw { status: 404, message: "Participant not found" };
  }

  if (participant.status === KICKED) {
    throw { status: 403, message: "You were removed from this session" };
  }

  if (session.status === "PAUSED") {
    throw { status: 409, message: "The game is paused" };
  }

  if (session.status !== "LIVE" || session.gameState !== "QUESTION") {
    throw { status: 409, message: "No question is currently accepting answers" };
  }

  const question = session.gameQuestions?.[session.currentQuestionIndex];

  if (!question) {
    throw { status: 409, message: "No question is currently accepting answers" };
  }

  if (!payload.questionId || payload.questionId !== question.question) {
    throw { status: 409, message: "This is not the current question" };
  }

  if (!payload.optionId) {
    throw { status: 400, message: "A valid optionId is required" };
  }

  const option = (question.options || []).find(
    (item) => item.optionId === payload.optionId
  );

  if (!option) {
    throw { status: 400, message: "The selected option does not belong to this question" };
  }

  if (
    !session.phaseEndsAt ||
    now() > new Date(session.phaseEndsAt).getTime()
  ) {
    throw { status: 409, message: "The question deadline has passed" };
  }

  session.answers = session.answers || {};
  session.answers[participant.id] = session.answers[participant.id] || {};

  if (session.answers[participant.id][question.question]) {
    throw { status: 409, message: "You have already answered this question" };
  }

  const timeLimitMs = question.timeLimitSec * 1000;
  const startedAt = session.phaseStartedAt
    ? new Date(session.phaseStartedAt).getTime()
    : now() - timeLimitMs;
  const responseTimeMs = Math.max(
    0,
    Math.min(timeLimitMs, now() - startedAt)
  );
  const isCorrect = Boolean(option.isCorrect);
  const basePointsAwarded = isCorrect
    ? calculatePoints(question.points, responseTimeMs, timeLimitMs)
    : 0;
  const doublePointsApplied = Boolean(participant.doublePointsActive);
  const pointsAwarded =
    isCorrect && doublePointsApplied ? basePointsAwarded * 2 : basePointsAwarded;
  const streakShieldApplied =
    !isCorrect && Boolean(participant.streakShieldActive);
  const nextStreak = isCorrect
    ? (participant.streak || 0) + 1
    : streakShieldApplied
      ? participant.streak || 0
      : 0;

  const answer = {
    selectedOptionId: option.optionId,
    selectedOption: question.options.findIndex(
      (item) => item.optionId === option.optionId
    ),
    responseMs: responseTimeMs,
    isCorrect,
    pointsAwarded,
    basePointsAwarded,
    rawScoreAwarded: isCorrect ? question.points : 0,
    doublePointsApplied,
    streakShieldApplied,
    streakAfter: nextStreak,
    submittedAt: now(),
  };

  session.answers[participant.id][question.question] = answer;

  participant.score = (participant.score || 0) + pointsAwarded;
  participant.rawScore = (participant.rawScore || 0) + (isCorrect ? question.points : 0);
  participant.answeredCount = (participant.answeredCount || 0) + 1;
  participant.correctCount =
    (participant.correctCount || 0) + (isCorrect ? 1 : 0);
  participant.totalResponseTimeMs =
    (participant.totalResponseTimeMs || 0) + responseTimeMs;
  participant.streak = nextStreak;
  participant.bestStreak = Math.max(participant.bestStreak || 0, nextStreak);
  participant.doublePointsActive = doublePointsApplied
    ? false
    : participant.doublePointsActive;
  participant.streakShieldActive = streakShieldApplied
    ? false
    : participant.streakShieldActive;
  participant.lastAnswerAt = now();
  participant.answeredQuestions = [
    ...(participant.answeredQuestions || []),
    question.question,
  ];

  save(session);

  const totalPlayers = activeParticipants(session).length;
  const answered = answeredCountFor(session, question.question);

  if (totalPlayers > 0 && answered >= totalPlayers) {
    schedule(session.id, 0, () => {
      const fresh = db.sessions.findById(session.id);
      if (fresh) endQuestion(fresh);
    });
  }

  return {
    sessionId: session.id,
    questionId: question.question,
    selectedOptionId: option.optionId,
    submittedAt: new Date(answer.submittedAt).toISOString(),
    responseTimeMs,
  };
}

function normalizeJoinAvatar(payload, student) {
  return {
    preset:
      payload.avatar?.preset ||
      student?.avatar?.preset ||
      "FOX",
    color:
      payload.avatar?.color ||
      student?.avatar?.color ||
      "#3B82F6",
  };
}

function joinSession(payload = {}) {
  const session = findSessionByCode(payload.code);
  const student = payload.studentId
    ? db.students.findById(payload.studentId)
    : null;

  if (payload.studentId && (!student || student.organizationId !== session.organizationId)) {
    throw { status: 404, message: "Student not found" };
  }

  let sectionId = student?.section || null;

  if (payload.section) {
    const section = db.sections.findById(payload.section);

    if (!section || section.organizationId !== session.organizationId) {
      throw { status: 404, message: "Section not found" };
    }

    sectionId = section.id;
  }

  if (session.status === "FINISHED") {
    throw { status: 403, message: "This session has finished" };
  }

  if (!session.joinOpen) {
    throw { status: 403, message: "This session is not accepting participants" };
  }

  if (session.status === "PAUSED") {
    throw { status: 403, message: "This session is paused" };
  }

  if (session.status !== "LOBBY" && session.status !== "LIVE") {
    throw { status: 403, message: "This session is not accepting participants" };
  }

  const rawNickname = String(
    payload.nickname || student?.nickname || student?.name || ""
  ).trim();

  if (!rawNickname) {
    throw { status: 400, message: "Nickname is required" };
  }

  if (rawNickname.length > 50) {
    throw { status: 400, message: "Nickname must be 50 characters or fewer" };
  }

  const rawName = String(payload.name || student?.name || rawNickname).trim();

  if (rawName.length > 80) {
    throw { status: 400, message: "Name must be 80 characters or fewer" };
  }

  const nickname = rawNickname;
  const nicknameKey = nickname.toLowerCase();

  if (
    (session.participants || []).some(
      (participant) => participant.nicknameKey === nicknameKey
    )
  ) {
    throw { status: 409, message: "Nickname is already taken in this session" };
  }

  if (student) {
    const existingStudent = (session.participants || []).find(
      (participant) => participant.studentId === student.id
    );

    if (existingStudent) {
      if (existingStudent.status === KICKED) {
        throw { status: 403, message: "You were removed from this session" };
      }

      throw { status: 409, message: "This student has already joined this session" };
    }
  }

  const participant = {
    id: crypto.randomUUID(),
    studentId: student?.id || null,
    sectionId,
    name: rawName,
    nickname,
    nicknameKey,
    avatar: normalizeJoinAvatar(payload, student),
    status: ACTIVE,
    score: 0,
    rawScore: 0,
    streak: 0,
    bestStreak: 0,
    answeredCount: 0,
    correctCount: 0,
    totalResponseTimeMs: 0,
    connected: true,
    doublePointsActive: false,
    streakShieldActive: false,
    colorShards: 0,
    unlockedColors: [],
    giftsReceived: 0,
    lastGiftCards: [],
    answeredQuestions: [],
    finalRank: null,
    participantToken: crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, ""),
    joinedAt: now(),
    lastSeenAt: now(),
    kickedAt: null,
  };

  session.participants = [...(session.participants || []), participant];
  save(session);

  return {
    data: {
      session: toPublicSession(session),
      participant: publicParticipant(participant),
    },
  };
}

function reconnectParticipant(payload = {}) {
  const session = findSessionByCode(payload.code);
  const participant = (session.participants || []).find(
    (item) => item.participantToken === payload.participantToken
  );

  if (!participant) {
    throw { status: 401, message: "Invalid participant token" };
  }

  if (participant.status === KICKED) {
    throw { status: 403, message: "You were removed from this session" };
  }

  participant.lastSeenAt = now();
  participant.connected = true;
  save(session);

  return {
    data: {
      session: toPublicSession(session),
      participant: publicParticipant(participant),
    },
  };
}

export const sessionMock = {
  async list() {
    await delay();
    const user = requireOrg();
    return {
      data: db.sessions
        .findMany({ organizationId: user.organizationId })
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(toSession),
    };
  },

  async getById(sessionId) {
    await delay();
    const user = requireOrg();
    return { data: toSession(ownSessionOrThrow(sessionId, user)) };
  },

  async getLobby(sessionId) {
    await delay();
    const user = requireOrg();
    return { data: toSession(ownSessionOrThrow(sessionId, user)) };
  },

  async getLiveState(sessionId, options = {}) {
    await delay(30);
    const session = db.sessions.findById(sessionId);
    if (!session) throw { status: 404, message: "Session not found" };

    if (options.participantId) {
      const participant = findParticipant(session, options.participantId);
      if (!participant || participant.status === KICKED) {
        throw { status: 403, message: "Participant not found" };
      }
    } else {
      requireOrg();
    }

    return {
      data: getLiveState(session, { participantId: options.participantId }),
    };
  },

  async getByCode(code) {
    await delay();
    const session = findSessionByCode(code);
    return { data: toPublicSession(session) };
  },

  async create(payload = {}) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const quizId = payload.quizId ?? payload.quiz;
    const quiz = db.quizzes.findById(quizId);

    if (!quiz || quiz.organizationId !== user.organizationId) {
      throw { status: 404, message: "الكويز مش موجود" };
    }

    if (quiz.archived || quiz.status === "ARCHIVED") {
      throw { status: 409, message: "Archived quizzes cannot be used to create a session" };
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      throw { status: 409, message: "Quiz must have at least one question before creating a session" };
    }

    const joinCode = genCode();
    const timestamp = now();
    const session = db.sessions.create({
      id: crypto.randomUUID(),
      organizationId: user.organizationId,
      quizId: quiz.id,
      createdBy: user.id,
      joinCode,
      joinUrl: buildJoinUrl(joinCode),
      status: "LOBBY",
      joinOpen: true,
      gameState: "IDLE",
      currentQuestionIndex: -1,
      gameQuestions: [],
      participants: [],
      answers: {},
      commands: [],
      events: [],
      phaseStartedAt: null,
      phaseEndsAt: null,
      remainingTimeMs: null,
      commandSettings: { gift: false, thief: false, rocket: false },
      phaseSettings: normalizePhaseSettings({}),
      activeCommand: null,
      startedAt: null,
      endedAt: null,
      pausedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    save(session);
    return { data: toSession(session) };
  },

  async updateCommandSettings(sessionId, settings = {}) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const session = ownSessionOrThrow(sessionId, user);

    if (session.status === "FINISHED") {
      throw { status: 409, message: "Finished sessions cannot change command settings" };
    }

    session.commandSettings = {
      ...session.commandSettings,
      ...settings,
    };

    const disabled = [];
    if (settings.gift === false) disabled.push("GIFT");
    if (settings.thief === false) disabled.push("THIEF");
    if (settings.rocket === false) disabled.push("ROCKET");

    for (const command of session.commands || []) {
      if (
        disabled.includes(command.type) &&
        ["QUEUED", "PROCESSING", "AWAITING_TARGET"].includes(command.status)
      ) {
        cancelCommand(session, command, "COMMAND_DISABLED");
      }
    }

    save(session);

    if (session.status === "LIVE" && disabled.length > 0) {
      processQueue(session);
    }

    return { data: toSession(session) };
  },

  async updatePhaseSettings(sessionId, settings = {}) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const session = ownSessionOrThrow(sessionId, user);

    if (session.status === "FINISHED") {
      throw { status: 409, message: "Finished sessions cannot change phase settings" };
    }

    session.phaseSettings = {
      ...session.phaseSettings,
      ...settings,
    };

    const keyByState = {
      REVEAL: "revealMs",
      EXPLANATION: "explanationMs",
      POINTS: "pointsMs",
      LEADERBOARD: "leaderboardMs",
      PHONE_LEADERBOARD: "phoneLeaderboardMs",
    };
    const key = keyByState[session.gameState];

    if (
      session.status === "LIVE" &&
      key &&
      Number.isFinite(Number(session.phaseSettings[key]))
    ) {
      session.phaseEndsAt = now() + Number(session.phaseSettings[key]);
      clearTimer(session.id);
      save(session);
      scheduleCurrentPhase(session);
    } else {
      save(session);
    }

    return { data: toSession(session) };
  },

  async lockJoining(sessionId, allowJoining) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const session = ownSessionOrThrow(sessionId, user);

    if (session.status === "FINISHED") {
      throw { status: 409, message: "Finished sessions cannot be reopened" };
    }

    session.joinOpen = Boolean(allowJoining);
    save(session);
    return { data: toSession(session) };
  },

  async join(payload = {}) {
    await delay();

    if (payload.participantToken) {
      return reconnectParticipant(payload);
    }

    return joinSession(payload);
  },

  async reconnect(code, participantToken) {
    await delay();
    return reconnectParticipant({ code, participantToken });
  },

  async kickParticipant(sessionId, participantId) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const session = ownSessionOrThrow(sessionId, user);
    const participant = findParticipantOrThrow(session, participantId);

    if (participant.status === KICKED) {
      throw { status: 409, message: "Participant has already been removed" };
    }

    participant.status = KICKED;
    participant.connected = false;
    participant.kickedAt = now();
    save(session);
    return { data: { id: participantId } };
  },

  async start(sessionId) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const session = ownSessionOrThrow(sessionId, user);

    if (session.status !== "LOBBY") {
      throw { status: 409, message: "Only sessions in the lobby can be started" };
    }

    const quiz = db.quizzes.findById(session.quizId);
    const gameQuestions = snapshotQuestions(quiz);

    if (gameQuestions.length === 0) {
      throw { status: 409, message: "Quiz must have at least one question before starting" };
    }

    session.gameQuestions = gameQuestions;
    session.status = "LIVE";
    session.startedAt = session.startedAt || now();
    session.joinOpen = false;
    session.gameState = "COUNTDOWN";
    session.currentQuestionIndex = -1;
    session.phaseStartedAt = now();
    session.phaseEndsAt = now() + COUNTDOWN_MS;
    session.remainingTimeMs = null;
    session.pausedAt = null;
    session.activeCommand = null;
    save(session);
    scheduleCurrentPhase(session);
    return { data: toSession(session) };
  },

  async pause(sessionId) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const session = ownSessionOrThrow(sessionId, user);

    if (session.status !== "LIVE") {
      throw { status: 409, message: "Only live sessions can be paused" };
    }

    clearTimer(session.id);
    session.status = "PAUSED";
    session.pausedAt = now();
    session.remainingTimeMs = session.phaseEndsAt
      ? Math.max(0, new Date(session.phaseEndsAt).getTime() - now())
      : null;

    const command = getActiveCommand(session);

    if (command && command.status === "AWAITING_TARGET") {
      clearCommandTimer(command.id);
      command.remainingSelectionMs = command.selectionEndsAt
        ? Math.max(0, new Date(command.selectionEndsAt).getTime() - now())
        : COMMAND_SELECTION_TIMEOUT_MS;
      command.selectionEndsAt = null;
    }

    save(session);
    return { data: toSession(session) };
  },

  async resume(sessionId) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const session = ownSessionOrThrow(sessionId, user);

    if (session.status !== "PAUSED") {
      throw { status: 409, message: "Only paused sessions can be resumed" };
    }

    session.status = "LIVE";
    session.phaseEndsAt =
      session.remainingTimeMs != null
        ? now() + session.remainingTimeMs
        : session.phaseEndsAt;
    session.remainingTimeMs = null;
    session.pausedAt = null;

    const command = getActiveCommand(session);

    if (command && command.status === "AWAITING_TARGET") {
      const remaining =
        command.remainingSelectionMs ?? COMMAND_SELECTION_TIMEOUT_MS;
      command.selectionEndsAt = now() + remaining;
      command.remainingSelectionMs = null;
      scheduleCommandTimeout(session.id, command.id, command.selectionEndsAt);
    } else {
      scheduleCurrentPhase(session);
    }

    save(session);
    return { data: toSession(session) };
  },

  async reveal(sessionId) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const session = ownSessionOrThrow(sessionId, user);

    if (session.status !== "LIVE") {
      throw { status: 409, message: "The game is not live" };
    }

    if (session.gameState !== "QUESTION") {
      throw { status: 409, message: "Only an active question can be revealed" };
    }

    endQuestion(session);
    return { data: toSession(session) };
  },

  async next(sessionId) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const session = ownSessionOrThrow(sessionId, user);

    if (session.status !== "LIVE") {
      throw { status: 409, message: "The game is not live" };
    }

    switch (session.gameState) {
      case "COUNTDOWN":
        startQuestion(session, 0);
        break;
      case "QUESTION":
        endQuestion(session);
        break;
      case "REVEAL":
        showExplanation(session);
        break;
      case "EXPLANATION":
        showPoints(session);
        break;
      case "POINTS":
        showLeaderboard(session);
        break;
      case "LEADERBOARD":
        showPhoneLeaderboard(session);
        break;
      case "PHONE_LEADERBOARD":
        beginCommands(session);
        break;
      case "GIFT":
      case "THIEF":
      case "ROCKET":
        forceResolveActiveCommand(session);
        break;
      default:
        throw { status: 409, message: "The current phase cannot be advanced" };
    }

    const fresh = db.sessions.findById(session.id);
    return { data: toSession(fresh || session) };
  },

  async skip(sessionId) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const session = ownSessionOrThrow(sessionId, user);

    if (session.status !== "LIVE") {
      throw { status: 409, message: "The game is not live" };
    }

    if (session.gameState === "IDLE" || session.gameState === "FINISHED") {
      throw { status: 409, message: "The current phase cannot be skipped" };
    }

    clearTimer(session.id);

    for (const command of session.commands || []) {
      if (["QUEUED", "PROCESSING", "AWAITING_TARGET"].includes(command.status)) {
        cancelCommand(session, command, "QUESTION_SKIPPED");
      }
    }

    session.activeCommand = null;
    advanceAfterCommands(session);
    return { data: toSession(session) };
  },

  async finish(sessionId) {
    await delay();
    const user = requireRole(...WRITE_ROLES);
    const session = ownSessionOrThrow(sessionId, user);

    if (session.status === "FINISHED") {
      throw { status: 409, message: "Session is already finished" };
    }

    finishGame(session);
    return { data: toSession(session) };
  },

  async submitAnswer(participantId, payload = {}) {
    await delay();
    const session = db.sessions
      .all()
      .find((item) =>
        (item.participants || []).some(
          (participant) => participant.id === participantId
        )
      );

    if (!session) throw { status: 404, message: "Session not found" };

    return { data: submitAnswer(session, participantId, payload) };
  },

  async selectTarget(participantId, targetParticipantId) {
    await delay();
    const session = db.sessions
      .all()
      .find((item) =>
        (item.participants || []).some(
          (participant) => participant.id === participantId
        )
      );

    if (!session) throw { status: 404, message: "Session not found" };

    const command = getActiveCommand(session);

    if (!command || command.status !== "AWAITING_TARGET") {
      throw { status: 409, message: "You do not have an active command waiting for a target" };
    }

    if (command.actorId !== participantId) {
      throw { status: 403, message: "You do not own this command" };
    }

    if (session.status !== "LIVE") {
      throw { status: 409, message: "The game is not active" };
    }

    const target = findParticipant(session, targetParticipantId);

    if (!target) {
      throw { status: 409, message: "Target not found" };
    }

    if (
      !eligibleTargets(session, command.actorId, {
        requirePositiveScore: command.type === "THIEF",
      }).some((item) => item.id === target.id)
    ) {
      throw { status: 409, message: "The selected target is no longer eligible" };
    }

    const result = completeTargetCommand(session, command, target, false);
    return { data: result };
  },
};

export { READ_ROLES as SESSION_READ_ROLES };
