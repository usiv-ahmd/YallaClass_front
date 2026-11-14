// src/modals/ReopenSessionAlert.jsx
import { useState } from "react";
import { RotateCcw, X, Check } from "lucide-react";

export default function ReopenSessionAlert({
  pendingCount,
  totalStudents,
  defaultAllowEdit = false,
  onClose,
  onConfirm,
}) {
  const [allowEdit, setAllowEdit] = useState(defaultAllowEdit);
  const [error, setError]         = useState(null);

  const handleConfirm = () => {
    setError(null);
    const ok = onConfirm?.(allowEdit);
    if (ok === false) {
      setError("مقدرناش نفتح الجولة — راجع إن فيه طلاب متأخرين فعلاً وإن الجولة في حالة finished.");
      return;
    }
    onClose();
  };

  return (
    <div className="opened-window-backdrop" onClick={onClose}>
      <div
        className="card modal-window"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon turquoise"><RotateCcw size={22} /></div>
            <div>
              <span className="card-kicker">تأكيد الإنهاء / خطوة أخيرة</span>
              <h2 className="modal-title">إعادة فتح الجولة</h2>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={17} />
          </button>
        </div>

        <div className="modal-content">
          <p>
            هيتفتح لـ <b>{pendingCount}</b> من <b>{totalStudents}</b> طالب لسه
            مكملوش. اللي خلص خلاص مقفول عليه.
          </p>

          <label className="reopen-toggle">
            <input
              type="checkbox"
              checked={allowEdit}
              onChange={(e) => setAllowEdit(e.target.checked)}
            />
            <span>السماح للطالب بتعديل إجابته</span>
          </label>
          <p className="muted">
            {allowEdit
              ? "الطالب يقدر يغيّر إجابته القديمة ويكمّل الفاضي."
              : "إجاباته القديمة زي ما هي، هيكمّل الأسئلة الفاضية بس."}
          </p>

          {error && (
            <p style={{ color: "#c53030", fontSize: 13, marginTop: 8 }}>{error}</p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="button modal-button white"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="button modal-button turquoise"
              onClick={handleConfirm}
            >
              <Check size={16} /> افتح الجولة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}