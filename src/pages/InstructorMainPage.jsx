<<<<<<< Updated upstream:src/pages/InstructorView.jsx
// src/pages/InstructorView.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../mock-api/auth.js";
import { useSessionEditor } from "../hooks/useSessionEditor.js";
import { useQuestionsForm } from "../hooks/useQuestionsForm.js";
import { useCountdown } from "../hooks/useCountdown.js";
import { useSessions } from "../hooks/useSessions.js";
import { useLiveSession } from "../hooks/useLiveSession.js";
import { useInstructorHandlers } from "../hooks/useInstructorHandlers.js";

import SessionFormWindow from "../modals/SessionFormWindow.jsx";
import QuestionFormWindow from "../modals/QuestionFormWindow.jsx";
import DeleteSessionAlert from "../modals/DeleteSessionAlert.jsx";
import EndLiveSessionAlert from "../modals/EndLiveSessionAlert.jsx";
import ReopenSessionAlert from "../modals/ReopenSessionAlert.jsx";

import LiveView from "../components/instructor/LiveView.jsx";
import DashboardView from "../components/instructor/DashboardView.jsx";

import "../styles/Instructor-page.css";

function InstructorView() {
=======
// src/pages/InstructorMainPage.jsx
import { Link, useNavigate } from "react-router-dom";
import { Building2, Library, LogOut, Radio, Sparkles } from "lucide-react";
import { useAuth } from "../store/auth.store.jsx";
import "../styles/Instructor-page.css";

export default function InstructorMainPage() {
>>>>>>> Stashed changes:src/pages/InstructorMainPage.jsx
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const data   = useSessions();
  const editor = useSessionEditor(data);
  const live   = useLiveSession(data.session, data.setSession);

  const question = useQuestionsForm({
    session: data.session,
    updateQuestions: data.updateQuestions,
  });

  const countdown = useCountdown({
    active: live.isLive && live.liveState === "countdown",
    seconds: 3,
    onEnd: live.startQuestion,
  });

  const {
    handleLogout,
    handleFileUpload,
    handleRemoveFile,
    handleStartLiveSession,
    handleSendNotification,
  } = useInstructorHandlers({ data, live });

  return (
<<<<<<< Updated upstream:src/pages/InstructorView.jsx
    <>
      {live.isLive ? (
        <LiveView
          live={live}
          countdown={countdown}
          onSendNotification={handleSendNotification}
          onRemoveStudent={data.removeStudent}
          onOpenReopenModal={live.reopenModal.open}
        />
      ) : (
        <DashboardView
          handleLogout={handleLogout}
          data={data}
          editor={editor}
          question={question}
          onStartLiveSession={handleStartLiveSession}
          onFileUpload={handleFileUpload}
          onRemoveFile={handleRemoveFile}
        />
      )}

      {editor.formModal.isOpen && (
        <SessionFormWindow
          initialData={editor.formModal.mode === "edit" ? data.session : null}
          onClose={editor.formModal.close}
          onSubmit={editor.saveSession}
        />
      )}

      {editor.deleteModal.isOpen && (
        <DeleteSessionAlert
          onClose={editor.deleteModal.close}
          onConfirm={editor.confirmDelete}
          sessionTitle={data.session?.title}
        />
      )}

      {question.formOpen && data.session && (
        <QuestionFormWindow
          question={question}
          sessionId={data.session.id}
        />
      )}

      {live.isEndConfirmOpen && (
        <EndLiveSessionAlert
          onClose={live.cancelEndLive}
          onConfirm={() => live.confirmEndLive()}
          sessionCode={live.liveSession?.code}
        />
      )}

      {live.reopenModal.isOpen && (
        <ReopenSessionAlert
          pendingCount={live.pendingStudents.length}
          totalStudents={live.liveSession?.students?.length ?? 0}
          defaultAllowEdit={false}
          onClose={live.reopenModal.close}
          onConfirm={(allowEdit) => {
            live.confirmReopen(allowEdit);
            live.reopenModal.close();
          }}
        />
      )}
    </>
=======
    <div className="page">
      <header className="card page-heading">
        <div>
          <span className="page-eyebrow"><Sparkles size={13} /> مساحة المحاضر</span>
          <h1>أهلاً {user?.name || "بك"} 👋</h1>
          <p>اختار من فين تحب تبدأ — كويزاتك، جلساتك، ولا إعدادات المنظمة.</p>
        </div>
        <div className="heading-meta">
          <button className="button icon-button red-icon" title="تسجيل الخروج" type="button" onClick={handleLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="dashboard">
        <div className="grid-cards-280">
          <Link className="card link-card" to="/library">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon turquoise"><Library size={24} /></div>
                <div>
                  <span className="card-eyebrow">كويزاتك</span>
                  <h2>المكتبة</h2>
                </div>
              </div>
            </div>
            <p className="card-description">
              أنشئ، عدّل، كرر، وأرشف الكويزات. جهّز أسئلتك هنا قبل ما تفتح جلسة.
            </p>
            <span className="card-eyebrow">من هنا →</span>
          </Link>

          <Link className="card link-card" to="/sessions">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon yellow"><Radio size={24} /></div>
                <div>
                  <span className="card-eyebrow">جلسات اللايف</span>
                  <h2>الجلسات</h2>
                </div>
              </div>
            </div>
            <p className="card-description">
              افتح جلسة من كويز جاهز، شير الكود مع طلابك، وتحكم في اللعب live.
            </p>
            <span className="card-eyebrow">من هنا →</span>
          </Link>

          <Link className="card link-card" to="/organization">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon blue"><Building2 size={24} /></div>
                <div>
                  <span className="card-eyebrow">الفريق</span>
                  <h2>المنظمة</h2>
                </div>
              </div>
            </div>
            <p className="card-description">
              إدارة بيانات المنظمة والأعضاء (مدرسين ومساعدين)، والصلاحيات.
            </p>
            <span className="card-eyebrow">من هنا →</span>
          </Link>
        </div>
      </main>
    </div>
>>>>>>> Stashed changes:src/pages/InstructorMainPage.jsx
  );
}

export default InstructorView;