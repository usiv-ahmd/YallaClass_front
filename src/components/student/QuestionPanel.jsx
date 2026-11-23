// src/components/student/QuestionPanel.jsx
import { Check, Clock3, Flame, Sparkles, Timer, Users, X, Zap } from "lucide-react";

import { ANSWER_COLORS } from "../../constants/questions.js";

export default function QuestionPanel({
  question,
  phase,
  remainingMs,
  selectedOptionId,
  answer,
  onChoose,
  disabled,
  totalStudents,
  answeredCount,
  participant,
  you,
}) {
  if (!question) return null;

  const isQuestion = phase === "QUESTION";
  const isReveal = phase === "REVEAL";
  const isPaused = phase === "PAUSED";
  const revealed = isReveal || phase === "EXPLANATION" || phase === "POINTS";

  const safeRemaining = Number.isFinite(remainingMs) ? remainingMs : 0;
  const durationMs = (question.timeLimitSec || 10) * 1000;
  const progress =
    isQuestion && durationMs > 0
      ? Math.max(0, Math.min(1, safeRemaining / durationMs))
      : 0;
  const timerMood =
    progress <= 0.25 ? "is-danger" : progress <= 0.5 ? "is-warning" : "";

  const selected = selectedOptionId || answer?.selectedOptionId || null;
  const isCorrect = answer?.isCorrect === true;
  const pointsAwarded = answer?.pointsAwarded ?? null;

  return (
    <>
      {isPaused && (
        <div className="session-status status-paused">
          <i /> المدرس وقّف الحصة مؤقتاً
        </div>
      )}

      <div className="question-meta-row">
        <div className="question-header-title">
          <span>أهلاً يا {participant?.nickname || participant?.name}</span>
          <h2>{question.text}</h2>
        </div>

        <span className="mini-label">
          سؤال {(question.order ?? 0) + 1} · {question.points} نقطة
        </span>

        <div className="question-stats">
          <span className="stat-chip">
            <Users size={16} /> {totalStudents} <small>طالب</small>
          </span>
          <span className="stat-chip">
            <Zap size={16} /> {you?.score ?? participant?.score ?? 0} <small>نقطة</small>
          </span>
          <span className="stat-chip stat-chip--streak">
            <Flame size={16} /> {you?.streak ?? participant?.streak ?? 0} <small>streak</small>
          </span>
          <span className="stat-chip">
            <Check size={16} /> {answeredCount} <small>أجابوا</small>
          </span>
        </div>
      </div>

      <div className="question-main-row">
        <div className="question-copy">
          <h2>{question.text}</h2>
        </div>
        <div
          className={`timer-ring ${timerMood}`}
          style={{ "--timer-angle": `${progress * 360}deg` }}
          role="timer"
        >
          <div className="timer-ring-inner">
            <Clock3 size={15} />
            <strong>{Math.ceil(safeRemaining / 1000)}</strong>
            <small>ث</small>
          </div>
        </div>
      </div>

      <div className="answer-prompt">
        <Sparkles size={18} />
        <span>
          {isQuestion ? "اختار إجابتك" : "المراجعة"}
          <small className="question-type-tag">· {question.timeLimitSec} ثانية</small>
        </span>
      </div>

      <div className="answer-grid">
        {(question.options || []).map((option, optIndex) => {
          const isSelected = selected === option.id;
          const isCorrectOption = revealed && option.isCorrect === true;
          const stateClass = isSelected
            ? isCorrect
              ? " answer-option-correct"
              : " answer-option-wrong"
            : revealed && isCorrectOption
              ? " answer-option-correct"
              : revealed
                ? " answer-option-muted"
                : "";

          const colorClass = ` ${ANSWER_COLORS[optIndex % ANSWER_COLORS.length]}`;

          let badge;
          if (isSelected && isCorrect) badge = <Check size={19} strokeWidth={3} />;
          else if (isSelected && !isCorrect && answer) badge = <X size={19} strokeWidth={3} />;
          else if (revealed && isCorrectOption) badge = <Check size={19} strokeWidth={3} />;
          else badge = String.fromCharCode(65 + optIndex);

          return (
            <button
              type="button"
              className={`answer-option${colorClass}${stateClass}`}
              disabled={Boolean(answer) || disabled || !isQuestion}
              onClick={() => onChoose(option.id)}
              key={option.id}
            >
              <span className="answer-option-key">{badge}</span>
              <span className="answer-option-text">{option.text}</span>
            </button>
          );
        })}
      </div>

      {answer && (
        <div
          className={`answer-result ${
            isCorrect ? "answer-result-good" : "answer-result-retry"
          }`}
          role="status"
        >
          <span className="answer-result-icon">
            {isCorrect ? <Check size={20} /> : <Sparkles size={19} />}
          </span>
          <span>
            <strong>
              {isCorrect
                ? `إجابة صحيحة! +${pointsAwarded ?? 0} نقطة`
                : "إجابة غلط"}
            </strong>
            {isCorrect && answer.doublePointsApplied && (
              <small> (نقاط مضاعفة)</small>
            )}
            {!isCorrect && isReveal && question.options?.some((o) => o.isCorrect) && (
              <small>
                الإجابة الصحيحة:{" "}
                {question.options.find((o) => o.isCorrect)?.text}
              </small>
            )}
          </span>
        </div>
      )}

      {isReveal && !answer && (
        <div className="answer-result answer-result-warn">
          <span className="answer-result-icon">
            <Timer size={20} />
          </span>
          <span>
            <strong>الوقت خلص.</strong>
            {question.options?.some((o) => o.isCorrect) && (
              <small>
                الإجابة الصحيحة:{" "}
                {question.options.find((o) => o.isCorrect)?.text}
              </small>
            )}
          </span>
        </div>
      )}
    </>
  );
}
