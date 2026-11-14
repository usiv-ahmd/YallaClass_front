// src/pages/StudentSessionPage.jsx
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Timer, Trophy, Users } from "lucide-react";
import { usePlayerSession } from "../hooks/usePlayerSession";
import Loading from "../components/ui/Loading.jsx";
import CommandTargetPicker from "../components/modals/CommandTargetPicker.jsx";
import QuestionPanel from "../components/student/QuestionPanel.jsx";
import ShoushaCharacter from "../components/student/ShoushaCharacter.jsx";
import LeaderboardPopup from "../components/student/LeaderboardPopup.jsx";

const STATE_LABEL = { lobby: "اللوبي", countdown: "استعد", question: "السؤال شغال", paused: "متوقف مؤقتًا", reveal: "المراجعة", explanation: "الشرح", leaderboard: "المتصدرين", finished: "خلصت" };

export default function StudentSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const p = usePlayerSession(sessionId);

  const [targetingCmd, setTargetingCmd] = useState(null);
  const [cmdPending, setCmdPending] = useState(false);
  const [cmdError, setCmdError] = useState(null);

  const handleCommandClick = async (cmd) => {
    setCmdError(null);
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
          <p>مش لاقيينك في الجلسة دي. انضم بكود الحصة.</p>
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
            <div className="chip session-code" title="نقاطك ×2 في السؤال ده">
              <small>مفعّل</small>
              <b>🚀 ×2</b>
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
          {state === "lobby" && (
            <section className="screen card stack-card text-center">
              <div className="state-icon mx-auto">
                <Users size={42} />
              </div>
              <h2>مستنيين المدرس يبدأ</h2>
              <p>{p.students.length} طالب في اللوبي</p>
            </section>
          )}

          {state === "countdown" && (
            <section className="card stack-card text-center">
              <div className="state-icon mx-auto">
                <Timer size={42} />
              </div>
              <h2>استعد...</h2>
            </section>
          )}

          {["question", "paused", "reveal", "explanation"].includes(state) && q && (
            <section className="screen card stack-card">
              <div className="student-question" data-live-state={state} data-answer-state={answer ? (answer.resultState ?? (answer.isCorrect ? "correct" : "wrong")) : ["reveal", "explanation", "leaderboard"].includes(state) ? "reveal" : "pending"}>
                <QuestionPanel currentAnswer={answer} currentQuestion={q} duration={q.duration} freshStudent={p.student} liveState={state} questionIndex={p.currentQuestionIndex} questions={s.questions || []} session={s} timeLeft={p.timeLeft} totalStudents={p.students.length} onChoose={handleAnswer} />
              </div>

              {state === "question" && (
                <div className="commands-panel">
                  <div className="commands-label">
                    أوامر اللعب
                  </div>
                  <div className="type-selector commands-grid-3">
                    {["gift", "thief", "rocket"].map((cmd) => {
                      const rules = p.commandRules?.[cmd];
                      const used = p.commandsUsed?.[cmd] || 0;
                      const disabled = !p.canUseCommand(cmd) || cmdPending;
                      return (
                        <button className={`type-chip${p.canUseCommand(cmd) ? " selected" : ""}`} disabled={disabled} title={used >= (rules?.maxUses ?? 1) ? "استخدمته بالحد الأقصى" : !p.commandsEnabled?.[cmd] ? "الأمر مش مفعل في الجلسة" : rules?.label} type="button" onClick={() => handleCommandClick(cmd)} key={cmd}>
                          <span className="emoji-lg">
                            {rules?.emoji}
                          </span>
                          <span>
                            {rules?.label}
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
              )}
            </section>
          )}

          {state === "finished" && (
            <section className="card stack-card text-center">
              <div className="state-icon mx-auto">
                <Trophy size={42} />
              </div>
              <h2>خلصت الحصة!</h2>
              <p>
                نتيجتك: <b>{p.student.score}</b> نقطة
              </p>
              <p>
                صح: {p.student.correctAnswers} · غلط: {p.student.wrongAnswers} · ترتيبك: #{p.student.rank}
              </p>
            </section>
          )}
        </div>
      </main>

      {state === "leaderboard" && (
        <LeaderboardPopup currentQuestionIndex={p.currentQuestionIndex} me={p.student} players={p.leaderboard} />
      )}

      {targetingCmd && (
        <CommandTargetPicker command={targetingCmd} emoji={p.commandRules[targetingCmd].emoji} isPending={cmdPending} label={p.commandRules[targetingCmd].label} players={p.students} selfId={p.student.id} onClose={() => setTargetingCmd(null)} onConfirm={handleConfirmTarget} />
      )}
    </div>
  );
}