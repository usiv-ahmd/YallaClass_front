// src/modals/QuestionFormWindow.jsx
import { X, Plus, Minus, FilePen, FilePlus, ListChecks, CheckCircle2, Zap } from "lucide-react";
import { QUESTION_TYPES, MAX_POINTS, MIN_POINTS } from "../constants/questions.js";

export default function QuestionFormWindow({ question, sessionId }) {
  const isEditing = Boolean(question.editingId);
  const typeConfig = QUESTION_TYPES[question.type] ?? QUESTION_TYPES.mcq;

  return (
    <div className="opened-window-backdrop" onMouseDown={(e) => e.target === e.currentTarget && question.cancelForm()} role="presentation">
      <section className="card modal-window" role="dialog" aria-labelledby="question-form-title" aria-modal="true">
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon turquoise">
              {isEditing ? <FilePen size={22} /> : <FilePlus size={22} />}
            </div>
            <div>
              <span className="card-kicker">
                {isEditing ? "تعديل السؤال" : "سؤال جديد / إضافة يدوية"}
              </span>
              <h2 id="question-form-title" className="modal-title">
                {isEditing ? "تعديل السؤال" : "سؤال جديد"}
              </h2>
            </div>
          </div>
          <button type="button" className="modal-close-button" onClick={question.cancelForm} aria-label="إغلاق">
            <X size={17} />
          </button>
        </div>

        <form className="modal-content" onSubmit={question.addQuestion}>
          <label>نوع السؤال</label>
          <div className="type-selector">
            <button type="button" className={`type-chip${question.type === "mcq" ? " selected" : ""}`} onClick={() => question.setType("mcq")} aria-pressed={question.type === "mcq"}>
              <ListChecks size={15} />
              <span>اختيار من متعدد</span>
            </button>

            <button type="button" className={`type-chip${question.type === "true_false" ? " selected" : ""}`} onClick={() => question.setType("true_false")} aria-pressed={question.type === "true_false"}>
              <CheckCircle2 size={15} />
              <span>صح / غلط</span>
            </button>
          </div>

          <label>نص السؤال</label>
          <div className="question-input-wrap">
            <textarea required rows={2} maxLength={240} value={question.text} onChange={(e) => question.setText(e.target.value)} placeholder="اكتب السؤال بوضوح..." />
          </div>

          {question.type === "mcq" && (
            <>
              <label>الخيارات (اختار الصح)</label>
              <div className="answer-options-grid">
                {question.options.map((option, index) => (
                  <div className={`answer-option-field ${question.correctIndex === index ? "is-correct" : ""}`} key={index}>
                    <input type="radio" className="correct-radio" name={`correct-answer-${sessionId}`} checked={question.correctIndex === index} onChange={() => question.setCorrectIndex(index)} />
                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <input type="text" className="option-input" required maxLength={120} value={option} onChange={(e) => question.updateOption(index, e.target.value)} placeholder={`الخيار ${index + 1}`} />
                    {question.options.length > 2 && (
                      <button type="button" className="small-icon-button red-icon" onClick={() => question.removeOption(index)} aria-label={`حذف الخيار ${index + 1}`}>
                        <Minus size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {question.options.length < 6 && (
                <button type="button" className="small-icon-button blue-icon" onClick={() => question.setOptions((cur) => [...cur, ""])} aria-label="إضافة خيار">
                  <Plus size={14} />
                </button>
              )}
            </>
          )}

          {question.type === "true_false" && (
            <>
              <label>الإجابة الصحيحة</label>
              <div className="answer-options-grid answer-options-grid--tf">
                {["صح", "غلط"].map((option, index) => (
                  <label className={"answer-option-field answer-option-field--tf " + (index === 0 ? "is-true" : "is-false") + (question.correctIndex === index ? " is-correct" : "")} key={index}>
                    <input type="radio" className="hidden-radio" name={`correct-answer-${sessionId}`} checked={question.correctIndex === index} onChange={() => question.setCorrectIndex(index)} />
                    <span className="option-letter">
                      {index === 0 ? "✓" : "✗"}
                    </span>
                    <span className="option-label-fixed">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}

          <label htmlFor="question-points">
            وزن السؤال (النقاط)
          </label>
          <div className="points-input-wrap">
            <Zap size={15} />
            <input id="question-points" type="number" min={MIN_POINTS} max={MAX_POINTS} step={1} value={question.points} onChange={(e) => question.setpoints(e.target.value)} />
            <span className="points-unit">
              نقطة
            </span>
          </div>

          <label>مدة السؤال (بالثواني)</label>
          <div className="duration-picker">
            {typeConfig.durations.map((sec) => (
              <button type="button" className={`duration-chip${Number(question.duration) === sec ? " selected" : ""}`} onClick={() => question.setDuration(sec)} key={sec}>
                <b>{sec}</b>
                <small>ث</small>
              </button>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="button modal-button ghost" onClick={question.cancelForm}>
              إلغاء
            </button>
            <button type="submit" className="button modal-button turquoise">
              {isEditing ? "حفظ التعديلات" : "إضافة السؤال"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}