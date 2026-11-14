// src/components/student/LiveStatePanel.jsx
import { Timer, Trophy, Users } from "lucide-react";
import { LIVE_STATES } from "../../constants/live.js";

const PANEL_STATES = ["not-started", "lobby", "countdown", "finished"];

export default function LiveStatePanel({ liveState, countdownRemaining, freshStudent }) {
  if (!PANEL_STATES.includes(liveState)) return null;

  return (
    <div className="main-screen">
      {liveState === "not-started" && (
        <>
          <div className="state-icon"><Users size={42} /></div>
          <h2>مستنيين المدرس يبدأ</h2>
          <p>لسه الحصة ما بدأتش. هيفتحلك الأسئلة قريب.</p>
        </>
      )}

      {liveState === "lobby" && (
        <>
          <div className="state-icon"><Users size={42} /></div>
          <h2>إحنا في اللوبي</h2>
          <p>المدرس جاهز يبدأ. استنى لحظة!</p>
        </>
      )}

      {liveState === "countdown" && (
        <>
          <div className="countdown-badge">
            <Timer size={14} /> العد التمهيدي
          </div>
          <div className="countdown-number" key={countdownRemaining}>
            {countdownRemaining > 0 ? countdownRemaining : "يلا!"}
          </div>
          <p>استعد...</p>
        </>
      )}

      {liveState === "finished" && (
        <>
          <div className="state-icon"><Trophy size={52} /></div>
          <h2>خلصت الحصة!</h2>
          <p>نتيجتك: <b>{freshStudent.score}</b> نقطة</p>
          <p>
            صح: <b>{freshStudent.correctAnswers}</b> —{" "}
            غلط: <b>{freshStudent.wrongAnswers}</b>
          </p>
          {freshStudent.highestStreak > 1 && (
            <>
              <p>اكبر ستريك: <b>{freshStudent.highestStreak}</b> 🔥</p>
              <p>الستريك الحالي: <b>{freshStudent.currentStreak}</b> 🔥</p>
            </>
          )}
        </>
      )}

      <div className="state-pulse" />
    </div>
  );
}