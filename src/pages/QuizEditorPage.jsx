// src/pages/QuizEditorPage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check, FileQuestion, Pencil, Settings2, X } from "lucide-react";
import { useQuiz } from "../store/quiz.store.jsx";
import { useQuestionsForm } from "../hooks/useQuestionsForm.js";
import QuestionsPanel from "../components/instructor/QuestionsPanel.jsx";
import UploadPanel from "../components/instructor/UploadPanel.jsx";
import QuestionFormWindow from "../components/modals/QuestionFormWindow.jsx";
import Loading from "../components/ui/Loading.jsx";

export default function QuizEditorPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { quiz, asSession, loading, error, saveMeta, updateQuestions } = useQuiz(quizId);

  const question = useQuestionsForm({
    session: asSession,
    updateQuestions,
  });

  const [metaOpen, setMetaOpen] = useState(false);
  const [metaDraft, setMetaDraft] = useState({ title: "", subject: "", tags: "" });
  const [metaError, setMetaError] = useState(null);
  const [metaBusy, setMetaBusy] = useState(false);

  const handleSaveMeta = async (e) => {
    e.preventDefault();
    setMetaError(null);
    setMetaBusy(true);
    try {
      const tags = metaDraft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await saveMeta({
        title: metaDraft.title,
        subject: metaDraft.subject,
        tags,
      });
      setMetaOpen(false);
    } catch (err) {
      setMetaError(err.message || "تعذّر الحفظ");
    } finally {
      setMetaBusy(false);
    }
  };

  useEffect(() => {
    if (quiz) {
      setMetaDraft({
        title: quiz.title || "",
        subject: quiz.subject || "",
        tags: (quiz.tags || []).join(", "),
      });
    }
  }, [quiz?.id]);

  if (loading) {
    return (
      <div className="page">
        <Loading description="ثانية" title="بنحمّل الكويز..." />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="page">
        <div className="card stack-card">
          <p className="error-alert">
            {error || "الكويز مش موجود"}
          </p>
          <button className="button button-primary turquoise" type="button" onClick={() => navigate("/library")}>
            <ArrowRight size={16} /> رجوع للمكتبة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="card page-heading">
        <div>
          <span className="page-eyebrow">
            <FileQuestion size={13} /> {quiz.questionCount ?? 0} سؤال
            {quiz.subject ? ` · ${quiz.subject}` : ""}
          </span>
          <h1>{quiz.title}</h1>
          {(quiz.tags || []).length > 0 && (
            <p className="mt-6">
              {quiz.tags.map((t) => `#${t}`).join("  ")}
            </p>
          )}
        </div>

        <div className="heading-meta">
          <button className="button button-primary ghost" type="button" onClick={() => setMetaOpen(true)}>
            <Settings2 size={15} /> تعديل البيانات
          </button>
          <Link className="button button-primary ghost" to="/library">
            <ArrowRight size={16} /> رجوع
          </Link>
        </div>
      </header>

      <main className="dashboard">
        <div className="layout">
          <div className="session-workspace">
            {quiz.questionCount === 0 && (
              <div className="card stack-card">
                <div className="card-heading">
                  <div className="card-heading-title">
                    <div className="card-icon yellow">
                      <FileQuestion size={22} />
                    </div>
                    <div>
                      <span className="card-eyebrow">
                        جاهز للتعديل
                      </span>
                      <h2>لسه مفيش أسئلة</h2>
                    </div>
                  </div>
                </div>
                <p className="card-description">
                  ابدأ بإضافة أول سؤال للكويز. لما تخلص، هتقدر تعمل جلسة لايف منه.
                </p>
              </div>
            )}

            <div className="questions">
              <QuestionsPanel description="أضف أو عدّل الأسئلة. التغييرات بتتحفظ تلقائيًا." question={question} />
              <UploadPanel />
            </div>
          </div>
        </div>
      </main>

      {question.formOpen && quiz && (
        <QuestionFormWindow question={question} sessionId={quiz.id} />
      )}

      {metaOpen && (
        <div className="opened-window-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setMetaOpen(false); }}>
          <section className="card modal-window" role="dialog" aria-modal="true">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon turquoise">
                  <Pencil size={22} />
                </div>
                <div>
                  <span className="card-kicker">
                    بيانات الكويز
                  </span>
                  <h2 className="modal-title">
                    تعديل البيانات
                  </h2>
                </div>
              </div>
              <button className="modal-close-button" type="button" onClick={() => setMetaOpen(false)} aria-label="إغلاق">
                <X size={17} />
              </button>
            </div>

            <form className="modal-content" onSubmit={handleSaveMeta}>
              <label>العنوان</label>
              <div className="input-wrap">
                <input maxLength={80} required type="text" value={metaDraft.title} onChange={(e) => setMetaDraft({ ...metaDraft, title: e.target.value })} />
              </div>

              <label>المادة / الصف</label>
              <div className="input-wrap">
                <input type="text" value={metaDraft.subject} onChange={(e) => setMetaDraft({ ...metaDraft, subject: e.target.value })} />
              </div>

              <label>وسوم (مفصولة بفواصل)</label>
              <div className="input-wrap">
                <input type="text" value={metaDraft.tags} onChange={(e) => setMetaDraft({ ...metaDraft, tags: e.target.value })} />
              </div>

              {metaError && <p className="error-alert">
                {metaError}
              </p>}

              <div className="modal-actions">
                <button className="button modal-button white" type="button" onClick={() => setMetaOpen(false)}>
                  إلغاء
                </button>
                <button className="button modal-button turquoise" disabled={metaBusy} type="submit">
                  <Check size={16} />
                  {metaBusy ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}