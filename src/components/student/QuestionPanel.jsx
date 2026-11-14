// src/components/student/QuestionPanel.jsx
import { Check, Clock3, Flame, Sparkles, Timer, Users, X, Zap } from "lucide-react";
import { QUESTION_TYPE_LABELS, ANSWER_COLORS } from "../../constants/questions.js";

export default function QuestionPanel({ liveState, session, currentQuestion, questionIndex, questions, duration, timeLeft, currentAnswer, freshStudent, totalStudents, onChoose }) {
  if (!currentQuestion) return null;
  if (!["question", "paused", "reveal"].includes(liveState)) return null;

  const isQuestion = liveState === "question";
  const isPaused = liveState === "paused";
  const isReveal = liveState === "reveal";
  const disabled = !isQuestion;
  const revealAnswers = isReveal;
  const answer = currentAnswer;
  const safeTimeLeft = Number.isFinite(timeLeft) ? timeLeft : duration;
  const displayedTime = isReveal ? 0 : safeTimeLeft;
  const progress = isReveal ? 0 : (duration > 0 ? Math.max(0, Math.min(1, safeTimeLeft / duration)) : 0);
  const timerMood = progress <= 0.25 ? "is-danger" : progress <= 0.5 ? "is-warning" : "";
  const index = questionIndex;
  const total = questions.length;
  const type = currentQuestion.type ?? "mcq";
  const typeLabel = QUESTION_TYPE_LABELS[type] ?? type;
  const isTf = type === "true_false";
  const correctIndex = currentQuestion.correctOptionIndex;
  const showCorrect = revealAnswers && correctIndex !== null && correctIndex !== undefined;

  return (
    <>
      {isPaused && (
        <div className="session-status status-paused">
          <i /> المدرس وقّف الحصة مؤقتاً
        </div>
      )}

      <div className="question-meta-row">
        <div className="question-header-title">
          <span>أهلاً يا {freshStudent.name}</span>
          <h2>{session.title ?? "حصة"}</h2>
        </div>

        <span className="mini-label">
          سؤال {index + 1} من {total}
        </span>

        <div className="question-stats">
          <span className="stat-chip">
            <Users size={16} /> {totalStudents} <small>طالب</small>
          </span>
          <span className="stat-chip stat-chip-correct">
            <Check size={16} /> {freshStudent.correctAnswers} <small>صح</small>
          </span>
          <span className="stat-chip stat-chip-wrong">
            <X size={16} /> {freshStudent.wrongAnswers} <small>غلط</small>
          </span>
          <span className="stat-chip">
            <Zap size={16} /> {freshStudent.score} <small>نقطة</small>
          </span>
          <span className="stat-chip stat-chip--streak">
            <Flame size={16} /> {freshStudent.highestStreak} <small>streak</small>
          </span>
        </div>
      </div>

      <div className="question-progress" style={{ "--total": total }}>
        {Array.from({ length: total }, (_, i) => (
          <span className={"question-progress-step student-step" + (i < index ? " is-done" : "") + (i === index ? " is-current" : "")} key={i} />
        ))}
      </div>

      <div className="question-main-row">
        <div className="question-copy">
          <h2>{currentQuestion.text ?? currentQuestion.question}</h2>
        </div>
        <div className={`timer-ring ${timerMood}`} style={{ "--timer-angle": `${progress * 360}deg` }} role="timer">
          <div className="timer-ring-inner">
            <Clock3 size={15} /><strong>{Math.ceil(displayedTime)}</strong><small>ث</small>
          </div>
        </div>
      </div>

      <div className="answer-prompt">
        <Sparkles size={18} />
        <span>
          {isTf ? "اختار صح أو غلط" : "اختار إجابتك"}
          <small className="question-type-tag">
            · {typeLabel}
          </small>
        </span>
      </div>

      <div className={`answer-grid${isTf ? " answer-grid--tf" : ""}`}>
        {(currentQuestion.options || []).map((option, optIndex) => {
          const isCorrectOption = showCorrect && optIndex === correctIndex;
          const isSelected = answer?.selectedOption === optIndex;
          const resultState = answer?.resultState;

          let stateClass = "";
          if (isSelected) {
            if (resultState === "correct") stateClass = " answer-option-correct";
            else if (resultState === "wrong") stateClass = " answer-option-wrong";
          } else if (showCorrect) {
            stateClass = isCorrectOption ? " answer-option-correct" : " answer-option-muted";
          }

          const colorClass = isTf ? (optIndex === 0 ? " pink" : " purple") : ` ${ANSWER_COLORS[optIndex % ANSWER_COLORS.length]}`;
          const tfClass = isTf ? " answer-option--tf" : "";

          let badge;
          if (isSelected && resultState === "correct") {
            badge = <Check size={isTf ? 26 : 19} strokeWidth={3} />;
          } else if (isSelected && resultState === "wrong") {
            badge = <X size={isTf ? 26 : 19} strokeWidth={3} />;
          } else if (showCorrect && isCorrectOption) {
            badge = <Check size={isTf ? 26 : 19} strokeWidth={3} />;
          } else if (isTf) {
            badge = optIndex === 0 ? "✓" : "✕";
          } else {
            badge = String.fromCharCode(65 + optIndex);
          }

          return (
            <button type="button" className={`answer-option${tfClass}${colorClass}${stateClass}`} disabled={Boolean(answer) || disabled} onClick={() => onChoose(optIndex)} key={optIndex}>
              <span className="answer-option-key">
                {badge}
              </span>
              <span className="answer-option-text">
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {answer && (
        <div className={`answer-result ${answer.resultState === "correct" ? "answer-result-good" : "answer-result-retry"}`} role="status">
          <span className="answer-result-icon">
            {answer.resultState === "correct" ? <Check size={20} /> : <Sparkles size={19} />}
          </span>
          <span>
            <strong>{answer.resultState === "correct" ? `إجابة صحيحة! +${answer.points} نقطة` : "إجابة غلط"}</strong>
            {answer.resultState === "correct" && answer.speedBonus > 0 && (
              <small>+{answer.speedBonus} مكافأة سرعة</small>
            )}
            {answer.resultState !== "correct" && revealAnswers && correctIndex !== null && (
              <small>الإجابة الصحيحة: {currentQuestion.options?.[correctIndex]}</small>
            )}
          </span>
        </div>
      )}

      {revealAnswers && !answer && correctIndex !== null && (
        <div className="answer-result answer-result-warn">
          <span className="answer-result-icon">
            <Timer size={20} />
          </span>
          <span>
            <strong>الوقت خلص.</strong>
            <small>الإجابة الصحيحة: {currentQuestion.options?.[correctIndex]}</small>
          </span>
        </div>
      )}
    </>
  );
}