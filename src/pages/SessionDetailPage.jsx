// src/pages/SessionDetailPage.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardCheck,
  Copy,
  Flag,
  Lock,
  Pause,
  Play,
  Settings2,
  SkipForward,
  Sparkles,
  Timer,
  Trophy,
  Unlock,
  UserX,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useAuth } from "../store/auth.store.jsx";
import { useSessionLive } from "../hooks/useSessionLive";
import StudentAvatar from "../components/student/StudentAvatar.jsx";
import Loading from "../components/ui/Loading.jsx";
import {
  COMMAND_LABELS,
  GAME_STATE_LABELS,
  sessionStatusLabel,
} from "../adapters/session.adapter.js";
import { CONNECTION_STATUS } from "../realtime/events.js";
import "../styles/sessions.css";

const COMMAND_KEYS = ["gift", "thief", "rocket"];

const PHASE_DURATION_FIELDS = [
  { key: "revealSec", label: "مراجعة الإجابة", visibility: "showReveal" },
  { key: "explanationSec", label: "الشرح", visibility: "showExplanation" },
  { key: "pointsSec", label: "النقاط", visibility: "showPoints" },
  { key: "leaderboardSec", label: "المتصدرين", visibility: "showLeaderboard" },
  {
    key: "phoneLeaderboardSec",
    label: "متصدرين الموبايل",
    visibility: "showPhoneLeaderboard",
  },
];

function formatRemaining(ms) {
  if (ms === null || ms === undefined) return "—";
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}:${String(rest).padStart(2, "0")}` : `${rest}ث`;
}

function secondsDraft(settings) {
  return {
    revealSec: Math.round((settings?.revealMs ?? 5000) / 1000),
    explanationSec: Math.round((settings?.explanationMs ?? 5000) / 1000),
    pointsSec: Math.round((settings?.pointsMs ?? 3000) / 1000),
    leaderboardSec: Math.round((settings?.leaderboardMs ?? 5000) / 1000),
    phoneLeaderboardSec: Math.round(
      (settings?.phoneLeaderboardMs ?? 3000) / 1000
    ),
    showReveal: settings?.showReveal !== false,
    showExplanation: settings?.showExplanation !== false,
    showPoints: settings?.showPoints !== false,
    showLeaderboard: settings?.showLeaderboard !== false,
    showPhoneLeaderboard: settings?.showPhoneLeaderboard !== false,
  };
}

function connectionLabel(status) {
  switch (status) {
    case CONNECTION_STATUS.CONNECTED:
      return "متصل";
    case CONNECTION_STATUS.CONNECTING:
      return "بنوصّل...";
    case CONNECTION_STATUS.DISCONNECTED:
      return "انقطع الاتصال";
    default:
      return "خطأ في الاتصال";
  }
}

export default function SessionDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const live = useSessionLive(sessionId);

  const [copied, setCopied] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandDraft, setCommandDraft] = useState(null);
  const [phaseDraft, setPhaseDraft] = useState(null);
  const [settingsError, setSettingsError] = useState(null);

  const {
    session,
    game,
    loading,
    error,
    actionError,
    clearActionError,
    busyAction,
    connection,
    remainingMs,
  } = live;

  const canControl = user?.role === "OWNER" || user?.role === "TEACHER";
  const connected = connection === CONNECTION_STATUS.CONNECTED;

  const joinUrl = session?.joinCode
    ? `${window.location.origin}/join/${session.joinCode}`
    : "";

  const countsByOption = useMemo(() => {
    const map = new Map();
    for (const item of game?.answerCounts || []) {
      map.set(item.optionId, item.count);
    }
    return map;
  }, [game?.answerCounts]);

  const participants = session?.participants || [];
  const leaderboard = game?.leaderboard || [];
  const question = game?.question || null;
  const isLobby = session?.status === "LOBBY";
  const isFinished = session?.status === "FINISHED";
  const isPaused = session?.status === "PAUSED";
  const isLive = session?.status === "LIVE";

  const handleCopy = async () => {
    if (!joinUrl) return;

    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be unavailable; the code is still visible.
    }
  };

  const openSettings = () => {
    setCommandDraft(session?.commandSettings || { gift: false, thief: false, rocket: false });
    setPhaseDraft(secondsDraft(session?.phaseSettings));
    setSettingsError(null);
    setSettingsOpen(true);
  };

  const saveCommands = async () => {
    setSettingsError(null);
    const data = await live.updateCommandSettings({
      gift: Boolean(commandDraft?.gift),
      thief: Boolean(commandDraft?.thief),
      rocket: Boolean(commandDraft?.rocket),
    });

    if (!data) {
      setSettingsError("تعذّر حفظ إعدادات الأوامر.");
    }
  };

  const savePhases = async () => {
    setSettingsError(null);
    const patch = {};

    for (const field of PHASE_DURATION_FIELDS) {
      const seconds = Number(phaseDraft?.[field.key]);

      if (!Number.isFinite(seconds) || seconds < 0 || seconds > 600) {
        setSettingsError("كل مدة لازم تكون بين 0 و600 ثانية.");
        return;
      }

      patch[
        field.key.replace("Sec", "Ms")
      ] = Math.round(seconds * 1000);
      patch[field.visibility] = Boolean(phaseDraft?.[field.visibility]);
    }

    const data = await live.updatePhaseSettings(patch);

    if (!data) {
      setSettingsError("تعذّر حفظ إعدادات المراحل.");
    }
  };

  const handleKick = async (participant) => {
    clearActionError();
    await live.kick(participant.id);
  };

  if (loading) {
    return (
      <div className="page">
        <Loading title="بنحمّل الجلسة..." description="ثانية" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page">
        <section className="card stack-card">
          <p className="error-alert">{error || "الجلسة مش موجودة."}</p>
          <Link className="button button-primary ghost" to="/sessions">
            <ArrowRight size={16} /> رجوع للجلسات
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page session-live-page">
      <header className="card page-heading">
        <div>
          <span className="page-eyebrow">
            <Link to="/sessions" className="session-back-link">
              <ArrowRight size={13} /> الجلسات
            </Link>
            <span className={`session-status ${isFinished ? "session-status-finished" : isLive ? "session-status-live" : isPaused ? "session-status-paused" : "session-status-lobby"}`}>
              {sessionStatusLabel(session)}
            </span>
          </span>
          <h1>{session.quiz?.title || "جلسة لايف"}</h1>
          <p>
            {session.quiz?.questionCount || 0} سؤال · كود الانضمام{" "}
            <strong dir="ltr">{session.joinCode}</strong>
          </p>
        </div>

        <div className="heading-meta">
          <span className={`session-connection ${connected ? "is-online" : "is-offline"}`}>
            {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {connectionLabel(connection)}
          </span>
          <button
            type="button"
            className="button button-primary turquoise"
            onClick={handleCopy}
          >
            {copied ? <ClipboardCheck size={16} /> : <Copy size={16} />}
            {copied ? "اتنسخ اللينك" : "انسخ لينك الطلاب"}
          </button>
          {isFinished && (
            <button
              type="button"
              className="button button-primary ghost"
              onClick={() => navigate(`/reports/${session.id}`)}
            >
              <BarChart3 size={16} /> تقرير الجلسة
            </button>
          )}
        </div>
      </header>

      {(error || actionError) && (
        <p className="error-alert session-alert">
          {actionError || error}
          {actionError && (
            <button
              type="button"
              className="session-alert-close"
              onClick={clearActionError}
              aria-label="إغلاق التنبيه"
            >
              ×
            </button>
          )}
        </p>
      )}

      <main className="session-live-layout">
        <section className="card stack-card session-live-main">
          {isLobby && (
            <div className="join-code-card">
              <span className="card-eyebrow">كود الانضمام</span>
              <strong className="join-code-value" dir="ltr">
                {session.joinCode}
              </strong>
              <p className="card-description">
                الطلاب يفتحوا لينك الجلسة أو يدخلوا الكود من صفحة الانضمام.
              </p>
              <div className="join-code-actions">
                {canControl && (
                  <button
                    type="button"
                    className="button button-primary white"
                    onClick={() => live.setJoinOpen(!session.joinOpen)}
                    disabled={busyAction === "joinLock" || !connected}
                  >
                    {session.joinOpen ? <Lock size={15} /> : <Unlock size={15} />}
                    {session.joinOpen ? "اقفل الانضمام" : "افتح الانضمام"}
                  </button>
                )}
                <span className={`status-badge ${session.joinOpen ? "session-status-live" : "session-status-paused"}`}>
                  {session.joinOpen ? "الانضمام مفتوح" : "الانضمام مقفول"}
                </span>
                <span className="status-badge status-badge-inactive">
                  <Users className="me-1" size={11} />
                  {participants.length} طالب
                </span>
              </div>
            </div>
          )}

          {!isLobby && !isFinished && (
            <div className="session-phase-head">
              <div>
                <span className="card-eyebrow">المرحلة الحالية</span>
                <h2 className="session-phase-label">
                  {GAME_STATE_LABELS[session.gameState] || session.gameState}
                </h2>
                <span className="text-muted">
                  سؤال {(session.questionProgress?.current || 0)} من{" "}
                  {session.questionProgress?.total || session.totalQuestions || 0}
                </span>
              </div>
              <span className="session-timer-chip">
                <Timer size={16} />
                {isPaused ? "متوقف" : formatRemaining(remainingMs)}
              </span>
            </div>
          )}

          {question && !isFinished && (
            <div className="session-question">
              <h3 className="session-question-text">{question.text}</h3>
              <div className="session-options">
                {question.options.map((option, index) => {
                  const count = countsByOption.get(option.id) || 0;
                  const correct = option.isCorrect === true;

                  return (
                    <div
                      key={option.id}
                      className={`session-option${correct ? " is-correct" : ""}`}
                    >
                      <span className="session-option-index">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="session-option-text">{option.text}</span>
                      {correct && <Check size={16} />}
                      {(session.gameState === "QUESTION" ||
                        session.gameState === "REVEAL") && (
                        <span className="session-option-count">{count}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="session-question-meta">
                <span className="status-badge status-badge-inactive">
                  {question.points} نقطة
                </span>
                <span className="status-badge status-badge-inactive">
                  <Timer className="me-1" size={11} />
                  {question.timeLimitSec} ثانية
                </span>
                <span className="status-badge status-badge-inactive">
                  أجاب {game?.answerCount ?? 0} /{" "}
                  {game?.questionProgress?.totalPlayers ?? participants.length}
                </span>
              </div>
            </div>
          )}

          {isFinished && (
            <div className="session-finished">
              <Trophy size={28} />
              <div>
                <h2>الجلسة خلصت</h2>
                <p className="card-description">
                  كل النتائج والحضور اتقفلوا. تقدر تفتح التقرير الكامل وتنزّل
                  Excel.
                </p>
              </div>
              <button
                type="button"
                className="button button-primary turquoise"
                onClick={() => navigate(`/reports/${session.id}`)}
              >
                <BarChart3 size={16} /> افتح التقرير
              </button>
            </div>
          )}

          {canControl && (
            <div className="session-controls">
              {isLobby && (
                <button
                  type="button"
                  className="button button-primary turquoise"
                  onClick={live.start}
                  disabled={busyAction === "start" || !connected}
                >
                  <Play size={16} />
                  {busyAction === "start" ? "بنبدأ..." : "ابدأ الجلسة"}
                </button>
              )}

              {isLive && (
                <button
                  type="button"
                  className="button button-primary yellow"
                  onClick={live.pause}
                  disabled={busyAction === "pause" || !connected}
                >
                  <Pause size={16} /> إيقاف مؤقت
                </button>
              )}

              {isPaused && (
                <button
                  type="button"
                  className="button button-primary turquoise"
                  onClick={live.resume}
                  disabled={busyAction === "resume" || !connected}
                >
                  <Play size={16} /> استكمال
                </button>
              )}

              {isLive && session.gameState === "QUESTION" && (
                <button
                  type="button"
                  className="button button-primary white"
                  onClick={live.reveal}
                  disabled={busyAction === "reveal" || !connected}
                >
                  <Check size={16} /> اكشف الإجابة
                </button>
              )}

              {!isLobby && !isFinished && (
                <>
                  <button
                    type="button"
                    className="button button-primary ghost"
                    onClick={live.next}
                    disabled={busyAction === "next" || !connected}
                  >
                    <SkipForward size={16} /> المرحلة التالية
                  </button>
                  <button
                    type="button"
                    className="button button-primary ghost"
                    onClick={live.skip}
                    disabled={busyAction === "skip" || !connected}
                  >
                    تخطي السؤال
                  </button>
                </>
              )}

              {!isFinished && (
                <>
                  {confirmFinish ? (
                    <span className="session-confirm-finish">
                      <span>متأكد إنك عايز تنهي الجلسة؟</span>
                      <button
                        type="button"
                        className="button button-primary red"
                        onClick={async () => {
                          await live.finish();
                          setConfirmFinish(false);
                        }}
                        disabled={busyAction === "finish" || !connected}
                      >
                        <Flag size={15} /> أنهِ الجلسة
                      </button>
                      <button
                        type="button"
                        className="button button-primary ghost"
                        onClick={() => setConfirmFinish(false)}
                      >
                        إلغاء
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="button button-primary red"
                      onClick={() => setConfirmFinish(true)}
                      disabled={busyAction === "finish" || !connected}
                    >
                      <Flag size={16} /> إنهاء الجلسة
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                className="button button-primary ghost"
                onClick={openSettings}
                disabled={isFinished}
              >
                <Settings2 size={16} /> الإعدادات
              </button>
            </div>
          )}
        </section>

        <aside className="session-live-side">
          <section className="card stack-card">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon purple">
                  <Users size={20} />
                </div>
                <div>
                  <span className="card-eyebrow">المشاركين</span>
                  <h2>{participants.length} طالب</h2>
                </div>
              </div>
            </div>

            {participants.length === 0 && (
              <div className="empty-questions">
                <Users size={24} />
                <strong>لسه محدش دخل</strong>
                <span>شير الكود {session.joinCode} مع طلابك.</span>
              </div>
            )}

            {participants.length > 0 && (
              <div className="session-participants">
                {participants.map((participant) => (
                  <div className="session-participant" key={participant.id}>
                    <StudentAvatar avatar={participant.avatar} size={40} />
                    <div className="session-participant-meta">
                      <strong>{participant.nickname || participant.name}</strong>
                      <span>
                        <span
                          className={`presence-dot${participant.connected ? " is-online" : ""}`}
                        />
                        {participant.score || 0} نقطة
                        {participant.streak > 0 && ` · 🔥 ${participant.streak}`}
                      </span>
                    </div>
                    {canControl && !isFinished && (
                      <button
                        type="button"
                        className="small-icon-button red-icon"
                        title="استبعاد الطالب"
                        onClick={() => handleKick(participant)}
                        disabled={busyAction === "kick" || !connected}
                      >
                        <UserX size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card stack-card">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon yellow">
                  <Trophy size={20} />
                </div>
                <div>
                  <span className="card-eyebrow">المتصدرين</span>
                  <h2>الترتيب</h2>
                </div>
              </div>
            </div>

            {leaderboard.length === 0 && (
              <p className="card-description">الترتيب هيظهر بعد أول إجابات.</p>
            )}

            {leaderboard.length > 0 && (
              <div className="session-leaderboard">
                {leaderboard.slice(0, 10).map((entry) => (
                  <div
                    className={`session-lb-row${entry.rank === 1 ? " is-first" : ""}`}
                    key={entry.participantId || `${entry.rank}-${entry.nickname}`}
                  >
                    <span className="session-lb-rank">{entry.rank}</span>
                    <StudentAvatar avatar={entry.avatar} size={30} />
                    <span className="session-lb-name">
                      {entry.nickname || entry.name}
                    </span>
                    <strong>{entry.score}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          {(game?.activeCommand || (game?.commandQueue || []).length > 0) && (
            <section className="card stack-card">
              <div className="card-heading">
                <div className="card-heading-title">
                  <div className="card-icon orange">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <span className="card-eyebrow">الأوامر</span>
                    <h2>دور الأوامر</h2>
                  </div>
                </div>
              </div>

              {game?.activeCommand && (
                <div className="session-command-box is-active">
                  <span className="session-command-chip">
                    {COMMAND_LABELS[String(game.activeCommand.type || "").toLowerCase()] ||
                      game.activeCommand.type}
                  </span>
                  <span>
                    {game.activeCommand.status === "AWAITING_TARGET"
                      ? "بيختار هدف..."
                      : "شغّال"}
                  </span>
                </div>
              )}

              {(game?.commandQueue || []).length > 0 && (
                <div className="session-command-queue">
                  {game.commandQueue.map((command) => (
                    <div className="session-command-box" key={command.id}>
                      <span className="session-command-chip">
                        {COMMAND_LABELS[String(command.type || "").toLowerCase()] ||
                          command.type}
                      </span>
                      <span className="text-muted">في الانتظار</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {settingsOpen && canControl && (
            <section className="card stack-card session-settings">
              <div className="card-heading">
                <div className="card-heading-title">
                  <div className="card-icon turquoise">
                    <Settings2 size={20} />
                  </div>
                  <div>
                    <span className="card-eyebrow">إعدادات الجلسة</span>
                    <h2>الأوامر والمراحل</h2>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-button"
                  onClick={() => setSettingsOpen(false)}
                  aria-label="إغلاق الإعدادات"
                >
                  ×
                </button>
              </div>

              <div className="session-setting-group">
                <strong>الأوامر</strong>
                {COMMAND_KEYS.map((key) => (
                  <label className="session-setting-row" key={key}>
                    <span>{COMMAND_LABELS[key]}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(commandDraft?.[key])}
                      onChange={(event) =>
                        setCommandDraft((prev) => ({
                          ...prev,
                          [key]: event.target.checked,
                        }))
                      }
                    />
                  </label>
                ))}
                <button
                  type="button"
                  className="button button-primary white"
                  onClick={saveCommands}
                  disabled={busyAction === "commandSettings"}
                >
                  حفظ الأوامر
                </button>
              </div>

              <div className="session-setting-group">
                <strong>مدد المراحل (بالثواني)</strong>
                {PHASE_DURATION_FIELDS.map((field) => (
                  <div className="session-setting-row" key={field.key}>
                    <span>{field.label}</span>
                    <input
                      type="number"
                      min="0"
                      max="600"
                      value={phaseDraft?.[field.key] ?? 0}
                      onChange={(event) =>
                        setPhaseDraft((prev) => ({
                          ...prev,
                          [field.key]: event.target.value,
                        }))
                      }
                      aria-label={field.label}
                    />
                  </div>
                ))}

                <strong>ظهور المراحل</strong>
                {PHASE_DURATION_FIELDS.map((field) => (
                  <label className="session-setting-row" key={field.visibility}>
                    <span>{field.label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(phaseDraft?.[field.visibility])}
                      onChange={(event) =>
                        setPhaseDraft((prev) => ({
                          ...prev,
                          [field.visibility]: event.target.checked,
                        }))
                      }
                    />
                  </label>
                ))}

                <button
                  type="button"
                  className="button button-primary white"
                  onClick={savePhases}
                  disabled={busyAction === "phaseSettings"}
                >
                  حفظ المراحل
                </button>
              </div>

              {settingsError && <p className="error-alert">{settingsError}</p>}
            </section>
          )}

          {!settingsOpen && canControl && !isFinished && (
            <button
              type="button"
              className="button button-primary ghost"
              onClick={openSettings}
            >
              <Settings2 size={16} /> إعدادات الأوامر والمراحل
            </button>
          )}
        </aside>
      </main>
    </div>
  );
}
