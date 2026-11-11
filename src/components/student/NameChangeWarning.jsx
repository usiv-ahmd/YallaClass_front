// src/components/student/NameChangeWarning.jsx
import { AlertCircle, CheckCircle, X } from "lucide-react";
import { useNameChangeForm } from "../../hooks/useNameChangeForm.js";

export default function NameChangeWarning({ currentName, onSave, onLeave }) {
  const { newName, error, handleChange, handleSubmit } = useNameChangeForm({
    currentName,
    onSave,
  });

  return (
    <div
      className="opened-window-backdrop"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onLeave(); }}
    >
      <section
        className="card modal-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-warning-title"
      >
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon red">
              <AlertCircle size={22} />
            </div>
            <div>
              <h2 className="modal-title" id="name-warning-title">اسمك مخالف</h2>
            </div>
          </div>
          <button
            className="modal-close-button"
            type="button"
            onClick={onLeave}
            aria-label="إغلاق"
          >
            <X size={17} />
          </button>
        </div>

        <form className="modal-content" onSubmit={handleSubmit}>
          <p>
            المدرس بعتلك تحذير إن اسمك الحالي <b>«{currentName}»</b> مخالف.
            لازم تغيّره عشان تكمل في الحصة.
          </p>

          <label htmlFor="new-student-name">اسمك الجديد</label>
          <div className="input-wrap">
            <input
              id="new-student-name"
              type="text"
              autoFocus
              required
              maxLength={24}
              value={newName}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="اكتب اسمك الجديد"
            />
          </div>

          {error && (
            <p className="error-alert">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          <div className="modal-actions">
            <button
              className="button modal-button white"
              type="button"
              onClick={onLeave}
            >
              خروج من الحصة
            </button>
            <button
              className="button modal-button turquoise"
              type="submit"
            >
              <CheckCircle size={16} />
              احفظ الاسم الجديد
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}