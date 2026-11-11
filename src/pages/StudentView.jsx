// src/pages/StudentView.jsx
import { useEffect } from "react";
import { useCountdown } from "../hooks/useCountdown.js";
import { useTick } from "../hooks/useTick.js";
import { useHeartbeat } from "../hooks/useHeartbeat.js";
import { useVisibilityTracking } from "../hooks/useVisibilityTracking.js";
import { useSessionSubscription } from "../hooks/useSessionSubscription.js";
import { useReaction } from "../hooks/useReaction.js";
import { useQuestionSeen } from "../hooks/useQuestionSeen.js";
import { useFocusNotification } from "../hooks/useFocusNotification.js";
import { useStateReaction } from "../hooks/useStateReaction.js";
import { useReopenedQuestion } from "../hooks/useReopenedQuestion.js";
import { useAnswerSubmit } from "../hooks/useAnswerSubmit.js";
import { useStudentSession } from "../hooks/useStudentSession.js";
import { useStudentHandlers } from "../hooks/useStudentHandlers.js";
import {
  getQuestions,
  computeTimeLeft,
  computeAnswerState,
} from "../utils/studentView.js";
import { Reaction } from "../components/Reaction.jsx";

import JoinScreen from "../components/student/JoinScreen.jsx";
import Leaderboard from "../components/student/Leaderboard.jsx";
import NameChangeWarning from "../components/student/NameChangeWarning.jsx";
import NoInteractionWarning from "../components/student/NoInteractionWarning.jsx";
import LiveStatePanel from "../components/student/LiveStatePanel.jsx";
import QuestionPanel from "../components/student/QuestionPanel.jsx";

import "../styles/student-page.css";
import "../styles/reactions.css";

function StudentView() {
  const sessionApi = useStudentSession();
  const { joined, error } = sessionApi;

  const session        = joined?.session ?? null;
  const live           = session?.live || {};
  const liveState      = live.isLive ? live.state : "not-started";
  const questions      = getQuestions(session);
  const questionIndex  = live.currentQuestionIndex ?? 0;
  const currentQuestion = questions[questionIndex] || null;
  const duration       = Number(currentQuestion?.duration) || 30;

  const { now, refresh } = useTick(liveState === "question" || liveState === "reopened");
  const timeLeft = computeTimeLeft(live, duration, now);

  const studentAnswers = (session && joined?.student)
    ? (session.answers?.[joined.student.id] || {})
    : {};
  const currentAnswer = currentQuestion ? studentAnswers[currentQuestion.id] : null;

  const freshStudent = session?.students?.find((s) => s.id === joined?.student?.id)
    || joined?.student;

  const isCountdown = live.state === "countdown";
  const { remaining: countdownRemaining } = useCountdown({ active: isCountdown, seconds: 3 });

  const { reaction, triggerReaction, clearReaction } = useReaction();

  useQuestionSeen({
    liveState,
    questionId: currentQuestion?.id,
    studentId: joined?.student?.id,
    sessionId: session?.id,
  });
  useHeartbeat(session?.id, joined?.student?.id);
  useVisibilityTracking(session?.id, joined?.student?.id);
  useStateReaction({
    isLive: !!live.isLive,
    liveState: live.state,
    sessionId: session?.id,
    onTrigger: triggerReaction,
  });
  useFocusNotification({
    notification: freshStudent?.activeNotification,
    sessionId: session?.id,
    studentId: freshStudent?.id,
    onTrigger: triggerReaction,
  });
  useSessionSubscription({
    sessionId: session?.id,
    studentId: joined?.student?.id,
    onSessionGone: () => sessionApi.handleExternalRemoval("تم إنهاء الحصة من قِبل المدرس"),
    onStudentKicked: () => sessionApi.handleExternalRemoval("تم إخراجك من الحصة من قِبل المدرس"),
    onSessionUpdate: sessionApi.updateSession,
  });

  const reopened = useReopenedQuestion({
    liveState,
    questions,
    studentAnswers,
    sessionId: session?.id,
    studentId: joined?.student?.id,
    now,
    refreshNow: refresh,
  });

  const handleChoose = useAnswerSubmit({ joined, triggerReaction });

  const { handleForceKick, handleLeave } = useStudentHandlers({
    sessionApi,
    clearReaction,
  });

  useEffect(() => {
    if (!joined) clearReaction();
  }, [joined, clearReaction]);

  if (!joined) return <JoinScreen onJoin={sessionApi.join} error={error} />;

  const isWarned = Boolean(freshStudent.warnedForNameChangeAt);
  const answerStateValue = computeAnswerState(liveState, currentAnswer);

  return (
    <div className="page">
      {isWarned && (
        <NameChangeWarning
          currentName={freshStudent.name}
          onSave={sessionApi.changeName}
          onLeave={() => handleForceKick("تم إخراجك من الحصة لرفضك تغيير الاسم المخالف.")}
        />
      )}

      {freshStudent.activeNotification?.type === "no-interaction" && (
        <NoInteractionWarning
          onStay={sessionApi.clearNotification}
          onKick={() => handleForceKick("تم إخراجك من الحصة لعدم التفاعل.")}
        />
      )}

      <main className="dashboard">
        <div className="layout">
          <div className="card stack-card screen">
            <Reaction
              reactionKey={reaction?.key}
              triggerId={reaction?.id}
              onDone={clearReaction}
            />

            <div
              className="student-question"
              data-live-state={liveState}
              data-answer-state={answerStateValue}
            >
              <LiveStatePanel
                liveState={liveState}
                countdownRemaining={countdownRemaining}
                freshStudent={freshStudent}
              />

              <QuestionPanel
                liveState={liveState}
                session={session}
                currentQuestion={currentQuestion}
                questionIndex={questionIndex}
                questions={questions}
                duration={duration}
                timeLeft={timeLeft}
                currentAnswer={currentAnswer}
                freshStudent={freshStudent}
                totalStudents={session.students?.length || 0}
                reopened={reopened}
                onChoose={handleChoose}
              />
            </div>

            <button
              type="button"
              className="button button-center button-primary red leave-session-btn"
              onClick={handleLeave}
            >
              خروج من الحصة
            </button>
          </div>

          <Leaderboard session={session} studentId={joined.student.id} />
        </div>
      </main>
    </div>
  );
}

export default StudentView;