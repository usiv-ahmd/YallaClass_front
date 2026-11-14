// src/pages/QuizLibraryPage.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Archive, ArrowRight, Copy, FileQuestion, Plus, Search, Trash2, Library, X } from "lucide-react";
import { useQuizLibrary } from "../store/quiz.store.jsx";
import Loading from "../components/ui/Loading.jsx";

export default function QuizLibraryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", subject: "", tags: "" });
  const [createError, setCreateError] = useState(null);
  const [createBusy, setCreateBusy] = useState(false);

  const { quizzes, loading, error, refresh, createQuiz, duplicateQuiz, archiveQuiz, deleteQuiz } = useQuizLibrary({ archived: showArchived });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return quizzes;
    return quizzes.filter((q) => q.title.toLowerCase().includes(term) || (q.subject || "").toLowerCase().includes(term) || (q.tags || []).some((t) => t.toLowerCase().includes(term)));
  }, [quizzes, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateBusy(true);
    try {
      const tags = draft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const quiz = await createQuiz({
        title: draft.title,
        subject: draft.subject,
        tags,
      });
      setCreateOpen(false);
      setDraft({ title: "", subject: "", tags: "" });
      navigate(`/library/${quiz.id}`);
    } catch (err) {
      setCreateError(err.message || "تعذّر إنشاء الكويز");
    } finally {
      setCreateBusy(false);
    }
  };

  const handleDuplicate = async (quiz) => {
    try {
      await duplicateQuiz(quiz.id);
    } catch (err) {
      alert(err.message || "تعذّر النسخ");
    }
  };

  const handleArchive = async (quiz) => {
    if (!window.confirm(showArchived ? `استرجاع "${quiz.title}"؟` : `أرشفة "${quiz.title}"؟`)) return;
    try {
      await archiveQuiz(quiz.id, !showArchived);
    } catch (err) {
      alert(err.message || "تعذّرت العملية");
    }
  };

  const handleDelete = async (quiz) => {
    if (!window.confirm(`حذف "${quiz.title}" نهائيًا؟ لا يمكن التراجع.`)) return;
    try {
      await deleteQuiz(quiz.id);
    } catch (err) {
      alert(err.message || "تعذّر الحذف");
    }
  };

  return (
    <div className="page">
      <header className="card page-heading">
        <div>
          <span className="page-eyebrow">
            <Library size={13} /> المكتبة
          </span>
          <h1>كويزاتك</h1>
          <p>
            أنشئ، نظّم، وأرشف كويزاتك.
          </p>
        </div>
        <div className="heading-meta">
          <button className="button button-primary turquoise" type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> كويز جديد
          </button>
          <Link className="button button-primary ghost" to="/instructor-dashboard">
            <ArrowRight size={16} /> رجوع
          </Link>
        </div>
      </header>

      <main className="dashboard">
        <section className="card stack-card">
          <div className="card-heading">
            <div className="input-wrap" style={{ flex: 1 }}>
              <Search size={16} />
              <input placeholder="ابحث بالاسم أو المادة أو الوسم..." type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button className={`button button-primary ${showArchived ? "turquoise" : "ghost"}`} type="button" onClick={() => setShowArchived((v) => !v)}>
              <Archive size={15} /> {showArchived ? "المؤرشفة" : "الأرشيف"}
            </button>
          </div>

          {loading && <Loading description="ثانية" title="بنحمّل الكويزات..." />}
          {error && <p className="error-alert">
            {error}
          </p>}

          {!loading && !error && filtered.length === 0 && (
            <div className="empty-questions">
              <FileQuestion size={26} />
              <strong>
                {search ? "مفيش نتائج مطابقة" : showArchived ? "الأرشيف فاضي" : "لسه مفيش كويزات"}
              </strong>
              <span>
                {search ? "جرّب كلمة تانية" : showArchived ? "الكويزات اللي تأرشفها هتظهر هنا" : "اضغط «كويز جديد» عشان تبدأ"}
              </span>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid-list-260">
              {filtered.map((quiz) => (
                <article className="field quiz-card" onClick={() => navigate(`/library/${quiz.id}`)} key={quiz.id}>
                  <div className="card-heading">
                    <div className="min-w-0">
                      <h3 className="quiz-card-title">
                        {quiz.title}
                      </h3>
                      {quiz.subject && <small className="text-muted">
                        {quiz.subject}
                      </small>}
                    </div>
                    <span className="count-pill">
                      {quiz.questionCount ?? 0} سؤال
                    </span>
                  </div>

                  {(quiz.tags || []).length > 0 && (
                    <div className="question-options-preview">
                      {quiz.tags.map((tag) => (
                        <span key={tag}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="quiz-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="small-icon-button blue-icon" title="نسخ" type="button" onClick={() => handleDuplicate(quiz)}>
                      <Copy size={14} />
                    </button>
                    <button className="small-icon-button orange-icon" title={showArchived ? "استرجاع" : "أرشفة"} type="button" onClick={() => handleArchive(quiz)}>
                      <Archive size={14} />
                    </button>
                    <button className="small-icon-button red-icon" title="حذف" type="button" onClick={() => handleDelete(quiz)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {createOpen && (
        <div className="opened-window-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setCreateOpen(false); }}>
          <section className="card modal-window" role="dialog" aria-modal="true">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon turquoise">
                  <Plus size={22} />
                </div>
                <div>
                  <span className="card-kicker">
                    كويز جديد
                  </span>
                  <h2 className="modal-title">
                    إنشاء كويز
                  </h2>
                </div>
              </div>
              <button className="modal-close-button" type="button" onClick={() => setCreateOpen(false)} aria-label="إغلاق">
                <X size={17} />
              </button>
            </div>

            <form className="modal-content" onSubmit={handleCreate}>
              <label>عنوان الكويز</label>
              <div className="input-wrap">
                <input maxLength={80} placeholder="مثال: مراجعة قوانين الحركة" required type="text" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>

              <label>المادة / الصف</label>
              <div className="input-wrap">
                <input placeholder="مثال: فيزياء · الصف الثاني" type="text" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
              </div>

              <label>وسوم (مفصولة بفواصل)</label>
              <div className="input-wrap">
                <input placeholder="مثال: مراجعة, قوانين" type="text" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
              </div>

              {createError && <p className="error-alert">
                {createError}
              </p>}

              <div className="modal-actions">
                <button className="button modal-button white" type="button" onClick={() => setCreateOpen(false)}>
                  إلغاء
                </button>
                <button className="button modal-button turquoise" disabled={createBusy} type="submit">
                  {createBusy ? "جاري الإنشاء..." : "إنشاء"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}