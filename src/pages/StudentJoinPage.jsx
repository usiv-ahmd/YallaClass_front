// src/pages/StudentJoinPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  Palette,
} from "lucide-react";

import { usePlayerSession } from "../hooks/usePlayerSession";
import { AVATAR_COLORS, AVATAR_PRESETS } from "../adapters/roster.adapter.js";
import Loading from "../components/ui/Loading.jsx";
import "../styles/student-page.css";

function defaultAvatar() {
  return { preset: "FOX", color: "#3B82F6" };
}

export default function StudentJoinPage() {
  const navigate = useNavigate();
  const params = useParams();
  const routeCode = String(params.code || "").trim().toUpperCase();

  const [code, setCode] = useState(routeCode);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(defaultAvatar());
  const [showAvatar, setShowAvatar] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const session = usePlayerSession(code || "");
  const publicSession = session.publicSession;

  useEffect(() => {
    if (session.participant) {
      navigate(`/join/${code}`, { replace: true });
    }
  }, [session.participant, code, navigate]);

  const canSubmit = useMemo(() => {
    if (!code || code.length !== 6) return false;
    if (!nickname.trim()) return false;
    return true;
  }, [code, nickname]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await session.join({
        code,
        name: name.trim(),
        nickname: nickname.trim(),
        avatar,
      });
    } catch (e) {
      setError(e.message || "تعذّر الانضمام للجلسة");
    } finally {
      setBusy(false);
    }
  };

  if (session.loading && !publicSession) {
    return (
      <div className="page">
        <Loading title="بنحمّل الجلسة..." description="ثانية" />
      </div>
    );
  }

  return (
    <div className="page student-join-page">
      <header className="card page-heading">
        <div>
          <span className="page-eyebrow">
            <KeyRound size={13} /> انضمام للجلسة
          </span>
          <h1>انضم إلى جلسة لايف</h1>
          <p>أدخل كود الجلسة واسمك عشان تدخل مع زملائك.</p>
        </div>
        <LinkButton navigate={navigate} />
      </header>

      <main className="dashboard">
        <section className="card stack-card single-card">
          {session.error && <p className="error-alert">{session.error}</p>}
          {error && <p className="error-alert">{error}</p>}

          {!routeCode && (
            <div className="field">
              <label>كود الجلسة</label>
              <input
                type="text"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
                }
                placeholder="ABC123"
                dir="ltr"
                maxLength={6}
                autoComplete="off"
              />
            </div>
          )}

          {publicSession && (
            <div className="student-session-summary">
              <strong>{publicSession.quiz?.title || "جلسة لايف"}</strong>
              <span>
                {publicSession.quiz?.questionCount || 0} سؤال ·{" "}
                {publicSession.participantCount || 0} طالب
              </span>
              <span
                className={`status-badge ${
                  publicSession.status === "LIVE"
                    ? "session-status-live"
                    : "session-status-lobby"
                }`}
              >
                {publicSession.status === "LIVE" ? "شغّالة" : "لوبي"}
              </span>
            </div>
          )}

          <form className="modal-content" onSubmit={handleSubmit}>
            <div className="field">
              <label>اسم الشهرة</label>
              <input
                type="text"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="اسمك في الحصة"
                maxLength={50}
                required
              />
            </div>

            <div className="field">
              <label>الاسم (اختياري)</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="اسمك الكامل"
                maxLength={80}
              />
            </div>

            <button
              type="button"
              className="button button-primary ghost"
              onClick={() => setShowAvatar((value) => !value)}
            >
              <Palette size={16} />
              {showAvatar ? "إخفاء الأفاتار" : "اختيار أفاتار"}
            </button>

            {showAvatar && (
              <div className="avatar-picker">
                <div className="type-selector">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      className={`type-chip${avatar.preset === preset.id ? " selected" : ""}`}
                      onClick={() =>
                        setAvatar((prev) => ({ ...prev, preset: preset.id }))
                      }
                      aria-pressed={avatar.preset === preset.id}
                    >
                      {preset.emoji} {preset.label}
                    </button>
                  ))}
                </div>
                <div className="type-selector">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      type="button"
                      key={color.id}
                      className={`type-chip${avatar.color === color.id ? " selected" : ""}`}
                      style={{ background: color.id, color: "#fff" }}
                      onClick={() =>
                        setAvatar((prev) => ({ ...prev, color: color.id }))
                      }
                      aria-pressed={avatar.color === color.id}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="button button-primary turquoise"
              disabled={busy || !canSubmit}
            >
              {busy ? "بننضم..." : "انضم للجلسة"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function LinkButton({ navigate }) {
  return (
    <button
      type="button"
      className="button button-primary ghost"
      onClick={() => navigate("/")}
    >
      <ArrowLeft size={16} /> رجوع
    </button>
  );
}
