// src/modals/SendNotificationModal.jsx
import { X, Bell, AlertCircle, Eye, UserX } from "lucide-react";

export default function SendNotificationModal({ studentName, onClose, onSend, isPending }) {
  if (!studentName) return null;

  return (
    <div
      className="opened-window-backdrop"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section className="card modal-window" role="dialog" aria-modal="true">
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon yellow"><Bell size={22} /></div>
            <div>
              <h2 className="modal-title">إرسال تنبيه</h2>
              <span className="card-eyebrow">إلى: {studentName}</span>
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

        <div
          className="modal-content"
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <p>اختر نوع التنبيه الذي تريد إرساله للطالب:</p>

          <button
            type="button"
            className="button button-primary turquoise button-center"
            onClick={() => onSend("focus")}
            disabled={isPending}
            title="إرسال رياكشن للطالب لتذكيره بالتركيز"
          >
            <Eye size={18} /> ركز! (رياكشن)
          </button>

          <button
            type="button"
            className="button button-primary red button-center"
            onClick={() => onSend("no-interaction")}
            disabled={isPending}
            title="إرسال تحذير عدم تفاعل (قد يؤدي لطرده)"
          >
            <UserX size={18} /> تحذير: لم تتفاعل
          </button>

          <button
            type="button"
            className="button button-primary white button-center"
            onClick={() => onSend("name-change")}
            disabled={isPending}
            title="إرسال تحذير لتغيير الاسم"
          >
            <AlertCircle size={18} /> تحذير: اسم مخالف
          </button>
        </div>
      </section>
    </div>
  );
}