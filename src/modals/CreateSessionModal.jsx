// src/modals/CreateSessionModal.jsx
import { useEffect, useState } from "react";
import { Command, Plus, X } from "lucide-react";
import { quizApi } from "../api/quiz.api";

export default function CreateSessionModal({ onClose, onCreate }) {
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [quizzesError, setQuizzesError] = useState(null);
  const [quizId, setQuizId] = useState("");
  const [commands, setCommands] = useState({
    gift: true,
    thief: true,
    rocket: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await quizApi.list({ archived: false });
        const usable = (res.data || []).filter((q) => (q.questionCount ?? 0) > 0);
        setQuizzes(usable);
        if (usable.length > 0) setQuizId(usable[0].id);
      } catch (e) {
        setQuizzesError(e.message || "تعذّر تحميل الكويزات");
      } finally {
        setQuizzesLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quizId) return;
    setError(null);
    setBusy(true);
    try {
      await onCreate({ quizId, settings: { commandsEnabled: commands } });
      onClose();
    } catch (err) {
      setError(err.message || "تعذّر إنشاء الجلسة");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="opened-window-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="presentation">
      <section className="card modal-window" role="dialog" aria-modal="true">
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon turquoise">
              <Plus size={22} />
            </div>
            <div>
              <span className="card-kicker">
                جلسة جديدة
              </span>
              <h2 className="modal-title">
                افتح جلسة لايف
              </h2>
            </div>
          </div>
          <button type="button" className="modal-close-button" onClick={onClose} aria-label="إغلاق">
            <X size={17} />
          </button>
        </div>

        <form className="modal-content" onSubmit={handleSubmit}>
          {quizzesLoading && (
            <p className="card-description">
              بنحمّل الكويزات...
            </p>
          )}
          {quizzesError && (
            <p className="error-alert">
              {quizzesError}
            </p>
          )}

          {!quizzesLoading && !quizzesError && quizzes.length === 0 && (
            <div className="empty-questions">
              <strong>مفيش كويزات جاهزة</strong>
              <span>روح المكتبة وأضف أسئلة لكويز أولاً.</span>
            </div>
          )}

          {!quizzesLoading && !quizzesError && quizzes.length > 0 && (
            <>
              <label>الكويز</label>
              <div className="type-selector">
                {quizzes.map((q) => (
                  <button type="button" className={`type-chip${quizId === q.id ? " selected" : ""}`} onClick={() => setQuizId(q.id)} aria-pressed={quizId === q.id} key={q.id}>
                    {q.title}
                    <small className="chip-badge">
                      {q.questionCount} سؤال
                    </small>
                  </button>
                ))}
              </div>

              <label>الأوامر المسموحة</label>
              <div className="type-selector">
                {["gift", "thief", "rocket"].map((cmd) => (
                  <button type="button" className={`type-chip${commands[cmd] ? " selected" : ""}`} onClick={() => setCommands((prev) => ({ ...prev, [cmd]: !prev[cmd] }))} aria-pressed={commands[cmd]} key={cmd}>
                    <Command size={14} />
                    {cmd === "gift" ? "هدية" : cmd === "thief" ? "سرقة" : "صاروخ"}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && (
            <p className="error-alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button type="button" className="button modal-button white" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="button modal-button turquoise" disabled={busy || !quizId}>
              {busy ? "بنفتح الجلسة..." : "فتح الجلسة"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}