// src/pages/RosterPage.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock3,
  FileUp,
  History,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../store/auth.store.jsx";
import { useRoster, useStudentHistory } from "../store/roster.store.jsx";
import StudentAvatar from "../components/student/StudentAvatar.jsx";
import Loading from "../components/ui/Loading.jsx";
import {
  AVATAR_PRESETS,
  DEFAULT_AVATAR,
  SECTION_DESCRIPTION_MAX_LENGTH,
  SECTION_NAME_MAX_LENGTH,
  STUDENT_NAME_MAX_LENGTH,
  STUDENT_NICKNAME_MAX_LENGTH,
  buildStudentPatch,
  buildStudentPayload,
  parseImportText,
} from "../adapters/roster.adapter.js";
import "../styles/roster.css";

const STATUS_LABELS = {
  PRESENT: "حاضر",
  ABSENT: "غائب",
  KICKED: "مطرد",
  PENDING: "معلّق",
};

const STATUS_CLASS = {
  PRESENT: "green",
  ABSENT: "red",
  KICKED: "orange",
  PENDING: "blue",
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDuration(ms) {
  const seconds = Math.round((Number(ms) || 0) / 1000);

  if (seconds < 60) return `${seconds} ث`;

  const minutes = Math.floor(seconds / 60);
  return `${minutes} د ${seconds % 60} ث`;
}

function SectionFormModal({ section, onSubmit, onClose }) {
  const [draft, setDraft] = useState({
    name: section?.name || "",
    description: section?.description || "",
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await onSubmit(draft);
      onClose();
    } catch (e) {
      setError(e.message || "تعذّر حفظ القسم");
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
              {section ? <Pencil size={22} /> : <Plus size={22} />}
            </div>
            <div>
              <span className="card-kicker">الأقسام</span>
              <h2 className="modal-title">
                {section ? "تعديل القسم" : "قسم جديد"}
              </h2>
            </div>
          </div>
          <button
            aria-label="إغلاق"
            className="modal-close-button"
            onClick={onClose}
            type="button"
          >
            <X size={17} />
          </button>
        </div>

        <form className="modal-content" onSubmit={handleSubmit}>
          <label>اسم القسم</label>
          <div className="input-wrap">
            <input
              maxLength={SECTION_NAME_MAX_LENGTH}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="مثال: الصف الثاني - أ"
              required
              type="text"
              value={draft.name}
            />
          </div>

          <label>الوصف (اختياري)</label>
          <div className="question-input-wrap">
            <textarea
              maxLength={SECTION_DESCRIPTION_MAX_LENGTH}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="وصف قصير للقسم..."
              rows={3}
              value={draft.description}
            />
          </div>

          {error && <p className="error-alert">{error}</p>}

          <div className="modal-actions">
            <button
              className="button modal-button white"
              onClick={onClose}
              type="button"
            >
              إلغاء
            </button>
            <button
              className="button modal-button turquoise"
              disabled={busy}
              type="submit"
            >
              {busy ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function StudentFormModal({
  student,
  sections,
  avatarOptions,
  defaultSection,
  onSubmit,
  onClose,
}) {
  const [draft, setDraft] = useState({
    name: student?.name || "",
    nickname: student?.nickname || "",
    section: student?.sectionId || defaultSection || sections[0]?.id || "",
    avatar: student?.avatar || avatarOptions.default || DEFAULT_AVATAR,
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const presetLabel = (id) =>
    AVATAR_PRESETS.find((preset) => preset.id === id)?.emoji || "🙂";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const payload = student
        ? buildStudentPatch(draft)
        : buildStudentPayload(draft);

      await onSubmit(payload);
      onClose();
    } catch (e) {
      setError(e.message || "تعذّر حفظ الطالب");
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
            <div className="card-icon yellow">
              {student ? <Pencil size={22} /> : <UserPlus size={22} />}
            </div>
            <div>
              <span className="card-kicker">الطلاب</span>
              <h2 className="modal-title">
                {student ? "تعديل الطالب" : "طالب جديد"}
              </h2>
            </div>
          </div>
          <button
            aria-label="إغلاق"
            className="modal-close-button"
            onClick={onClose}
            type="button"
          >
            <X size={17} />
          </button>
        </div>

        <form className="modal-content" onSubmit={handleSubmit}>
          {sections.length === 0 ? (
            <p className="error-alert">
              أضف قسم أولًا قبل ما تضيف طالب.
            </p>
          ) : (
            <>
              <div className="roster-form-grid">
                <div>
                  <label>اسم الطالب</label>
                  <div className="input-wrap">
                    <input
                      maxLength={STUDENT_NAME_MAX_LENGTH}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                      placeholder="اسم الطالب"
                      required
                      type="text"
                      value={draft.name}
                    />
                  </div>
                </div>

                <div>
                  <label>اسم الشهرة (اختياري)</label>
                  <div className="input-wrap">
                    <input
                      maxLength={STUDENT_NICKNAME_MAX_LENGTH}
                      onChange={(e) =>
                        setDraft({ ...draft, nickname: e.target.value })
                      }
                      placeholder="اسم يظهر في اللعبة"
                      type="text"
                      value={draft.nickname}
                    />
                  </div>
                </div>
              </div>

              <label>القسم</label>
              <div className="input-wrap">
                <select
                  onChange={(e) =>
                    setDraft({ ...draft, section: e.target.value })
                  }
                  required
                  value={draft.section}
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="roster-avatar-preview">
                <StudentAvatar avatar={draft.avatar} size={64} />
                <div>
                  <strong>
                    {AVATAR_PRESETS.find(
                      (preset) => preset.id === draft.avatar.preset
                    )?.label || "أفاتار"}
                  </strong>
                  <small>{draft.avatar.color}</small>
                </div>
              </div>

              <label>شكل الأفاتار</label>
              <div className="avatar-preset-grid">
                {avatarOptions.presets.map((preset) => {
                  const selected = draft.avatar.preset === preset.id;

                  return (
                    <button
                      aria-pressed={selected}
                      className={`avatar-preset${selected ? " is-selected" : ""}`}
                      key={preset.id}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          avatar: { ...draft.avatar, preset: preset.id },
                        })
                      }
                      title={preset.label}
                      type="button"
                    >
                      <span aria-hidden="true">{presetLabel(preset.id)}</span>
                      <small>{preset.id}</small>
                      {selected && <Check size={12} />}
                    </button>
                  );
                })}
              </div>

              <label>لون الأفاتار</label>
              <div className="avatar-color-grid">
                {avatarOptions.colors.map((color) => {
                  const selected = draft.avatar.color === color.id;

                  return (
                    <button
                      aria-label={color.label}
                      aria-pressed={selected}
                      className={`avatar-color-swatch${selected ? " is-selected" : ""}`}
                      key={color.id}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          avatar: { ...draft.avatar, color: color.id },
                        })
                      }
                      style={{ "--swatch-color": color.id }}
                      title={color.label}
                      type="button"
                    >
                      {selected && <Check size={13} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {error && <p className="error-alert">{error}</p>}

          <div className="modal-actions">
            <button
              className="button modal-button white"
              onClick={onClose}
              type="button"
            >
              إلغاء
            </button>
            <button
              className="button modal-button turquoise"
              disabled={busy || sections.length === 0}
              type="submit"
            >
              {busy ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ImportStudentsModal({
  sections,
  defaultSection,
  onSubmit,
  onClose,
}) {
  const [section, setSection] = useState(
    defaultSection || sections[0]?.id || ""
  );
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const lineCount = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    let students;

    try {
      students = parseImportText(text);
    } catch (e) {
      setError(e.message || "راجع صيغة الأسماء");
      return;
    }

    setBusy(true);

    try {
      await onSubmit(section, students);
      onClose();
    } catch (e) {
      setError(e.message || "تعذّر استيراد الطلاب");
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
            <div className="card-icon blue">
              <FileUp size={22} />
            </div>
            <div>
              <span className="card-kicker">استيراد جماعي</span>
              <h2 className="modal-title">استيراد طلاب</h2>
            </div>
          </div>
          <button
            aria-label="إغلاق"
            className="modal-close-button"
            onClick={onClose}
            type="button"
          >
            <X size={17} />
          </button>
        </div>

        <form className="modal-content" onSubmit={handleSubmit}>
          <label>القسم</label>
          <div className="input-wrap">
            <select
              onChange={(e) => setSection(e.target.value)}
              required
              value={section}
            >
              {sections.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <label>الأسماء (اسم واحد في كل سطر)</label>
          <div className="question-input-wrap">
            <textarea
              onChange={(e) => setText(e.target.value)}
              placeholder={"أحمد علي, أحمد\nسارة محمد, سارة"}
              rows={8}
              value={text}
            />
          </div>

          <div className="roster-import-tools">
            <label className="button button-primary ghost roster-file-button">
              <FileUp size={15} /> اختار ملف CSV / TXT
              <input
                accept=".csv,.txt,text/csv,text/plain"
                hidden
                onChange={handleFile}
                type="file"
              />
            </label>
            <span className="count-pill">{lineCount} طالب</span>
          </div>

          <p className="card-description">
            كل سطر: <b>اسم الطالب</b> ثم فاصلة ثم اسم الشهرة (اختياري). أقصى
            500 طالب في المرة.
          </p>

          {error && <p className="error-alert">{error}</p>}

          <div className="modal-actions">
            <button
              className="button modal-button white"
              onClick={onClose}
              type="button"
            >
              إلغاء
            </button>
            <button
              className="button modal-button turquoise"
              disabled={busy || !section || !text.trim()}
              type="submit"
            >
              {busy ? "جاري الاستيراد..." : "استيراد"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function StudentHistoryModal({ student, onClose }) {
  const { history, loading, error } = useStudentHistory(student.id, {
    limit: 20,
  });

  return (
    <div
      className="opened-window-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <section
        className="card modal-window roster-history-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="card-heading">
          <div className="card-heading-title">
            <StudentAvatar avatar={student.avatar} size={48} />
            <div>
              <span className="card-kicker">سجل الطالب</span>
              <h2 className="modal-title">{student.name}</h2>
            </div>
          </div>
          <button
            aria-label="إغلاق"
            className="modal-close-button"
            onClick={onClose}
            type="button"
          >
            <X size={17} />
          </button>
        </div>

        <div className="modal-content">
          {loading && <Loading description="ثانية" title="بنحمّل السجل..." />}
          {error && <p className="error-alert">{error}</p>}

          {!loading && !error && history && (
            <>
              <div className="roster-summary-grid">
                <div className="field roster-summary-item">
                  <span>الجلسات</span>
                  <strong>{history.summary.sessions}</strong>
                </div>
                <div className="field roster-summary-item">
                  <span>حضر</span>
                  <strong>{history.summary.present}</strong>
                </div>
                <div className="field roster-summary-item">
                  <span>غاب</span>
                  <strong>{history.summary.absent}</strong>
                </div>
                <div className="field roster-summary-item">
                  <span>الدقة</span>
                  <strong>{history.summary.accuracyPercentage}%</strong>
                </div>
                <div className="field roster-summary-item">
                  <span>متوسط النقاط</span>
                  <strong>{history.summary.averageScore}</strong>
                </div>
                <div className="field roster-summary-item">
                  <span>أفضل نتيجة</span>
                  <strong>{history.summary.bestScore}</strong>
                </div>
              </div>

              {history.history.length === 0 ? (
                <div className="empty-questions">
                  <History size={24} />
                  <strong>مفيش سجل لسه</strong>
                  <span>السجل هيظهر بعد ما الطالب يشارك في جلسة وتخلص.</span>
                </div>
              ) : (
                <div className="roster-history-list">
                  {history.history.map((record) => (
                    <article
                      className="field roster-history-item"
                      key={record.id}
                    >
                      <div className="roster-history-topline">
                        <span
                          className={`question-info ${STATUS_CLASS[record.status] || "blue"}`}
                        >
                          {STATUS_LABELS[record.status] || record.status}
                        </span>
                        {record.finalRank && (
                          <span className="question-info highlight">
                            #{record.finalRank}
                          </span>
                        )}
                        {record.late && (
                          <span className="question-info turquoise">
                            <Clock3 size={11} /> متأخر
                          </span>
                        )}
                        <span className="roster-history-date">
                          {formatDate(record.sessionEndedAt)}
                        </span>
                      </div>

                      <h3>{record.quizTitle || "جلسة"}</h3>

                      <div className="roster-history-stats">
                        <span>
                          <b>{record.score}</b> نقطة
                        </span>
                        <span>
                          <b>{record.correctCount}</b> / {record.answeredCount}{" "}
                          صح
                        </span>
                        <span>
                          دقة <b>{record.accuracyPercentage}%</b>
                        </span>
                        <span>
                          <Clock3 size={12} />{" "}
                          {formatDuration(record.averageResponseTimeMs)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default function RosterPage() {
  const { user } = useAuth();
  const canWrite = user?.role === "OWNER" || user?.role === "TEACHER";
  const roster = useRoster();
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [sectionModal, setSectionModal] = useState(null);
  const [studentModal, setStudentModal] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState(null);

  const sectionsById = useMemo(
    () => new Map(roster.sections.map((section) => [section.id, section])),
    [roster.sections]
  );

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    return roster.students.filter((student) => {
      if (sectionFilter && student.sectionId !== sectionFilter) return false;
      if (!term) return true;

      return (
        student.name.toLowerCase().includes(term) ||
        student.nickname.toLowerCase().includes(term)
      );
    });
  }, [roster.students, search, sectionFilter]);

  const handleDeleteSection = async (section) => {
    if (
      !window.confirm(
        `حذف قسم "${section.name}"؟ لا يمكن حذف قسم فيه طلاب.`
      )
    ) {
      return;
    }

    try {
      await roster.deleteSection(section.id);
      if (sectionFilter === section.id) setSectionFilter("");
    } catch (e) {
      alert(e.message || "تعذّر حذف القسم");
    }
  };

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`حذف الطالب "${student.name}"؟`)) return;

    try {
      await roster.deleteStudent(student.id);
    } catch (e) {
      alert(e.message || "تعذّر حذف الطالب");
    }
  };

  if (roster.loading) {
    return (
      <div className="page">
        <Loading description="ثانية" title="بنحمّل الطلاب والأقسام..." />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="card page-heading">
        <div>
          <span className="page-eyebrow">
            <Users size={13} /> الطلاب والأقسام
          </span>
          <h1>دليل الفصل</h1>
          <p>
            نظّم الأقسام والطلاب، اختار أفاتار لكل طالب، وتابع سجله في الجلسات.
          </p>
        </div>
        <div className="heading-meta">
          <span className="count-pill">{roster.sections.length} قسم</span>
          <span className="count-pill">{roster.students.length} طالب</span>
          <Link className="button button-primary ghost" to="/instructor-dashboard">
            <ArrowRight size={16} /> رجوع
          </Link>
        </div>
      </header>

      <main className="dashboard">
        {roster.error && <p className="error-alert">{roster.error}</p>}

        <div className="roster-layout">
          <aside className="card stack-card roster-sidebar">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon small-card-icon turquoise">
                  <Users size={19} />
                </div>
                <div>
                  <h2>الأقسام</h2>
                </div>
              </div>
              {canWrite && (
                <button
                  aria-label="قسم جديد"
                  className="small-icon-button turquoise-icon"
                  onClick={() => setSectionModal({ mode: "create" })}
                  title="قسم جديد"
                  type="button"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            <button
              className={`roster-section-item${sectionFilter === "" ? " is-active" : ""}`}
              onClick={() => setSectionFilter("")}
              type="button"
            >
              <span>كل الطلاب</span>
              <b>{roster.students.length}</b>
            </button>

            {roster.sections.length === 0 ? (
              <p className="card-description">
                لسه مفيش أقسام. أضف قسم عشان تقدر تضيف طلاب.
              </p>
            ) : (
              <div className="roster-section-list">
                {roster.sections.map((section) => (
                  <div
                    className={`roster-section-item${sectionFilter === section.id ? " is-active" : ""}`}
                    key={section.id}
                  >
                    <button
                      className="roster-section-select"
                      onClick={() => setSectionFilter(section.id)}
                      type="button"
                    >
                      <span>
                        <strong>{section.name}</strong>
                        {section.description && (
                          <small>{section.description}</small>
                        )}
                      </span>
                      <b>{section.studentCount}</b>
                    </button>

                    {canWrite && (
                      <div className="roster-section-actions">
                        <button
                          aria-label={`تعديل ${section.name}`}
                          className="small-icon-button turquoise-icon"
                          onClick={() =>
                            setSectionModal({ mode: "edit", section })
                          }
                          title="تعديل"
                          type="button"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          aria-label={`حذف ${section.name}`}
                          className="small-icon-button red-icon"
                          onClick={() => handleDeleteSection(section)}
                          title="حذف"
                          type="button"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </aside>

          <section className="card stack-card roster-main">
            <div className="card-heading roster-toolbar">
              <div className="input-wrap roster-search">
                <Search size={16} />
                <input
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو اسم الشهرة..."
                  type="search"
                  value={search}
                />
              </div>

              {canWrite && (
                <div className="roster-toolbar-actions">
                  <button
                    className="button button-primary ghost"
                    disabled={roster.sections.length === 0}
                    onClick={() => setImportOpen(true)}
                    type="button"
                  >
                    <FileUp size={15} /> استيراد
                  </button>
                  <button
                    className="button button-primary turquoise"
                    disabled={roster.sections.length === 0}
                    onClick={() => setStudentModal({ mode: "create" })}
                    type="button"
                  >
                    <UserPlus size={16} /> طالب جديد
                  </button>
                </div>
              )}
            </div>

            <div className="roster-list-heading">
              <span>
                {sectionFilter
                  ? sectionsById.get(sectionFilter)?.name || "قسم"
                  : "كل الطلاب"}
              </span>
              <span className="count-pill">{filteredStudents.length} طالب</span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="empty-questions">
                <Users size={26} />
                <strong>
                  {search ? "مفيش نتائج مطابقة" : "مفيش طلاب هنا لسه"}
                </strong>
                <span>
                  {search
                    ? "جرّب اسم تاني"
                    : canWrite
                      ? "أضف طالب أو استورد قائمة كاملة."
                      : "المدرس لسه مضافش طلاب."}
                </span>
              </div>
            ) : (
              <div className="roster-student-grid">
                {filteredStudents.map((student) => (
                  <article className="field roster-student-card" key={student.id}>
                    <div className="roster-student-head">
                      <StudentAvatar avatar={student.avatar} size={48} />
                      <div className="roster-student-name">
                        <strong>{student.name}</strong>
                        <small>
                          {student.nickname || "بدون اسم شهرة"}
                        </small>
                      </div>
                    </div>

                    <span className="question-info blue">
                      {sectionsById.get(student.sectionId)?.name || "قسم"}
                    </span>

                    <div className="roster-student-actions">
                      <button
                        className="small-icon-button blue-icon"
                        onClick={() => setHistoryStudent(student)}
                        title="السجل"
                        type="button"
                      >
                        <BarChart3 size={14} />
                      </button>
                      {canWrite && (
                        <>
                          <button
                            className="small-icon-button turquoise-icon"
                            onClick={() =>
                              setStudentModal({ mode: "edit", student })
                            }
                            title="تعديل"
                            type="button"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="small-icon-button red-icon"
                            onClick={() => handleDeleteStudent(student)}
                            title="حذف"
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {sectionModal && (
        <SectionFormModal
          onClose={() => setSectionModal(null)}
          onSubmit={
            sectionModal.mode === "edit"
              ? (draft) =>
                  roster.updateSection(sectionModal.section.id, draft)
              : (draft) => roster.createSection(draft)
          }
          section={sectionModal.section}
        />
      )}

      {studentModal && (
        <StudentFormModal
          avatarOptions={roster.avatarOptions}
          defaultSection={sectionFilter}
          onClose={() => setStudentModal(null)}
          onSubmit={
            studentModal.mode === "edit"
              ? (patch) =>
                  roster.updateStudent(studentModal.student.id, patch)
              : (payload) => roster.createStudent(payload)
          }
          sections={roster.sections}
          student={studentModal.student}
        />
      )}

      {importOpen && (
        <ImportStudentsModal
          defaultSection={sectionFilter}
          onClose={() => setImportOpen(false)}
          onSubmit={(sectionId, students) =>
            roster.importStudents(sectionId, students)
          }
          sections={roster.sections}
        />
      )}

      {historyStudent && (
        <StudentHistoryModal
          onClose={() => setHistoryStudent(null)}
          student={historyStudent}
        />
      )}
    </div>
  );
}
