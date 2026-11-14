// src/modals/QuestionFormWindow.jsx
import { X, Plus, Minus, FilePen, FilePlus, ListChecks, CheckCircle2, Zap } from "lucide-react";
import { QUESTION_TYPES, MAX_POINTS, MIN_POINTS } from "../../constants/questions.js";

export default function QuestionFormWindow({ question, sessionId }) {
  const isEditing = Boolean(question.editingId);
  const typeConfig = QUESTION_TYPES[question.type] ?? QUESTION_TYPES.mcq;

  return (
    <div className="opened-window-backdrop" onMouseDown={(e) => e.target === e.currentTarget && question.cancelForm()} role="presentation">
      <section aria-labelledby="question-form-title" aria-modal="true" className="card modal-window" role="dialog">
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
          <button aria-label="إغلاق" className="modal-close-button" onClick={question.cancelForm} type="button">
            <X size={17} />
          </button>
        </div>

        <form className="modal-content" onSubmit={question.addQuestion}>
          <label>نوع السؤال</label>
          <div className="type-selector">
            <button aria-pressed={question.type === "mcq"} className={`type-chip${question.type === "mcq" ? " selected" : ""}`} onClick={() => question.setType("mcq")} type="button">
              <ListChecks size={15} />
              <span>اختيار من متعدد</span>
            </button>

            <button aria-pressed={question.type === "true_false"} className={`type-chip${question.type === "true_false" ? " selected" : ""}`} onClick={() => question.setType("true_false")} type="button">
              <CheckCircle2 size={15} />
              <span>صح / غلط</span>
            </button>
          </div>

          <label>نص السؤال</label>
          <div className="question-input-wrap">
            <textarea maxLength={240} onChange={(e) => question.setText(e.target.value)} placeholder="اكتب السؤال بوضوح..." required rows={2} value={question.text} />
          </div>

          {question.type === "mcq" && (
            <>
              <label>الخيارات (اختار الصح)</label>
              <div className="answer-options-grid">
                {question.options.map((option, index) => (
                  <div className={`answer-option-field ${question.correctIndex === index ? "is-correct" : ""}`} key={index}>
                    <input checked={question.correctIndex === index} className="correct-radio" name={`correct-answer-${sessionId}`} onChange={() => question.setCorrectIndex(index)} type="radio" />
                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <input className="option-input" maxLength={120} onChange={(e) => question.updateOption(index, e.target.value)} placeholder={`الخيار ${index + 1}`} required type="text" value={option} />
                    {question.options.length > 2 && (
                      <button aria-label={`حذف الخيار ${index + 1}`} className="small-icon-button red-icon" onClick={() => question.removeOption(index)} type="button">
                        <Minus size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {question.options.length < 6 && (
                <button aria-label="إضافة خيار" className="small-icon-button blue-icon" onClick={() => question.setOptions((cur) => [...cur, ""])} type="button">
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
                    <input checked={question.correctIndex === index} className="hidden-radio" name={`correct-answer-${sessionId}`} onChange={() => question.setCorrectIndex(index)} type="radio" />
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
            درجة السؤال (النقاط)
          </label>
          <div className="points-input-wrap">
            <Zap size={15} />
            <input id="question-points" max={MAX_POINTS} min={MIN_POINTS} onChange={(e) => question.setPoints(e.target.value)} step={1} type="number" value={question.points} />
            <span className="points-unit">
              نقطة
            </span>
          </div>

          <label>مدة السؤال (بالثواني)</label>
          <div className="duration-picker">
            {typeConfig.durations.map((sec) => (
              <button className={`duration-chip${Number(question.duration) === sec ? " selected" : ""}`} key={sec} onClick={() => question.setDuration(sec)} type="button">
                <b>{sec}</b>
                <small>ث</small>
              </button>
            ))}
          </div>

          <div className="modal-actions">
            <button className="button modal-button ghost" onClick={question.cancelForm} type="button">
              إلغاء
            </button>
            <button className="button modal-button turquoise" type="submit">
              {isEditing ? "حفظ التعديلات" : "إضافة السؤال"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}