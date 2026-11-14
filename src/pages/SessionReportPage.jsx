// src/pages/SessionReportPage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, BarChart3, Download, FileText, Trophy, UserCheck, Users, Zap } from "lucide-react";
import { reportApi } from "../api/report.api";
import { sessionApi } from "../api/session.api";
import Loading from "../components/ui/Loading.jsx";

const TABS = [
  { id: "summary", label: "ملخص", icon: BarChart3 },
  { id: "questions", label: "الأسئلة", icon: FileText },
  { id: "students", label: "الطلاب", icon: Users },
  { id: "attendance", label: "الحضور", icon: UserCheck },
  { id: "commands", label: "الأوامر", icon: Zap },
];

function fmtSeconds(sec) {
  if (!sec) return "0 ث";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m} د ${s} ث` : `${s} ث`;
}

export default function SessionReportPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("summary");
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await reportApi.exportXlsx(sessionId);
      const { buffer, filename } = res.data;
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e.message || "تعذّر تصدير الملف");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sessRes = await sessionApi.getById(sessionId);
        if (cancelled) return;
        setSession(sessRes.data);

        const [sum, qs, st, at, cm] = await Promise.all([
          reportApi.getSummary(sessionId),
          reportApi.getQuestions(sessionId),
          reportApi.getStudents(sessionId),
          reportApi.getAttendance(sessionId),
          reportApi.getCommandLog(sessionId),
        ]);
        if (cancelled) return;
        setSummary(sum.data);
        setQuestions(qs.data);
        setStudents(st.data);
        setAttendance(at.data);
        setCommands(cm.data);
      } catch (e) {
        if (!cancelled) setError(e.message || "تعذّر تحميل التقرير");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="page">
        <Loading description="ثانية" title="بنحضّر التقرير..." />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="page">
        <div className="card stack-card">
          <p className="error-alert">{error || "التقرير مش متاح"}</p>
          <button className="button button-primary turquoise" onClick={() => navigate("/sessions")}>
            <ArrowRight size={16} /> رجوع للجلسات
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
            <BarChart3 size={13} /> تقرير الجلسة
          </span>
          <h1>{session.title}</h1>
          <p>
            كود {session.code} · {summary?.totalParticipants} طالب · {fmtSeconds(summary?.durationSeconds)}
          </p>
        </div>
        <div className="heading-meta">
          <button className="button button-primary turquoise" disabled={exporting} type="button" onClick={handleExport}>
            <Download size={15} /> {exporting ? "بنحضّر الملف..." : "تصدير Excel"}
          </button>
          <Link className="button button-primary ghost" to="/sessions">
            <ArrowRight size={16} /> رجوع
          </Link>
        </div>
        {exportError && <p className="error-alert">{exportError}</p>}
      </header>

      <main className="dashboard">
        <section className="card stack-card">
          <div className="type-selector grid-tabs-5">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  className={`type-chip${activeTab === t.id ? " selected" : ""}`}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  key={t.id}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === "summary" && <SummaryTab summary={summary} />}
          {activeTab === "questions" && <QuestionsTab rows={questions} />}
          {activeTab === "students" && <StudentsTab rows={students} />}
          {activeTab === "attendance" && <AttendanceTab rows={attendance} />}
          {activeTab === "commands" && <CommandsTab rows={commands} />}
        </section>
      </main>
    </div>
  );
}

function SummaryTab({ summary }) {
  if (!summary) return null;
  return (
    <div className="stack-card">
      <div className="grid-stats">
        <StatCard label="المشاركين" value={summary.totalParticipants} />
        <StatCard label="الأسئلة" value={summary.totalQuestions} />
        <StatCard label="المدة" value={fmtSeconds(summary.durationSeconds)} />
        <StatCard label="متوسط النقاط" value={summary.averageScore} />
        <StatCard label="% الإجابات الصح" tone="success" value={`${summary.correctPercentage}%`} />
      </div>

      {summary.topPlayers.length > 0 && (
        <div>
          <h3 className="mt-8">
            <Trophy size={16} className="v-middle" /> المتصدرين
          </h3>
          <table className="students-table">
            <thead>
              <tr>
                <th className="report-col-60">#</th>
                <th>الاسم</th>
                <th className="report-col-120">النقاط</th>
              </tr>
            </thead>
            <tbody>
              {summary.topPlayers.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {summary.hardestQuestion && (
        <div>
          <h3 className="mt-8">أصعب سؤال</h3>
          <div className="field report-field-gap-4">
            <div className="report-bold">{summary.hardestQuestion.text}</div>
            <div className="text-info-soft">
              {summary.hardestQuestion.correctPercentage}% إجابات صح · {summary.hardestQuestion.answersCount} إجابة
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionsTab({ rows }) {
  if (rows.length === 0) return <p className="muted">مفيش بيانات.</p>;
  return (
    <div className="stack-card">
      {rows.map((q) => (
        <div className="field report-field-gap-6" key={q.questionId}>
          <div className="card-heading">
            <div>
              <span className="card-eyebrow">سؤال {q.questionIndex}</span>
              <div className="report-bold">{q.text}</div>
            </div>
            <span className={`status-badge ${q.correctPercentage >= 50 ? "status-badge-late" : "status-badge-inactive"}`}>
              {q.correctPercentage}% صح
            </span>
          </div>
          <div className="report-info-row">
            <span>أجابوا: {q.answeredCount}</span>
            <span>صح: {q.correctCount}</span>
            <span>ما شافوهوش: {q.skippedCount}</span>
            <span>انتهى وقتهم: {q.timedOutCount}</span>
          </div>
          {q.mostCommonWrong && (
            <div className="text-danger-soft">
              أكتر غلطة: {q.mostCommonWrong.optionText} ({q.mostCommonWrong.count})
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StudentsTab({ rows }) {
  return (
    <table className="students-table">
      <thead>
        <tr>
          <th>#</th><th>الاسم</th><th>النقاط</th><th>صح</th><th>غلط</th>
          <th>أجاب</th><th>متوسط الزمن</th><th>Streak</th><th>الحضور</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.studentId}>
            <td>{s.rank}</td>
            <td>{s.name}</td>
            <td>{s.score}</td>
            <td>{s.correctAnswers}</td>
            <td>{s.wrongAnswers}</td>
            <td>{s.answeredQuestions}/{s.totalQuestions}</td>
            <td>{Math.round(s.avgResponseMs / 100) / 10}s</td>
            <td>🔥 {s.highestStreak}</td>
            <td>
              <span className={`status-badge ${s.attendanceStatus === "PRESENT" ? "status-badge-late" : "status-badge-inactive"}`}>
                {s.attendanceStatus === "PRESENT" ? "حاضر" : "غايب"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AttendanceTab({ rows }) {
  const present = rows.filter((r) => r.status === "PRESENT").length;
  return (
    <div className="stack-card">
      <div className="card-heading">
        <h3><UserCheck size={16} className="v-middle" /> الحضور</h3>
        <span className="count-pill">{present} / {rows.length} حاضر</span>
      </div>
      <table className="students-table">
        <thead>
          <tr>
            <th>الاسم</th><th>أجاب</th><th>من إجمالي</th><th>مدة الحضور</th><th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.studentId}>
              <td>{r.name}</td>
              <td>{r.answeredQuestions}</td>
              <td>{r.totalQuestions}</td>
              <td>{fmtSeconds(r.durationSeconds)}</td>
              <td>
                <span className={`status-badge ${r.status === "PRESENT" ? "status-badge-late" : "status-badge-inactive"}`}>
                  {r.status === "PRESENT" ? "حاضر" : "غايب"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CommandsTab({ rows }) {
  if (rows.length === 0) return <p className="muted">مفيش أوامر مستخدمة في الجلسة.</p>;
  return (
    <table className="students-table">
      <thead>
        <tr>
          <th>الأمر</th><th>بواسطة</th><th>الهدف</th><th>القيمة</th><th>السؤال</th><th>الوقت</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((c) => {
          const icon = c.command === "gift" ? "🎁" : c.command === "thief" ? "🥷" : "🚀";
          return (
            <tr key={c.id}>
              <td>{icon} {c.command}</td>
              <td>{c.actorName}</td>
              <td>{c.targetName || "—"}</td>
              <td>{c.value ?? "—"}</td>
              <td>{c.questionIndex ?? "—"}</td>
              <td>{new Date(c.createdAt).toLocaleTimeString("ar-EG")}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function StatCard({ label, value, tone }) {
  const isSuccess = tone === "success";
  return (
    <div className={`field report-stat-card${isSuccess ? " is-success" : ""}`}>
      <span className="report-stat-label">{label}</span>
      <strong className={`report-stat-value${isSuccess ? " is-success" : ""}`}>{value}</strong>
    </div>
  );
}