// src/pages/StudentSessionPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

import { usePlayerSession } from "../hooks/usePlayerSession";
import { CONNECTION_STATUS } from "../realtime/events";
import StudentJoinPage from "./StudentJoinPage.jsx";
import CommandTargetPicker from "../components/modals/CommandTargetPicker.jsx";
import QuestionPanel from "../components/student/QuestionPanel.jsx";
import StudentAvatar from "../components/student/StudentAvatar.jsx";
import Loading from "../components/ui/Loading.jsx";
import "../styles/student-page.css";

const COMMAND_LABELS = {
  gift: "هدية",
  thief: "سرقة",
  rocket: "صاروخ",
};

const COMMAND_EMOJI = {
  gift: "🎁",
  thief: "🥷",
  rocket: "🚀",
};

export default function StudentSessionPage() {
  const { code: routeCode } = useParams();
  const code = String(routeCode || "").trim().toUpperCase();
  const navigate = useNavigate();
  const session = usePlayerSession(code);

  const [targetPickerOpen, setTargetPickerOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);

  const {
    publicSession,
    participant,
    game,
    loading,
    error,
    actionError,
    clearActionError,
    connection,
    remainingMs,
    kicked,
    answer,
    selectTarget,
    leave,
  } = session;

  useEffect(() => {
    if (kicked) {
      // The hook already cleared storage; nothing else to do here.
    }
  }, [kicked]);

  const isQuestionPhase =
    game?.gameState === "QUESTION" || game?.gameState === "REVEAL";
  const isPaused = game?.status === "PAUSED";
  const isFinished = game?.status === "FINISHED";

  const yourCommand = game?.yourCommand || null;
  const activeCommand = game?.activeCommand || null;
  const commandTargets = game?.commandTargets || [];

  const leaderboard = game?.leaderboard || [];

  const selectedOptionId = game?.yourAnswer?.selectedOptionId || null;
  const submitted = Boolean(game?.yourAnswer);

  const handleChoose = (optionId) => {
    if (submitted) return;
    answer(optionId);
  };

  const handleSelectTarget = async (targetId) => {
    setSelectedTarget(targetId);
    await selectTarget(targetId);
    setTargetPickerOpen(false);
    setSelectedTarget(null);
  };

  useEffect(() => {
    if (
      yourCommand?.status === "AWAITING_TARGET" &&
      (yourCommand.type === "THIEF" || yourCommand.type === "ROCKET" || yourCommand.type === "GIFT")
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTargetPickerOpen(true);
    } else {
      setTargetPickerOpen(false);
    }
  }, [yourCommand?.commandId, yourCommand?.status, yourCommand?.type]);

  if (loading && !game && !publicSession) {
    return (
      <div className="page">
        <Loading title="بنحمّل الجلسة..." description="ثانية" />
      </div>
    );
  }

  if (!participant) {
    return <StudentJoinPage />;
  }

  if (kicked) {
    return (
      <div className="page">
        <section className="card stack-card single-card">
          <h1>تم استبعادك من الجلسة</h1>
          <p className="card-description">
            المدرس استبعدك من هذه الجلسة. تقدر الانضمام بجلسة جديدة بكود آخر.
          </p>
          <button
            type="button"
            className="button button-primary turquoise"
            onClick={() => {
              leave();
              navigate("/join");
            }}
          >
            رجوع للانضمام
          </button>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <section className="card stack-card single-card">
          <p className="error-alert">{error}</p>
          <button
            type="button"
            className="button button-primary ghost"
            onClick={() => navigate("/join")}
          >
            <ArrowLeft size={16} /> رجوع
          </button>
        </section>
      </div>
    );
  }


  return (
    <div className="page student-session-page">
      <header className="card page-heading">
        <div>
          <span className="page-eyebrow">
            <Users size={13} /> جلسة لايف
          </span>
          <h1>{publicSession?.quiz?.title || "جلسة لايف"}</h1>
          <p>
            {participant.nickname || participant.name} · كود{" "}
            <strong dir="ltr">{code}</strong>
          </p>
        </div>
        <div className="heading-meta">
          <span
            className={`session-connection ${
              connection === CONNECTION_STATUS.CONNECTED ? "is-online" : "is-offline"
            }`}
          >
            {connection === CONNECTION_STATUS.CONNECTED ? (
              <Wifi size={14} />
            ) : (
              <WifiOff size={14} />
            )}
            {connection === CONNECTION_STATUS.CONNECTED ? "متصل" : "غير متصل"}
          </span>
          <button
            type="button"
            className="button button-primary ghost"
            onClick={() => {
              leave();
              navigate("/join");
            }}
          >
            <ArrowLeft size={16} /> خروج
          </button>
        </div>
      </header>

      {actionError && (
        <p className="error-alert session-alert">
          {actionError}
          <button
            type="button"
            className="session-alert-close"
            onClick={clearActionError}
            aria-label="إغلاق التنبيه"
          >
            ×
          </button>
        </p>
      )}

      <main className="dashboard">
        {isFinished ? (
          <section className="card stack-card">
            <div className="session-finished">
              <Trophy size={28} />
              <div>
                <h2>الجلسة خلصت</h2>
                <p className="card-description">
                  نتائجك: {game?.you?.score || participant.score || 0} نقطة · مرتبة{" "}
                  {game?.you?.rank || "—"}
                </p>
              </div>
            </div>

            {leaderboard.length > 0 && (
              <div className="session-leaderboard">
                {leaderboard.map((entry) => (
                  <div
                    className={`session-lb-row${
                      entry.participantId === participant.id ? " is-first" : ""
                    }`}
                    key={entry.participantId}
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
        ) : game?.gameState === "IDLE" || game?.gameState === "COUNTDOWN" ? (
          <section className="card stack-card single-card">
            <div className="join-code-card">
              <span className="card-eyebrow">بانتظار المدرس</span>
              <strong className="join-code-value" dir="ltr">
                {code}
              </strong>
              <p className="card-description">
                أنت في اللوبي. المدرس يبدأ الجلسة قريباً.
              </p>
              <div className="session-card-meta">
                <span className="status-badge status-badge-inactive">
                  <Users className="me-1" size={11} />
                  {game?.questionProgress?.totalPlayers || publicSession?.participantCount || 0}
                </span>
                <span className="status-badge status-badge-inactive">
                  {participant.nickname || participant.name}
                </span>
              </div>
            </div>
          </section>
        ) : (
          <>
            {isQuestionPhase && game?.question && (
              <QuestionPanel
                question={game.question}
                phase={game.gameState}
                remainingMs={remainingMs}
                selectedOptionId={selectedOptionId}
                answer={game.yourAnswer}
                onChoose={handleChoose}
                disabled={submitted || isPaused}
                totalStudents={game.questionProgress?.totalPlayers || 0}
                answeredCount={game.questionProgress?.answeredCount || 0}
                participant={participant}
                you={game.you}
              />
            )}

            {!isQuestionPhase && (
              <section className="card stack-card">
                <h2 className="session-phase-label">
                  {game?.gameState ? game.gameState : "بانتظار..."}
                </h2>
                <p className="card-description">
                  {game?.gameState === "LEADERBOARD" ||
                  game?.gameState === "PHONE_LEADERBOARD"
                    ? "شاهد الترتيب."
                    : "انتظر المدرس."}
                </p>

                {leaderboard.length > 0 && (
                  <div className="session-leaderboard">
                    {leaderboard.slice(0, 10).map((entry) => (
                      <div
                        className={`session-lb-row${
                          entry.participantId === participant.id ? " is-first" : ""
                        }`}
                        key={entry.participantId}
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
            )}

            {activeCommand && activeCommand.type && (
              <div className="session-command-box is-active">
                <span className="session-command-chip">
                  {COMMAND_LABELS[String(activeCommand.type).toLowerCase()] ||
                    activeCommand.type}
                </span>
                <span>
                  {activeCommand.status === "AWAITING_TARGET"
                    ? "دورك لاختيار هدف"
                    : "شغّال"}
                </span>
              </div>
            )}
          </>
        )}
      </main>

      {targetPickerOpen && yourCommand?.status === "AWAITING_TARGET" && (
        <CommandTargetPicker
          command={String(yourCommand.type || "").toLowerCase()}
          label={COMMAND_LABELS[String(yourCommand.type || "").toLowerCase()]}
          emoji={COMMAND_EMOJI[String(yourCommand.type || "").toLowerCase()]}
          players={commandTargets.map((target, index) => ({
            id: target.participantId,
            name: target.nickname || target.name,
            score: target.score,
            rank: index + 1,
            avatar: { hairColor: target.avatar?.color },
          }))}
          selfId={participant.id}
          onConfirm={handleSelectTarget}
          onClose={() => setTargetPickerOpen(false)}
          isPending={selectedTarget !== null}
        />
      )}
    </div>
  );
}
