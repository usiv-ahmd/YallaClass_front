// src/components/instructor/DashboardView.jsx
import {
  BookOpen, BookOpenCheck, CalendarDays, Check, CheckCheck, Clock,
  FileText, LogOut, Pencil, Play, Plus, Settings2, Sparkles, Trash2,
  UploadCloud, Zap,
} from "lucide-react";
import { getCorrectIndex } from "../../utils/questions.js";

export default function DashboardView({
  data,
  editor,
  question,
  onStartLiveSession,
  onFileUpload,
  onRemoveFile,
  handleLogout,
}) {
  return (
    <>
      <div className="page">
        <header className="card page-heading">
          <div>
            <span className="page-eyebrow">
              <span className="eyebrow-star"><Sparkles size={13} /></span> مساحة المحاضر
            </span>
            <h1>إدارة الحصة <em>والأسئلة</em></h1>
            <p>رفع الماتريال، ومتابعة أداء الطلاب.</p>
          </div>

          <div className="heading-meta">
            {!data.session ? (
              <>
                <button
                  type="button"
                  className="button button-primary red"
                  onClick={editor.formModal.openCreate}
                >
                  <Plus size={17} /> حصة جديدة
                </button>
                <button className="button icon-button red-icon" onClick={handleLogout}>
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="button button-primary ghost"
                  onClick={editor.formModal.openCreate}
                >
                  <Plus size={15} /> حصة جديدة
                </button>
                <button className="button icon-button red-icon" onClick={handleLogout}>
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </header>

        <main className="dashboard">
          <div className="layout">
            {!data.session ? (
              <div className="card action-card">
                <div className="card-heading">
                  <div className="card-heading-title">
                    <div className="card-icon yellow"><CalendarDays size={26} /></div>
                    <div><h2>اختار حصة او انشئ حصة جديدة</h2></div>
                  </div>
                </div>
                <p>
                  حدّد ميعاد الحصة وبعدها أضف أسئلتك اليدوية. او ارفع الملف وسيب الذكاء الاصطناعي يولد لك اسئله.<br />
                  ابعت للطلاب كود الحصه.
                </p>
                <button
                  type="button"
                  className="button button-primary turquoise"
                  onClick={editor.formModal.openCreate}
                >
                  <Plus size={17} /> إنشاء حصة جديدة
                </button>
              </div>
            ) : (
              <section className="session-workspace">
                <div className="card">
                  <div className="card-heading">
                    <div className="card-heading">
                      <div className="card-heading-title">
                        <div className="card-icon turquoise"><BookOpen size={23} /></div>
                        <div>
                          <div className="card-eyebrow-div">
                            <span className="card-eyebrow">{data.session.subject}</span>
                            <span className="card-eyebrow-separator">/</span>
                            <span className="card-eyebrow">{data.session.code}</span>
                          </div>
                          <h2>{data.session.title}</h2>
                        </div>
                      </div>
                    </div>

                    <div className="card-actions">
                      {!data.session.questions?.length ? (
                        <span className="overview-status overview-status-check">
                          <Check size={16} /> ضيف سؤال عالاقل او ارفع الفايلات!
                        </span>
                      ) : (
                        <span className="overview-status overview-status-doublecheck">
                          <CheckCheck size={16} /> الحصة قابله للبدء
                        </span>
                      )}

                      <button
                        type="button"
                        className="button icon-button red-icon"
                        onClick={editor.deleteModal.open}
                        aria-label="حذف الحصة"
                        title="حذف الحصة"
                      >
                        <Trash2 size={17} />
                      </button>

                      <button
                        type="button"
                        className="button button-primary red"
                        onClick={onStartLiveSession}
                        disabled={!data.session?.questions?.length}
                      >
                        <Play size={16} fill="currentColor" /> ابدأ الحصة
                      </button>
                    </div>
                  </div>

                  <div className="session-meta-row">
                    <button
                      type="button"
                      className="button button-primary turquoise"
                      onClick={editor.formModal.openEdit}
                    >
                      <Settings2 size={15} /> تفاصيل الحصة
                    </button>
                  </div>
                </div>

                <div className="questions">
                  <QuestionsPanel question={question} />
                  <UploadPanel
                    data={data}
                    onFileUpload={onFileUpload}
                    onRemoveFile={onRemoveFile}
                  />
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function QuestionsPanel({ question }) {
  return (
    <section className="card stack-card" aria-labelledby="questions-title">
      <div className="card-heading">
        <div className="card-heading-title">
          <div className="card-icon small-card-icon yellow"><BookOpenCheck size={19} /></div>
          <div><h2 id="questions-title">الأسئلة</h2></div>
        </div>
        <span className="count-pill">{question.questions.length} سؤال</span>
      </div>

      <p className="card-description">
        اكتب الأسئلة اللي انت عايزها أو ارفع ملف وسيب الـ AI يعملهالك.
      </p>

      {question.questions.length > 0 ? (
        <div className="question-list">
          {question.questions.map((item, index) => {
            const correctIdx = getCorrectIndex(item);
            const optionList = Array.isArray(item?.options) ? item.options : [];
            const qDuration  = Number(item?.duration) || 0;

            return (
              <article className="field question-field" key={item.id ?? index}>
                <div className="question-field-topline">
                  <span className={`question-number ${item.source === "ai" ? "blue" : "yellow"}`}>
                    {`${index + 1}`.padStart(2, "0")}
                  </span>
                  <span className={`question-info ${item.source === "ai" ? "blue" : "yellow"}`}>
                    {item.source === "ai" ? <Sparkles size={10} /> : <i />}{" "}
                    {item.source === "ai" ? "ذكاء اصطناعي" : "يدوي"}
                  </span>
                  <span className={`question-info ${item.type === "true_false" ? "turquoise" : "blue"}`}>
                    {item.type === "true_false"
                      ? "صح/غلط"
                      : item.source === "ai" ? "AI · اختيار" : "اختيار"}
                  </span>

                  {item.weight > 0 && (
                    <span className="question-info highlight" title={`وزن السؤال ${item.weight} نقطة`}>
                      <Zap size={11} /> {item.weight} نقطة
                    </span>
                  )}
                  {qDuration > 0 && (
                    <span className="question-info turquoise" title={`مدة السؤال ${qDuration} ثانية`}>
                      <Clock size={11} /> {qDuration} ث
                    </span>
                  )}

                  <div className="question-actions">
                    <button
                      type="button"
                      className="small-icon-button turquoise-icon"
                      onClick={() => question.startEdit(item)}
                      aria-label={`تعديل السؤال ${index + 1}`}
                      title="تعديل السؤال"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="small-icon-button red-icon"
                      onClick={() => question.deleteQuestion(item.id)}
                      aria-label={`حذف السؤال ${index + 1}`}
                      title="حذف السؤال"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3>{item.question}</h3>

                <div className="question-options-preview">
                  {optionList.map((option, optionIndex) => (
                    <span
                      key={`${item.id ?? index}-${optionIndex}`}
                      className={optionIndex === correctIdx ? "is-correct" : ""}
                    >
                      <i>
                        {optionIndex === correctIdx
                          ? <Check size={11} />
                          : String.fromCharCode(65 + optionIndex)}
                      </i>
                      {option}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-questions">
          <BookOpenCheck size={24} />
          <strong>لسه ما أضفتش أسئلة</strong>
          <span>ابدأ بإضافة سؤال يدوي للحصة.</span>
        </div>
      )}

      <button
        type="button"
        className="button button-primary turquoise"
        onClick={question.startAdd}
      >
        <Plus size={17} /> أضف سؤالًا يدويًا
      </button>
    </section>
  );
}

function UploadPanel({ data, onFileUpload, onRemoveFile }) {
  return (
    <div className="card screen stack-card">
      <div className="card-heading">
        <div className="card-heading-title">
          <div className="card-icon small-card-icon blue"><Sparkles size={19} /></div>
          <div>
            <span className="card-eyebrow">الذكاء الاصطناعي</span>
            <h2>ارفع ملف الشرح وهنعمل لك الاسئله</h2>
          </div>
        </div>
      </div>

      <div className="upload-box-container">
        <input
          type="file"
          id="material-upload-input"
          accept=".pdf,.docx,.txt"
          onChange={onFileUpload}
          hidden
        />
        <label htmlFor="material-upload-input" className="upload-dropzone">
          <UploadCloud size={26} />
          <span>
            {data.isUploading
              ? "جاري تحليل المستند وتوليد الأسئلة..."
              : "إسقاط ملف PDF جديد هنا أو اضغط للرفع"}
          </span>
          <small>سيتم استخراج أسئلة تلقائية بالذكاء الاصطناعي للحصة الحالية</small>
        </label>

        {data.session?.files?.length > 0 && (
          <div className="attached-files-list">
            {data.session.files.map((f, idx) => (
              <div key={idx} className="field attached-file-field">
                <FileText size={14} /> الملف المرفق: <b>{f.name}</b>
                <a href={f.url} target="_blank" rel="noreferrer">(عرض)</a>
                <button
                  type="button"
                  className="attached-file-remove"
                  onClick={() => onRemoveFile(idx)}
                  title="حذف الملف"
                  aria-label={`حذف الملف ${f.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}