// src/pages/StudentSessionPage.jsx
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Timer, Trophy, Users, Zap, X, Gift, VenetianMask, Rocket } from "lucide-react";
import { usePlayerSession } from "../hooks/usePlayerSession";
import Loading from "../components/ui/Loading.jsx";
import CommandTargetPicker from "../components/modals/CommandTargetPicker.jsx";
import QuestionPanel from "../components/student/QuestionPanel.jsx";
import ShoushaCharacter from "../components/student/ShoushaCharacter.jsx";
import LeaderboardPopup from "../components/student/LeaderboardPopup.jsx";

const STATE_LABEL = { lobby: "اللوبي", countdown: "استعد", question: "السؤال شغال", paused: "متوقف مؤقتًا", reveal: "المراجعة", explanation: "الشرح", leaderboard: "المتصدرين", finished: "خلصت" };

const COMMAND_ICONS = {
  gift: <Gift size={20} />,
  thief: <VenetianMask size={20} />,
  rocket: <Rocket size={20} />,
};

export default function StudentSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const p = usePlayerSession(sessionId);

  const [isCommandsOpen, setIsCommandsOpen] = useState(false);
  const [targetingCmd, setTargetingCmd] = useState(null);
  const [cmdPending, setCmdPending] = useState(false);
  const [cmdError, setCmdError] = useState(null);

  const handleCommandClick = async (cmd) => {
    setCmdError(null);
    setIsCommandsOpen(false);
    const rules = p.commandRules?.[cmd];
    if (!rules) return;
    if (rules.requiresTarget) {
      setTargetingCmd(cmd);
    } else {
      setCmdPending(true);
      try {
        await p.useCommand(cmd);
      } catch (e) {
        setCmdError(e.message || "تعذّر استخدام الأمر");
      } finally {
        setCmdPending(false);
      }
    }
  };

  const handleConfirmTarget = async (targetId) => {
    if (!targetingCmd) return;
    setCmdPending(true);
    setCmdError(null);
    try {
      await p.useCommand(targetingCmd, targetId);
      setTargetingCmd(null);
    } catch (e) {
      setCmdError(e.message || "تعذّر استخدام الأمر");
    } finally {
      setCmdPending(false);
    }
  };

  const handleAnswer = async (idx) => {
    try {
      await p.submitAnswer(idx);
    } catch (e) {
      alert(e.message || "تعذّر إرسال الإجابة");
    }
  };

  const handleLeave = async () => {
    if (!window.confirm("خروج من الحصة؟")) return;
    await p.leave();
    navigate("/join");
  };

  if (p.loading) {
    return (
      <div className="page">
        <Loading description="ثانية" title="بنحمّل الحصة..." />
      </div>
    );
  }

  if (!p.session) {
    return (
      <div className="page">
        <div className="card stack-card">
          <p className="error-alert">
            {p.error || "الحصة مش موجودة"}
          </p>
          <Link className="button button-primary turquoise" to="/join">
            <ArrowLeft size={16} /> رجوع
          </Link>
        </div>
      </div>
    );
  }

  if (!p.student) {
    return (
      <div className="page">
        <div className="card stack-card">
          <p>
            مش لاقيينك في الجلسة دي. انضم بكود الحصة.
          </p>
          <Link className="button button-primary turquoise" to="/join">
            <ArrowLeft size={16} /> انضم
          </Link>
        </div>
      </div>
    );
  }

  const s = p.session;
  const q = p.currentQuestion;
  const state = p.liveState;
  const answer = p.currentAnswer;

  return (
    <div className="page">
      <header className="card page-heading">
        <div className="session-header-user">
          <ShoushaCharacter hairColor={p.student.avatar?.hairColor} size={130} title={`شوشة ${p.student.nickname || p.student.name}`} />
          <div className="min-w-0">
            <span className="page-eyebrow">
              <Users size={13} /> {s.title}
            </span>
            <h1 className="mt-8">
              أهلاً {p.student.nickname || p.student.name}!
            </h1>
            <p>
              {STATE_LABEL[state] || state}
            </p>
          </div>
        </div>
        <div className="heading-meta">
          {p.rocketActive && (
            <div className="chip session-code" title="نقاطك -50% في السؤال ده">
              <b><Rocket size={16} /> -50%</b>
            </div>
          )}
          {p.myRank && (
            <div className="chip session-code">
              <small>ترتيبك</small>
              <b>#{p.myRank}</b>
            </div>
          )}

          <button className="button button-primary ghost" onClick={handleLeave}>
            <ArrowLeft size={15} /> خروج
          </button>
        </div>
      </header>

      <main className="dashboard">
        <div className="layout col-layout">
          <div className="screen card stack-card">
            <div className="student-question" data-answer-state={answer ? (answer.resultState ?? (answer.isCorrect ? "correct" : "wrong")) : ["reveal", "explanation", "leaderboard"].includes(state) ? "reveal" : "pending"} data-live-state={state}>
              {state === "lobby" && (
                <div className="main-screen">
                  <div className="state-icon">
                    <Users size={42} />
                  </div>
                  <h2>مستنيين المدرس يبدأ...</h2>
                  <p>
                    {p.students.length} طالب في اللوبي
                  </p>
                  <div className="state-pulse" />
                </div>
              )}

              {state === "countdown" && (
                <div className="main-screen">
                  <div className="countdown-badge">
                    <Timer size={14} /> العد التمهيدي
                  </div>
                  <div className="countdown-number" key={p.countdownRemaining}>
                    {p.countdownRemaining > 0 ? p.countdownRemaining : "يلا!"}
                  </div>
                  <p>استعد...</p>
                </div>
              )}

              {["question", "paused", "reveal", "explanation"].includes(state) && q && (
                <>
                  <QuestionPanel currentAnswer={answer} currentQuestion={q} duration={q.duration} freshStudent={p.student} liveState={state} onChoose={handleAnswer} questionIndex={p.currentQuestionIndex} questions={s.questions || []} session={s} timeLeft={p.timeLeft} totalStudents={p.students.length} />

                  {state === "question" && (
                    <div className="commands-action-wrap">
                      <button className="button button-primary yellow commands-action-btn" onClick={() => setIsCommandsOpen(true)}>
                        <Zap size={18} /> أوامر اللعب
                      </button>
                    </div>
                  )}
                </>
              )}

              {state === "finished" && (
                <div className="main-screen">
                  <div className="state-icon">
                    <Trophy size={42} />
                  </div>
                  <h2>خلصت الحصة!</h2>
                  <p>
                    نتيجتك: <b>{p.student.score}</b> نقطة
                  </p>
                  <p>
                    صح: {p.student.correctAnswers} · غلط: {p.student.wrongAnswers} · ترتيبك: #{p.student.rank}
                  </p>
                  <div className="state-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {state === "leaderboard" && (
        <LeaderboardPopup currentQuestionIndex={p.currentQuestionIndex} me={p.student} players={p.leaderboard} />
      )}

      {targetingCmd && (
        <CommandTargetPicker command={targetingCmd} emoji={COMMAND_ICONS[targetingCmd]} isPending={cmdPending} label={p.commandRules[targetingCmd].label} onClose={() => setTargetingCmd(null)} onConfirm={handleConfirmTarget} players={p.students} selfId={p.student.id} />
      )}

      {isCommandsOpen && (
        <div className="opened-window-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setIsCommandsOpen(false)} role="presentation">
          <section aria-modal="true" className="card modal-window" role="dialog">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon yellow">
                  <Zap size={22} />
                </div>
                <div>
                  <span className="card-kicker">
                    أوامر اللعب
                  </span>
                  <h2 className="modal-title">
                    اختار أمر
                  </h2>
                </div>
              </div>
              <button aria-label="إغلاق" className="modal-close-button" onClick={() => setIsCommandsOpen(false)} type="button">
                <X size={17} />
              </button>
            </div>

            <div className="modal-content">
              <div className="type-selector commands-grid-3">
                {["gift", "thief", "rocket"].map((cmd) => {
                  const rules = p.commandRules?.[cmd];
                  const used = p.commandsUsed?.[cmd] || 0;
                  const disabled = !p.canUseCommand(cmd) || cmdPending;
                  return (
                    <button className={`type-chip${p.canUseCommand(cmd) ? " selected" : ""}`} disabled={disabled} key={cmd} onClick={() => handleCommandClick(cmd)} title={used >= (rules?.maxUses ?? 1) ? "استخدمته بالحد الأقصى" : !p.commandsEnabled?.[cmd] ? "الأمر مش مفعل في الجلسة" : rules?.label} type="button">
                      <span className="flex-center-gap-8">
                        {COMMAND_ICONS[cmd]}
                        <span>{rules?.label}</span>
                      </span>
                      {used > 0 && (
                        <small className="chip-badge">
                          ✓
                        </small>
                      )}
                    </button>
                  );
                })}
              </div>

              {cmdError && (
                <p className="error-alert mt-8">
                  {cmdError}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}