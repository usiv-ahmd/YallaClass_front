// src/components/student/NoInteractionWarning.jsx
import { AlertCircle, CheckCircle } from "lucide-react";
import { useCountdown } from "../../hooks/useCountdown.js";
import { NO_INTERACTION_SECONDS } from "../../constants/notifications.js";

export default function NoInteractionWarning({ onStay, onKick }) {
  const { remaining } = useCountdown({
    active: true,
    seconds: NO_INTERACTION_SECONDS,
    onEnd: onKick,
  });

  return (
    <div className="opened-window-backdrop" role="presentation">
      <section className="card modal-window" role="dialog" aria-modal="true">
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon red">
              <AlertCircle size={22} />
            </div>
            <div>
              <h2 className="modal-title">هل أنت موجود؟</h2>
            </div>
          </div>
        </div>

        <div className="modal-content" style={{ textAlign: "center", gap: 16 }}>
          <p style={{ fontSize: 16 }}>
            لاحظنا أنك لم تتفاعل مع الحصة حتى الآن.
            <br />
            سيتم إخراجك تلقائياً إذا لم تضغط على الزر أدناه.
          </p>

          <div style={{ fontSize: 40, fontWeight: "bold", color: "var(--C-yalla-danger)" }}>
            {remaining}
          </div>

          <button
            type="button"
            className="button button-primary turquoise button-center"
            onClick={onStay}
          >
            <CheckCircle size={18} /> أنا موجود، أكمل الحصة
          </button>
        </div>
      </section>
    </div>
  );
}