// src/pages/SessionsPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Lock, Plus, Radio, Unlock, Users } from "lucide-react";
import { useSessionList } from "../store/session.store.jsx";
import CreateSessionModal from "../components/modals/CreateSessionModal.jsx";
import Loading from "../components/ui/Loading.jsx";

const STATE_LABEL = { lobby: "لوبي", countdown: "عد تنازلي", question: "سؤال شغّال", paused: "متوقف", reveal: "مراجعة", explanation: "شرح", leaderboard: "متصدرين", finished: "خلصت" };

export default function SessionsPage() {
  const navigate = useNavigate();
  const { sessions, loading, error, createSession } = useSessionList();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = async (payload) => {
    const session = await createSession(payload);
    navigate(`/sessions/${session.id}`);
  };

  return (
    <div className="page">
      <header className="card page-heading">
        <div>
          <span className="page-eyebrow">
            <Radio size={13} /> جلسات اللايف
          </span>
          <h1>جلساتك</h1>
          <p>
            افتح جلسة من كويز جاهز، وشير الكود مع طلابك.
          </p>
        </div>
        <div className="heading-meta">
          <button className="button button-primary turquoise" type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> جلسة جديدة
          </button>
          <Link className="button button-primary ghost" to="/instructor-dashboard">
            <ArrowRight size={16} /> رجوع
          </Link>
        </div>
      </header>

      <main className="dashboard">
        <section className="card stack-card">
          {loading && <Loading description="ثانية" title="بنحمّل الجلسات..." />}
          {error && <p className="error-alert">
            {error}
          </p>}

          {!loading && !error && sessions.length === 0 && (
            <div className="empty-questions">
              <Radio size={26} />
              <strong>لسه مفيش جلسات</strong>
              <span>
                اضغط "جلسة جديدة" واختار كويز عشان تفتح أول جلسة.
              </span>
            </div>
          )}

          {!loading && !error && sessions.length > 0 && (
            <div className="grid-list-280">
              {sessions.map((s) => (
                <article className="field quiz-card" onClick={() => navigate(`/sessions/${s.id}`)} key={s.id}>
                  <div className="card-heading">
                    <div className="min-w-0">
                      <h3 className="quiz-card-title">
                        {s.title}
                      </h3>
                      {s.subject && <small className="text-muted">
                        {s.subject}
                      </small>}
                    </div>
                    <span className="count-pill">
                      كود: {s.code}
                    </span>
                  </div>

                  <div className="badge-row" onClick={(e) => e.stopPropagation()}>
                    <span className="status-badge status-badge-late">
                      {STATE_LABEL[s.live?.state] || s.live?.state}
                    </span>
                    <span className="status-badge status-badge-inactive">
                      <Users className="me-1" size={11} />
                      {s.students?.length || 0}
                    </span>
                    <span className="status-badge status-badge-inactive" title={s.settings?.allowJoining ? "الانضمام مفتوح" : "الانضمام مقفول"}>
                      {s.settings?.allowJoining ? (
                        <Unlock size={11} />
                      ) : (
                        <Lock size={11} />
                      )}
                    </span>

                    {s.finishedAt && (
                      <button className="small-icon-button blue-icon" title="تقرير الجلسة" type="button" onClick={() => navigate(`/reports/${s.id}`)}>
                        <BarChart3 size={14} />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {createOpen && (
        <CreateSessionModal onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}