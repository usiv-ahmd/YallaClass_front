// src/modals/DeleteSessionAlert.jsx
import { Trash2, X } from "lucide-react";

export default function DeleteSessionAlert({ onClose, onConfirm, sessionTitle }) {
  return (
    <div
      className="opened-window-backdrop"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        className="card modal-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-session-title"
      >
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon red"><Trash2 size={22} /></div>
            <div>
              <span className="card-kicker">تأكيد الحذف / خطوة أخيرة</span>
              <h2 className="modal-title" id="delete-session-title">حذف الحصة</h2>
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
            هل أنت متأكد من حذف الحصة <strong>"{sessionTitle}"</strong>؟
            <br />
            لا يمكن التراجع عن هذا الإجراء نهائياً.
          </p>

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
              className="button modal-button red"
              onClick={onConfirm}
            >
              نعم، احذف الحصة
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}