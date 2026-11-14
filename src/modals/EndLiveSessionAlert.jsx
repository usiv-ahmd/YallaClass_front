// src/modals/EndLiveSessionAlert.jsx
import { CircleStop, X } from "lucide-react";

export default function EndLiveSessionAlert({ onClose, onConfirm, sessionCode }) {
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
        aria-labelledby="end-session-title"
      >
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon red"><CircleStop size={22} /></div>
            <div>
              <span className="card-kicker">تأكيد الإنهاء / خطوة أخيرة</span>
              <h2 className="modal-title" id="end-session-title">إنهاء الحصة</h2>
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
            إنهاء الحصة <strong style={{ color: "var(--text-primary)" }}>"{sessionCode}"</strong> الحية والعودة للقائمة؟
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
              نعم، انهي الحصة
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}