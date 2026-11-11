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
  );
}

export default InstructorView;