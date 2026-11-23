// src/components/modals/QuestionFormWindow.jsx
import {
  X,
  Plus,
  Minus,
  FilePen,
  FilePlus,
  Clock3,
  Zap,
} from "lucide-react";
import {
  MAX_OPTIONS,
  MAX_POINTS,
  MAX_TIME_LIMIT_SEC,
  MIN_OPTIONS,
  MIN_POINTS,
  MIN_TIME_LIMIT_SEC,
  QUESTION_OPTION_MAX_LENGTH,
  QUESTION_TEXT_MAX_LENGTH,
  QUESTION_TIME_OPTIONS,
} from "../../constants/questions.js";

export default function QuestionFormWindow({ question, sessionId }) {
  const isEditing = Boolean(question.editingId);

  return (
    <div
      className="opened-window-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && question.cancelForm()}
      role="presentation"
    >
      <section
        aria-labelledby="question-form-title"
        aria-modal="true"
        className="card modal-window"
        role="dialog"
      >
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon turquoise">
              {isEditing ? <FilePen size={22} /> : <FilePlus size={22} />}
            </div>
            <div>
              <span className="card-kicker">
                {isEditing ? "تعديل السؤال" : "سؤال جديد / إضافة يدوية"}
              </span>
              <h2 className="modal-title" id="question-form-title">
                {isEditing ? "تعديل السؤال" : "سؤال جديد"}
              </h2>
            </div>
          </div>
          <button
            aria-label="إغلاق"
            className="modal-close-button"
            onClick={question.cancelForm}
            type="button"
          >
            <X size={17} />
          </button>
        </div>

        <form className="modal-content" onSubmit={question.submitQuestion}>
          <label>نص السؤال</label>
          <div className="question-input-wrap">
            <textarea
              maxLength={QUESTION_TEXT_MAX_LENGTH}
              onChange={(e) => question.setText(e.target.value)}
              placeholder="اكتب السؤال بوضوح..."
              required
              rows={2}
              value={question.text}
            />
          </div>

          <label>
            الخيارات (من {MIN_OPTIONS} لـ {MAX_OPTIONS} — اختار الصح)
          </label>
          <div className="answer-options-grid">
            {question.options.map((option, index) => (
              <div
                className={`answer-option-field ${
                  question.correctIndex === index ? "is-correct" : ""
                }`}
                key={index}
              >
                <input
                  checked={question.correctIndex === index}
                  className="correct-radio"
                  name={`correct-answer-${sessionId}`}
                  onChange={() => question.setCorrectIndex(index)}
                  type="radio"
                />
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <input
                  className="option-input"
                  maxLength={QUESTION_OPTION_MAX_LENGTH}
                  onChange={(e) => question.updateOption(index, e.target.value)}
                  placeholder={`الخيار ${index + 1}`}
                  required
                  type="text"
                  value={option}
                />
                {question.options.length > MIN_OPTIONS && (
                  <button
                    aria-label={`حذف الخيار ${index + 1}`}
                    className="small-icon-button red-icon"
                    onClick={() => question.removeOption(index)}
                    type="button"
                  >
                    <Minus size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {question.options.length < MAX_OPTIONS && (
            <button
              aria-label="إضافة خيار"
              className="small-icon-button blue-icon"
              onClick={question.addOption}
              type="button"
            >
              <Plus size={14} />
            </button>
          )}

          <label htmlFor="question-points">
            درجة السؤال (النقاط)
          </label>
          <div className="points-input-wrap">
            <Zap size={15} />
            <input
              id="question-points"
              max={MAX_POINTS}
              min={MIN_POINTS}
              onChange={(e) => question.setPoints(e.target.value)}
              step={1}
              type="number"
              value={question.points}
            />
            <span className="points-unit">
              نقطة
            </span>
          </div>

          <label htmlFor="question-time">
            مدة السؤال (بالثواني)
          </label>
          <div className="duration-picker">
            {QUESTION_TIME_OPTIONS.map((sec) => (
              <button
                className={`duration-chip${
                  Number(question.timeLimitSec) === sec ? " selected" : ""
                }`}
                key={sec}
                onClick={() => question.setTimeLimitSec(sec)}
                type="button"
              >
                <b>{sec}</b>
                <small>ث</small>
              </button>
            ))}
          </div>
          <div className="points-input-wrap">
            <Clock3 size={15} />
            <input
              id="question-time"
              max={MAX_TIME_LIMIT_SEC}
              min={MIN_TIME_LIMIT_SEC}
              onChange={(e) => question.setTimeLimitSec(e.target.value)}
              step={1}
              type="number"
              value={question.timeLimitSec}
            />
            <span className="points-unit">
              ثانية
            </span>
          </div>

          {question.formError && (
            <p className="error-alert">
              {question.formError}
            </p>
          )}

          <div className="modal-actions">
            <button
              className="button modal-button ghost"
              onClick={question.cancelForm}
              type="button"
            >
              إلغاء
            </button>
            <button
              className="button modal-button turquoise"
              disabled={question.busy}
              type="submit"
            >
              {question.busy
                ? "جاري الحفظ..."
                : isEditing
                ? "حفظ التعديلات"
                : "إضافة السؤال"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
