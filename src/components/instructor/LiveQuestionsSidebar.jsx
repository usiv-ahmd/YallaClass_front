// src/components/instructor/LiveQuestionsSidebar.jsx
import { Check, ListChecks } from "lucide-react";

export default function LiveQuestionsSidebar({ questions = [], currentIndex = 0, total = 0 }) {
  return (
    <aside className="sidebar">
      <section className="card sidebar-card">
        <h3><ListChecks size={16} /> الأسئلة ({total})</h3>
        <ol className="live-questions-list">
          {questions.map((item, idx) => {
            const isCurrent = idx === currentIndex;
            const isDone = idx < currentIndex;
            return (
              <li
                key={item.id ?? idx}
                className={[isCurrent && "is-current", isDone && "is-done"].filter(Boolean).join(" ")}
              >
                <span className="q-index">{idx + 1}</span>
                <span className="q-text">{item.question}</span>
                {isDone && <Check size={14} className="q-done-icon" />}
                {isCurrent && <span className="q-live-dot" />}
              </li>
            );
          })}
        </ol>
      </section>
    </aside>
  );
}