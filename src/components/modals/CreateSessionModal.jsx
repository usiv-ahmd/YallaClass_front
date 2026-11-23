// src/components/modals/CreateSessionModal.jsx
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import { quizApi } from "../../api/quiz.api";

export default function CreateSessionModal({ onClose, onCreate }) {
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [quizzesError, setQuizzesError] = useState(null);
  const [quizId, setQuizId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await quizApi.list({ status: "ACTIVE" });
        const usable = (res.data || []).filter((quiz) => (quiz.questionCount ?? 0) > 0);

        if (cancelled) return;

        setQuizzes(usable);
        if (usable.length > 0) setQuizId(usable[0].id);
      } catch (e) {
        if (!cancelled) setQuizzesError(e.message || "تعذّر تحميل الكويزات");
      } finally {
        if (!cancelled) setQuizzesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!quizId) return;

    setError(null);
    setBusy(true);

    try {
      await onCreate({ quiz: quizId });
      onClose();
    } catch (err) {
      setError(err.message || "تعذّر إنشاء الجلسة");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="opened-window-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <section className="card modal-window" role="dialog" aria-modal="true">
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon turquoise">
              <Plus size={22} />
            </div>
            <div>
              <span className="card-kicker">جلسة جديدة</span>
              <h2 className="modal-title">افتح جلسة لايف</h2>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={17} />
          </button>
        </div>

        <form className="modal-content" onSubmit={handleSubmit}>
          {quizzesLoading && (
            <p className="card-description">بنحمّل الكويزات...</p>
          )}

          {quizzesError && <p className="error-alert">{quizzesError}</p>}

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
                {quizzes.map((quiz) => (
                  <button
                    type="button"
                    className={`type-chip${quizId === quiz.id ? " selected" : ""}`}
                    onClick={() => setQuizId(quiz.id)}
                    aria-pressed={quizId === quiz.id}
                    key={quiz.id}
                  >
                    {quiz.title}
                    <small className="chip-badge">
                      {quiz.questionCount} سؤال
                    </small>
                  </button>
                ))}
              </div>

              <p className="card-description">
                بعد إنشاء الجلسة هتقدر تظبط الأوامر ومدد المراحل من صفحة
                الجلسة قبل ما تبدأ.
              </p>
            </>
          )}

          {error && <p className="error-alert">{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="button modal-button white"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="button modal-button turquoise"
              disabled={busy || !quizId}
            >
              {busy ? "بنفتح الجلسة..." : "فتح الجلسة"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
