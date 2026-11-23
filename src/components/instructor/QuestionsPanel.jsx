// src/components/instructor/QuestionsPanel.jsx
import { BookOpenCheck, Check, Clock, Pencil, Plus, Trash2, Zap } from "lucide-react";

export default function QuestionsPanel({ question, description }) {
  return (
    <section className="card stack-card" aria-labelledby="questions-title">
      <div className="card-heading">
        <div className="card-heading-title">
          <div className="card-icon small-card-icon yellow">
            <BookOpenCheck size={19} />
          </div>
          <div>
            <h2 id="questions-title">الأسئلة</h2>
          </div>
        </div>
        <span className="count-pill">{question.questions.length} سؤال</span>
      </div>

      {description && <p className="card-description">{description}</p>}

      {question.questions.length > 0 ? (
        <div className="question-list">
          {question.questions.map((item, index) => {
            const optionList = Array.isArray(item.options) ? item.options : [];
            const correctIdx = optionList.findIndex((option) => option.isCorrect);

            return (
              <article className="field question-field" key={item.id ?? index}>
                <div className="question-field-topline">
                  <span className="question-number yellow">
                    {`${index + 1}`.padStart(2, "0")}
                  </span>
                  <span className="question-info yellow">
                    <i /> سؤال
                  </span>

                  <span className="question-info highlight" title={`درجة السؤال ${item.points} نقطة`}>
                    <Zap size={11} /> {item.points} نقطة
                  </span>
                  <span className="question-info turquoise" title={`مدة السؤال ${item.timeLimitSec} ثانية`}>
                    <Clock size={11} /> {item.timeLimitSec} ث
                  </span>

                  <div className="question-actions">
                    <button
                      type="button"
                      className="small-icon-button turquoise-icon"
                      onClick={() => question.startEdit(item)}
                      aria-label={`تعديل السؤال ${index + 1}`}
                      title="تعديل السؤال"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="small-icon-button red-icon"
                      onClick={() => question.deleteQuestion(item.id)}
                      aria-label={`حذف السؤال ${index + 1}`}
                      title="حذف السؤال"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3>{item.text}</h3>

                <div className="question-options-preview">
                  {optionList.map((option, optionIndex) => (
                    <span
                      className={optionIndex === correctIdx ? "is-correct" : ""}
                      key={option.id ?? `${item.id ?? index}-${optionIndex}`}
                    >
                      <i>
                        {optionIndex === correctIdx ? (
                          <Check size={11} />
                        ) : (
                          String.fromCharCode(65 + optionIndex)
                        )}
                      </i>
                      {option.text}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-questions">
          <BookOpenCheck size={24} />
          <strong>لسه ما أضفتش أسئلة</strong>
          <span>ابدأ بإضافة سؤال يدوي للحصة.</span>
        </div>
      )}

      <button type="button" className="button button-primary turquoise" onClick={question.startAdd}>
        <Plus size={17} /> أضف سؤالًا يدويًا
      </button>
    </section>
  );
}
