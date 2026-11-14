// src/pages/SessionDetailPage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check, ClipboardList, Clock3, Copy, Eye, Flag, Lock, Pause, Play, Sparkles, Square, Timer, Trophy, Unlock, UserX, Users, Zap, BarChart3 } from "lucide-react";
import { useSessionLive } from "../hooks/useSessionLive";
import Loading from "../components/ui/Loading.jsx";
import ShoushaCharacter from "../components/student/ShoushaCharacter.jsx";

const ANSWER_COLORS = ["purple", "blue", "orange", "pink", "cyan", "lime"];
const STATE_LABEL = { lobby: "لوبي", countdown: "عد تنازلي", question: "سؤال", paused: "متوقف", reveal: "المراجعة", explanation: "شرح", leaderboard: "متصدرين", finished: "خلصت" };

export default function SessionDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const live = useSessionLive(sessionId);

  const [countdown, setCountdown] = useState(3);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(live.session.code);
      alert("اتنسخ الكود");
    } catch {
      prompt("انسخ الكود:", live.session.code);
    }
  };

  const handleEnd = async () => {
    setConfirmEndOpen(false);
    try {
      await live.end();
      navigate("/sessions");
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    if (live.liveState !== "countdown") return;
    setCountdown(3);
    const i = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(i);
          live.startQuestion();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [live.liveState]);

  useEffect(() => {
    if (live.liveState !== "question") return;
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, [live.liveState]);

  if (live.loading) {
    return (
      <div className="page">
        <Loading description="ثانية" title="بنحمّل الجلسة..." />
      </div>
    );
  }

  if (live.error || !live.session) {
    return (
      <div className="page">
        <div className="card stack-card">
          <p className="error-alert">
            {live.error || "الجلسة مش موجودة"}
          </p>
          <button className="button button-primary turquoise" onClick={() => navigate("/sessions")}>
            <ArrowRight size={16} /> رجوع
          </button>
        </div>
      </div>
    );
  }

  const s = live.session;
  const q = live.currentQuestion;
  const isLast = live.isLastQuestion;
  const inQuestionStates = ["question", "paused", "reveal", "explanation", "leaderboard"].includes(live.liveState);
  const showAnswerReveal = ["reveal", "explanation", "leaderboard"].includes(live.liveState);
  const progress = q ? Math.min(1, live.timeLeft / q.duration) : 0;

  const qType = String(q?.type ?? q?.questionType ?? "").toLowerCase();
  const isTf = !!q && (["tf", "true-false", "true_false", "boolean"].includes(qType) || (!q.type && q.options?.length === 2));
  const isMcq = !!q && (["mcq", "multiple-choice", "multiple_choice", "multi"].includes(qType) || (!q.type && (q.options?.length ?? 0) > 2));

  return (
    <div className="page">
      <header className="card page-heading">
        <div>
          <span className="page-eyebrow">
            {STATE_LABEL[live.liveState]}
          </span>
          <h1>
            {s.title}
          </h1>
          <p>
            {s.subject} · {live.students.length} طالب
          </p>
        </div>
        <div className="heading-meta">
          <div className="chip session-code">
            <small>كود</small>
            <b>{s.code}</b>
          </div>
          <button className="button button-primary ghost" onClick={copyCode}>
            <Copy size={15} /> نسخ
          </button>
          {s.finishedAt && (
            <Link className="button button-primary ghost" to={`/reports/${s.id}`}>
              <BarChart3 size={15} /> التقرير
            </Link>
          )}
          <button className="button button-primary red" onClick={() => setConfirmEndOpen(true)}>
            <Square size={15} /> إنهاء
          </button>
        </div>
      </header>

      <main className="dashboard">
        <div className="layout">
          <div className="workspace">
            {live.liveState === "lobby" && (
              <section className={`${live.students.length === 0 ? "screen " : ""} card stack-card single-card`}>
                <div className="card-heading">
                  <div className="card-heading-title">
                    <div className="card-icon turquoise">
                      <Users size={22} />
                    </div>
                    <div>
                      <span className="card-eyebrow">
                        {live.students.length} طالب
                      </span>
                      <h2>
                        غرفة الانتظار
                      </h2>
                    </div>
                  </div>
                  <div className="flex-wrap-gap-8">
                    <button className={`button button-primary ${live.allowJoining ? "ghost" : "turquoise"}`} onClick={() => live.lockJoining(!live.allowJoining)}>
                      {live.allowJoining ? (
                        <>
                          <Lock size={15} /> اقفل
                        </>
                      ) : (
                        <>
                          <Unlock size={15} /> افتح
                        </>
                      )}
                    </button>
                    <button className="button button-primary turquoise" disabled={live.busy || live.students.length === 0} onClick={live.start}>
                      <Play size={15} /> ابدأ الحصة
                    </button>
                  </div>
                </div>

                {live.students.length === 0 ? (
                  <div className="student-question">
                    <div className="main-screen">
                      <div className="state-icon">
                        <Users size={42} />
                      </div>
                      <h2>
                        مستنيين الطلاب
                      </h2>
                      <p>
                        شير كود {s.code} مع طلابك.
                      </p>
                      <div className="state-pulse" />
                    </div>
                  </div>
                ) : (
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>الاسم</th>
                        <th>الحالة</th>
                        <th>إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {live.students.map((st, i) => (
                        <tr key={st.id}>
                          <td>{i + 1}</td>
                          <td>
                            <div className="flex-center-gap-8">
                              <ShoushaCharacter hairColor={st.avatar?.hairColor} mode="avatar" size={30} title={`شوشة ${st.name}`} />
                              <span>
                                {st.name}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="status-badge status-badge-inactive">
                              جاهز
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button className="button icon-button red-icon" onClick={() => live.kickStudent(st.id)}>
                              <UserX size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            )}

            {live.liveState === "countdown" && (
              <section className="screen card stack-card">
                <div className="student-question">
                  <div className="main-screen">
                    <span className="countdown-badge">
                      <Timer size={14} /> العدّ التمهيدي
                    </span>
                    <div className="countdown-number">
                      {countdown}
                    </div>
                    <p>
                      استعدّوا... السؤال جاي
                    </p>
                    <div className="state-pulse" />
                  </div>
                </div>
              </section>
            )}

            {inQuestionStates && q && (
              <section className="screen card stack-card">
                <div className="student-question">
                  {live.liveState === "paused" && (
                    <div className="session-status status-paused">
                      <i /> موقوف مؤقتًا
                    </div>
                  )}

                  <div className="question-meta-row">
                    <span className="mini-label">
                      {isTf ? "صح ولا غلط" : isMcq ? "اختيار من متعدد" : "سؤال"}
                    </span>
                    {q.weight > 0 && (
                      <span className="stat-chip chip-weight">
                        <Zap size={14} /> {q.weight} <small>نقطة</small>
                      </span>
                    )}
                  </div>

                  <div className="question-progress" style={{ "--total": live.totalQuestions }}>
                    {Array.from({ length: live.totalQuestions }, (_, i) => (
                      <span className={"question-progress-step student-step" + (i < live.currentQuestionIndex ? " is-done" : "") + (i === live.currentQuestionIndex ? " is-current" : "")} key={i} />
                    ))}
                  </div>

                  <div className="question-main-row">
                    <div className="question-copy">
                      <h2>
                        {q.text}
                      </h2>
                    </div>
                    <div className={`timer-ring ${progress <= 0.25 ? "is-danger" : progress <= 0.5 ? "is-warning" : ""}`} role="timer" style={{ "--timer-angle": `${progress * 360}deg` }}>
                      <div className="timer-ring-inner">
                        <Clock3 size={15} />
                        <strong>
                          {Math.ceil(live.timeLeft)}
                        </strong>
                        <small>
                          ث
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="answer-prompt">
                    <Sparkles size={18} />
                    <span>
                      {isTf ? "صح ولا غلط؟" : "الإجابات"}
                    </span>
                  </div>

                  <div className={`answer-grid${isTf ? " answer-grid--tf" : ""}`}>
                    {q.options.map((opt, idx) => {
                      const isCorrect = idx === q.correctOptionIndex;
                      const showAsCorrect = showAnswerReveal && isCorrect;
                      const showAsMuted = showAnswerReveal && !isCorrect;
                      const colorClass = isTf
                        ? (idx === 0 ? " pink " : " purple ")
                        : ` ${ANSWER_COLORS[idx % ANSWER_COLORS.length]}`;
                      const tfClass = isTf ? " answer-option--tf " : "";
                      return (
                        <div className={`answer-option${tfClass}${colorClass}${showAsCorrect ? " answer-option-correct" : ""}${showAsMuted ? " answer-option-muted" : ""}`} key={idx}>
                          <span className="answer-option-key">
                            {showAsCorrect ? <Check size={19} /> : String.fromCharCode(65 + idx)}
                          </span>
                          <span className="answer-option-text">
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {inQuestionStates && (
                  <div className="live-control">
                    {live.liveState === "question" && (
                      <button className="button button-primary ghost" disabled={live.busy} onClick={live.pause}>
                        <Pause size={15} /> إيقاف
                      </button>
                    )}
                    {live.liveState === "paused" && (
                      <button className="button button-primary turquoise" disabled={live.busy} onClick={live.resume}>
                        <Play size={15} /> استئناف
                      </button>
                    )}
                    {["question", "paused"].includes(live.liveState) && (
                      <button className="button button-primary turquoise" disabled={live.busy} onClick={live.reveal}>
                        <Eye size={15} /> اعرض الإجابة
                      </button>
                    )}
                    {live.liveState === "reveal" && q?.explanation && (
                      <button className="button button-primary ghost" disabled={live.busy} onClick={live.showExplanation}>
                        <Sparkles size={15} /> الشرح
                      </button>
                    )}
                    {["reveal", "explanation"].includes(live.liveState) && (
                      <button className="button button-primary ghost" disabled={live.busy} onClick={live.showLeaderboard}>
                        <Trophy size={15} /> المتصدرين
                      </button>
                    )}
                    {["reveal", "explanation", "leaderboard"].includes(live.liveState) && (
                      <button className="button button-primary turquoise" disabled={live.busy} onClick={isLast ? live.finishRound : live.next}>
                        {isLast ? (
                          <>
                            <Check size={15} /> خلّص الجولة
                          </>
                        ) : (
                          <>
                            <ArrowRight size={15} /> السؤال التالي
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </section>
            )}

            {showAnswerReveal && live.students.length > 0 && (
              <div className="card single-card stack-card">
                <div className="card-heading">
                  <div className="card-heading-title">
                    <div className="card-icon small-card-icon blue">
                      <ClipboardList size={19} />
                    </div>
                    <div>
                      <h2>
                        الترتيب الحالي
                      </h2>
                    </div>
                  </div>
                </div>
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>الاسم</th>
                      <th>النقاط</th>
                      <th>الستريك</th>
                    </tr>
                  </thead>
                  <tbody>
                    {live.students.slice(0, 10).map((st) => (
                      <tr key={st.id}>
                        <td>{st.rank}</td>
                        <td>
                          <div className="flex-center-gap-8">
                            <ShoushaCharacter hairColor={st.avatar?.hairColor} mode="avatar" size={30} title={`شوشة ${st.name}`} />
                            <span>
                              {st.name}
                            </span>
                          </div>
                        </td>
                        <td>{st.score}</td>
                        <td>🔥 {st.highestStreak}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {live.liveState === "finished" && (
              <section className="screen card stack-card text-center">
                <div className="student-question">
                  <div className="main-screen">
                    <div className="state-icon">
                      <Flag size={48} />
                    </div>
                    <h2>
                      خلصت الجولة!
                    </h2>
                    <p>
                      كل الأسئلة خلصت. تقدر تقفل الجلسة.
                    </p>
                    <div className="state-pulse" />
                  </div>
                </div>

                <div className="live-control">
                  <button className="button button-primary red" onClick={handleEnd}>
                    <Square size={15} /> إنهاء الجلسة
                  </button>
                </div>
              </section>
            )}

            {live.actionError && (
              <div>
                <p className="error-alert">
                  {live.actionError}
                </p>
              </div>
            )}

            {s.events && s.events.length > 0 && (
              <section className="card single-card stack-card">
                <div className="card-heading">
                  <div className="card-heading-title">
                    <div className="card-icon yellow emoji-xl">
                      ⚡
                    </div>
                    <div>
                      <span className="card-eyebrow">
                        {s.events.length} حدث
                      </span>
                      <h2>
                        أحداث الجلسة
                      </h2>
                    </div>
                  </div>
                </div>

                <ol className="live-questions-list session-events-list">
                  {s.events
                    .slice()
                    .reverse()
                    .slice(0, 20)
                    .map((ev) => {
                      const cmd = String(ev.type).replace("command:", "");
                      const icon = cmd === "gift" ? "🎁" : cmd === "thief" ? "🥷" : cmd === "rocket" ? "🚀" : "•";
                      return (
                        <li className="session-events-item" key={ev.id}>
                          <span className="session-events-emoji">
                            {icon}
                          </span>
                          <div className="session-events-body">
                            <div className="session-events-actor">
                              {ev.actorName}
                              {ev.targetName && ` → ${ev.targetName}`}
                            </div>
                            <div className="session-events-meta">
                              {cmd === "gift" && `+${ev.value} نقطة`}
                              {cmd === "thief" && `سرق ${ev.value} نقطة`}
                              {cmd === "rocket" && `×${ev.value} على السؤال الجاي`}
                              {" · "}
                              {new Date(ev.createdAt).toLocaleTimeString("ar-EG")}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ol>
              </section>
            )}
          </div>
        </div>
      </main>

      {confirmEndOpen && (
        <div className="opened-window-backdrop" onClick={() => setConfirmEndOpen(false)}>
          <section className="card modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon red">
                  <Square size={22} />
                </div>
                <div>
                  <span className="card-kicker">
                    تأكيد
                  </span>
                  <h2 className="modal-title">
                    إنهاء الجلسة
                  </h2>
                </div>
              </div>
            </div>
            <div className="modal-content">
              <p>
                إنهاء الجلسة نهائيًا؟ هيتحسب الحضور ومش هتقدر ترجع.
              </p>
              <div className="modal-actions">
                <button className="button modal-button white" onClick={() => setConfirmEndOpen(false)}>
                  إلغاء
                </button>
                <button className="button modal-button red" onClick={handleEnd}>
                  نعم، أنهِ
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}