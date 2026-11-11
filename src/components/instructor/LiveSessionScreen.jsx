// src/components/instructor/LiveSessionScreen.jsx
import {
  Check, Clock3, Eye, Lock, LogOut, Pause, Play,
  RotateCcw, SkipForward, Sparkles, Timer, Users, X, Zap,
} from "lucide-react";
import { getCorrectIndex } from "../../utils/questions.js";
import { QUESTION_TYPES } from "../../constants/questions.js";
import { ANSWER_COLORS, QUESTION_STATES } from "../../constants/live.js";

export default function LiveSessionScreen({
  live,
  countdown,
  currentQuestion,
  students,
  onOpenReopenModal,
}) {
  const liveState = live.liveState;

  return (
    <section className="live-workspace">
      <section className="screen card">
        <div className="student-question">
          {liveState === "lobby" && (
            <div className="main-screen">
              <div className="state-icon"><Users size={42} /></div>
              <h2>مستنيين الطلاب ينضموا...</h2>
              <p>
                لما تجهز، اضغط <b>ابدأ الحصة</b>. كود الفصل: <b>{live.liveSession?.code ?? "—"}</b>
              </p>
              <div className="state-pulse" />
            </div>
          )}

          {liveState === "countdown" && (
            <div className="main-screen">
              <span className="countdown-badge">
                <Timer size={14} /> العدّ التمهيدي
              </span>
              <div className="countdown-number">{countdown.remaining}</div>
              <p>استعدّوا... السؤال جاي</p>
              <div className="state-pulse" />
            </div>
          )}

          {QUESTION_STATES.includes(liveState) && currentQuestion && (() => {
            const duration     = Number(currentQuestion?.duration) || 30;
            const displayedTime = live.timeLeft;
            const progress     = duration > 0
              ? Math.max(0, Math.min(1, (live.timeLeft ?? 0) / duration))
              : 0;
            const isReveal = liveState === "reveal";

            const type      = currentQuestion.type ?? "mcq";
            const isMcq     = type === "mcq";
            const isTf      = type === "true_false";
            const typeLabel = QUESTION_TYPES[type]?.label ?? type;

            return (
              <>
                {liveState === "paused" && (
                  <div className="session-status status-paused">
                    <i /> موقوف مؤقتًا
                  </div>
                )}

                <div className="question-meta-row">
                  <span className="mini-label">{typeLabel}</span>
                  {currentQuestion.weight > 0 && (
                    <span className="stat-chip chip-weight">
                      <Zap size={14} /> {currentQuestion.weight} <small>نقطة</small>
                    </span>
                  )}
                  {currentQuestion.source === "ai" && (
                    <span className="stat-chip chip-ai">AI</span>
                  )}
                </div>

                <div className="question-main-row">
                  <div className="question-copy">
                    <h2>{currentQuestion.text ?? currentQuestion.question}</h2>
                  </div>
                  <div
                    className={`timer-ring ${progress <= 0.25 ? "is-danger" : progress <= 0.5 ? "is-warning" : ""}`}
                    style={{ "--timer-angle": `${progress * 360}deg` }}
                    role="timer"
                  >
                    <div className="timer-ring-inner">
                      <Clock3 size={15} />
                      <strong>{Math.ceil(displayedTime)}</strong>
                      <small>ث</small>
                    </div>
                  </div>
                </div>

                {(isMcq || isTf) && (
                  <>
                    <div className="answer-prompt">
                      <Sparkles size={18} /> <span>الإجابات</span>
                    </div>
                    <div className={`answer-grid${isTf ? " answer-grid-tf" : ""}`}>
                      {(currentQuestion.options ?? []).map((option, optIndex) => {
                        const isCorrectOption = optIndex === getCorrectIndex(currentQuestion);
                        const stateClass = isReveal
                          ? (isCorrectOption ? " answer-option-correct" : " answer-option-muted")
                          : "";
                        const colorClass = isTf
                          ? (optIndex === 0 ? " answer-option-true" : " answer-option-false")
                          : ` ${ANSWER_COLORS[optIndex % ANSWER_COLORS.length]}`;

                        return (
                          <li
                            key={optIndex}
                            className={`answer-option${colorClass}${stateClass}`}
                          >
                            <span className="answer-option-key">
                              {(isCorrectOption && isReveal)
                                ? <Check size={19} strokeWidth={3} />
                                : (isTf ? (optIndex === 0 ? "✓" : "✗") : String.fromCharCode(65 + optIndex))}
                            </span>
                            <span className="answer-option-text">{option}</span>
                          </li>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            );
          })()}

          {liveState === "finished" && (
            <div className="main-screen">
              <div className="state-icon"><Sparkles size={48} /></div>
              <h2>خلصت الجولة!</h2>
              <p>
                {live.pendingStudents.length > 0
                  ? `لسه ${live.pendingStudents.length} من ${students.length} طالب مكملوش.`
                  : "كل الطلاب خلصوا — تقدر تقفل الحصة."}
              </p>
              <div className="state-pulse" />
            </div>
          )}

          {liveState === "reopened" && (() => {
            const reopenedCount =
              live.liveSession?.reopenedFor?.studentIds?.length
              ?? live.pendingStudents?.length
              ?? 0;

            return (
              <div className="main-screen">
                <div className="state-icon"><RotateCcw size={42} /></div>
                <h2>الجولة مفتوحة للمتأخرين</h2>
                <p>
                  مفتوحة لـ <b>{reopenedCount}</b> من <b>{students.length}</b> طالب لسه مكملوش.
                </p>
                <div className="question-stats">
                  <span className="stat-chip">
                    <RotateCcw size={16} /> {live.reopenedStudentsCount} <small>متأخر</small>
                  </span>
                  <span className="stat-chip">
                    <Users size={16} /> {students.length} <small>طالب</small>
                  </span>
                  <span className={`stat-chip ${live.allowAnswerEdit ? "stat-chip-wrong" : "stat-chip-correct"}`}>
                    {live.allowAnswerEdit ? "تعديل مسموح" : "تعديل مقفول"}
                  </span>
                </div>
                <div className="state-pulse" />
              </div>
            );
          })()}
        </div>

        <div className="live-control">
          {QUESTION_STATES.includes(liveState) && currentQuestion && (
            <>
              {!live.isLastQuestion && (
                <>
                  <label className="auto-advance-toggle">
                    <input
                      type="checkbox"
                      checked={live.autoAdvance}
                      onChange={(e) => live.setAutoAdvance(e.target.checked)}
                    />
                    <span>تقدّم تلقائي</span>
                    <small>
                      {live.autoAdvance ? "الأسئلة بتتقدم لوحدها" : "التحكم يدوي"}
                    </small>
                  </label>
                  <button
                    className="button button-primary turquoise button-center"
                    onClick={live.requestNextQuestion}
                  >
                    <SkipForward size={16} /> السؤال التالي
                    {liveState === "reveal" && live.autoAdvanceRemaining != null
                      && ` (${live.autoAdvanceRemaining})`}
                  </button>
                </>
              )}

              {liveState === "paused" && (
                <button
                  className="button button-primary turquoise button-center"
                  onClick={live.resumeQuestion}
                >
                  <Play size={16} /> استكمال
                </button>
              )}

              {liveState === "question" && (
                <button
                  className="button button-primary ghost button-center"
                  onClick={live.pauseQuestion}
                >
                  <Pause size={16} /> إيقاف مؤقت
                </button>
              )}

              {liveState !== "reveal" && (
                <>
                  <button
                    className="button button-primary turquoise button-center"
                    onClick={live.revealAnswer}
                  >
                    <Eye size={16} /> اعرض الإجابة
                  </button>
                  <button
                    className="button button-primary red button-center"
                    onClick={live.finishSession}
                  >
                    <Check size={16} /> أنهِ الجولة
                  </button>
                </>
              )}

              {liveState === "reveal" && live.isLastQuestion && (
                <button
                  className="button button-primary turquoise button-center"
                  onClick={live.finishSession}
                >
                  <Check size={16} /> أنهِ الجولة
                </button>
              )}
            </>
          )}

          {liveState === "lobby" && (
            <button
              className="button button-primary turquoise button-center"
              onClick={live.startCountdown}
            >
              ابدأ الحصة <Play size={16} />
            </button>
          )}

          {liveState === "countdown" && (
            <>
              <button
                className="button button-primary turquoise button-center"
                onClick={live.startQuestion}
              >
                <SkipForward size={16} /> ابدأ السؤال دلوقتي
              </button>
              <button
                className="button button-primary ghost button-center"
                onClick={live.cancelCountdown}
              >
                <X size={16} /> إلغاء
              </button>
            </>
          )}

          {liveState === "finished" && (
            <>
              <button
                className="button button-primary turquoise button-center"
                type="button"
                onClick={onOpenReopenModal}
                disabled={live.pendingStudents.length === 0}
                title={
                  live.pendingStudents.length === 0
                    ? "كل الطلاب خلصوا"
                    : "افتح الجولة للمتأخرين بس"
                }
              >
                <RotateCcw size={16} /> افتح للمتأخرين ({live.pendingStudents.length})
              </button>
              <button
                className="button button-primary ghost button-center"
                type="button"
                onClick={live.requestEndLive}
              >
                <LogOut size={16} /> خروج وإغلاق الحصة
              </button>
            </>
          )}

          {liveState === "reopened" && (
            <>
              <button
                className="button button-primary turquoise button-center"
                type="button"
                onClick={live.closeReopenedRound}
              >
                <Lock size={16} /> اقفل الجولة
              </button>
              <button
                className="button button-primary ghost button-center"
                type="button"
                onClick={live.requestEndLive}
              >
                <LogOut size={16} /> خروج
              </button>
            </>
          )}
        </div>
      </section>
    </section>
  );
}