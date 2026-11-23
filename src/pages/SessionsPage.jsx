// src/pages/SessionsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Copy,
  Lock,
  Plus,
  Radio,
  Search,
  Unlock,
  Users,
} from "lucide-react";

import { useSessionList } from "../store/session.store.jsx";
import CreateSessionModal from "../components/modals/CreateSessionModal.jsx";
import Loading from "../components/ui/Loading.jsx";
import {
  GAME_STATE_LABELS,
  SESSION_STATUS_LABELS,
} from "../adapters/session.adapter.js";
import { formatDateTime } from "../utils/format.js";
import "../styles/sessions.css";

const FILTERS = [
  { id: "ALL", label: "الكل" },
  { id: "LOBBY", label: "لوبي" },
  { id: "LIVE", label: "شغّالة" },
  { id: "PAUSED", label: "متوقفة" },
  { id: "FINISHED", label: "خلصت" },
];

const STATUS_CLASS = {
  LOBBY: "session-status-lobby",
  LIVE: "session-status-live",
  PAUSED: "session-status-paused",
  FINISHED: "session-status-finished",
};

function joinPath(joinCode) {
  return joinCode ? `/join/${joinCode}` : null;
}

function sessionStateLabel(session) {
  if (!session) return "";
  if (session.status === "FINISHED") return SESSION_STATUS_LABELS.FINISHED;
  if (session.status === "PAUSED") return SESSION_STATUS_LABELS.PAUSED;
  if (session.status === "LIVE") {
    return GAME_STATE_LABELS[session.gameState] || SESSION_STATUS_LABELS.LIVE;
  }
  return SESSION_STATUS_LABELS.LOBBY;
}

export default function SessionsPage() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [status, setStatus] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const { sessions, loading, error, createSession } = useSessionList({
    status,
    search,
  });

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!copiedId) return undefined;
    const timer = setTimeout(() => setCopiedId(null), 1800);
    return () => clearTimeout(timer);
  }, [copiedId]);

  const counts = useMemo(() => {
    const base = { ALL: sessions.length };

    for (const session of sessions) {
      base[session.status] = (base[session.status] || 0) + 1;
    }

    return base;
  }, [sessions]);

  const handleCreate = async (payload) => {
    const session = await createSession(payload);
    navigate(`/sessions/${session.id}`);
  };

  const handleCopy = async (session) => {
    const path = joinPath(session.joinCode);

    if (!path) return;

    const url = `${window.location.origin}${path}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(session.id);
    } catch {
      // Clipboard can be unavailable; the code is still visible on the card.
    }
  };

  return (
    <div className="page">
      <header className="card page-heading">
        <div>
          <span className="page-eyebrow">
            <Radio size={13} /> جلسات اللايف
          </span>
          <h1>جلساتك</h1>
          <p>افتح جلسة من كويز جاهز، وشير الكود مع طلابك.</p>
        </div>
        <div className="heading-meta">
          <button
            className="button button-primary turquoise"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={16} /> جلسة جديدة
          </button>
          <Link className="button button-primary ghost" to="/instructor-dashboard">
            <ArrowRight size={16} /> رجوع
          </Link>
        </div>
      </header>

      <main className="dashboard">
        <section className="card stack-card">
          <div className="session-toolbar">
            <div className="session-filter-row" role="tablist" aria-label="فلترة الجلسات">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={status === filter.id}
                  className={`type-chip${status === filter.id ? " selected" : ""}`}
                  onClick={() => setStatus(filter.id)}
                >
                  {filter.label}
                  <small className="chip-badge">
                    {filter.id === "ALL"
                      ? counts.ALL || 0
                      : counts[filter.id] || 0}
                  </small>
                </button>
              ))}
            </div>

            <label className="session-search">
              <Search size={15} />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="ابحث باسم الكويز..."
                aria-label="بحث في الجلسات"
              />
            </label>
          </div>

          {loading && <Loading description="ثانية" title="بنحمّل الجلسات..." />}

          {!loading && error && <p className="error-alert">{error}</p>}

          {!loading && !error && sessions.length === 0 && (
            <div className="empty-questions">
              <Radio size={26} />
              <strong>
                {search || status !== "ALL"
                  ? "مفيش جلسات مطابقة"
                  : "لسه مفيش جلسات"}
              </strong>
              <span>
                {search || status !== "ALL"
                  ? "غيّر الفلتر أو كلمة البحث وجرّب تاني."
                  : 'اضغط "جلسة جديدة" واختار كويز عشان تفتح أول جلسة.'}
              </span>
            </div>
          )}

          {!loading && !error && sessions.length > 0 && (
            <div className="grid-list-280">
              {sessions.map((session) => {
                const progress = session.questionProgress || {};
                const path = joinPath(session.joinCode);

                return (
                  <article
                    className="field quiz-card session-card"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                    key={session.id}
                  >
                    <div className="card-heading">
                      <div className="min-w-0">
                        <span className="card-eyebrow">
                          {formatDateTime(session.createdAt)}
                        </span>
                        <h3 className="quiz-card-title">
                          {session.quiz?.title || "كويز"}
                        </h3>
                      </div>
                      <span className={`session-status ${STATUS_CLASS[session.status] || ""}`}>
                        {sessionStateLabel(session)}
                      </span>
                    </div>

                    <div className="session-card-meta">
                      <span className="count-pill" dir="ltr">
                        {session.joinCode || "—"}
                      </span>
                      <span className="status-badge status-badge-inactive">
                        <Users className="me-1" size={11} />
                        {session.participantCount || 0}
                      </span>
                      <span className="status-badge status-badge-inactive">
                        سؤال {(progress.current || 0)} /{" "}
                        {progress.total || session.quiz?.questionCount || 0}
                      </span>
                      <span
                        className="status-badge status-badge-inactive"
                        title={session.joinOpen ? "الانضمام مفتوح" : "الانضمام مقفول"}
                      >
                        {session.joinOpen ? (
                          <Unlock size={11} />
                        ) : (
                          <Lock size={11} />
                        )}
                      </span>
                    </div>

                    <div
                      className="session-card-actions"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="button button-primary turquoise session-action"
                        onClick={() => navigate(`/sessions/${session.id}`)}
                      >
                        <Radio size={15} />
                        {session.status === "FINISHED" ? "ملخص الجلسة" : "إدارة الجلسة"}
                      </button>

                      {path && (
                        <button
                          type="button"
                          className="button button-primary ghost session-action"
                          onClick={() => handleCopy(session)}
                          disabled={!session.joinOpen && session.status !== "LOBBY"}
                        >
                          {copiedId === session.id ? (
                            <ClipboardCheck size={15} />
                          ) : (
                            <Copy size={15} />
                          )}
                          {copiedId === session.id ? "اتنسخ" : "لينك الطلاب"}
                        </button>
                      )}

                      {session.status === "FINISHED" && (
                        <button
                          type="button"
                          className="small-icon-button blue-icon"
                          title="تقرير الجلسة"
                          onClick={() => navigate(`/reports/${session.id}`)}
                        >
                          <BarChart3 size={14} />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {createOpen && (
        <CreateSessionModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
