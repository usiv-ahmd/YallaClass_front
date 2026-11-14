// src/components/instructor/LiveView.jsx
import { CheckCheck, ListChecks, Sparkles, Users } from "lucide-react";
import Leaderboard from "./Leaderboard.jsx";
import LiveQuestionsSidebar from "./LiveQuestionsSidebar.jsx";
import LiveSessionScreen from "./LiveSessionScreen.jsx";

export default function LiveView({
  live,
  countdown,
  onSendNotification,
  onRemoveStudent,
  onRequestEndLive,
  onOpenReopenModal,
}) {
  const students        = live.liveSession?.students ?? [];
  const liveQuestions   = live.liveSession?.questions ?? [];
  const currentQuestion = live.currentQuestion;

  return (
    <>
      <div className="page">
        <header className="card page-heading">
          <div>
            <span className="page-eyebrow">
              <span className="eyebrow-star"><Sparkles size={13} /></span> مساحة المدرس (حصة لايف)
            </span>
            <h1>الفصل صاحي؟ <em>يلا نلعب!</em></h1>
            <p>{live.liveSession?.title ?? "حصة لايف"}</p>
          </div>

          <div className="heading-meta">
            <button className="button button-primary red" type="button" onClick={live.requestEndLive}>
              إنهاء الحصة والعودة
            </button>
            <div className="session-area">
              <span className={`chip session-meta-status ${live.statusView.cls}`}>
                <i /> {live.statusView.label}
              </span>
            </div>
            <div className="chip session-code">
              <small>كود الفصل</small>
              <b>{live.liveSession?.code ?? "—"}</b>
            </div>
          </div>
        </header>

        <main className="dashboard">
          {live.liveState !== "lobby" && live.liveState !== "countdown" && (
            <section className="card live-progress-card">
              <div className="live-progress-meta">
                <span>
                  <ListChecks size={14} />
                  السؤال {Math.min(live.currentQuestionIndex + 1, live.totalQuestions)} من {live.totalQuestions}
                </span>
                <span>
                  <Users size={14} />
                  {students.length} طالب
                </span>
              </div>
              <div className="question-progress" style={{ "--total": live.totalQuestions }}>
                {Array.from({ length: live.totalQuestions }, (_, i) => {
                  const isRoundOver = live.liveState === "finished" || live.liveState === "reopened";
                  const isDone      = isRoundOver || i < live.currentQuestionIndex;
                  const isCurrent   = !isRoundOver && i === live.currentQuestionIndex;
                  return (
                    <span
                      key={i}
                      className={
                        "question-progress-step live-step" +
                        (isDone ? " is-done" : "") +
                        (isCurrent ? " is-current" : "")
                      }
                    />
                  );
                })}
              </div>
            </section>
          )}

          <div className="layout">
            <LiveQuestionsSidebar
              questions={liveQuestions}
              currentIndex={live.currentQuestionIndex}
              total={live.totalQuestions}
            />
            <div className="live-workspace">
              <LiveSessionScreen
                live={live}
                countdown={countdown}
                currentQuestion={currentQuestion}
                students={students}
                onOpenReopenModal={onOpenReopenModal}
              />

              <Leaderboard
                students={students}
                onDelete={onRemoveStudent}
                onSendNotification={onSendNotification}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}