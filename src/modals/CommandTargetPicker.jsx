// src/modals/CommandTargetPicker.jsx
import { X } from "lucide-react";

export default function CommandTargetPicker({ command, label, emoji, players, selfId, onConfirm, onClose, isPending }) {
  const targets = (players || []).filter((p) => p.id !== selfId);

  return (
    <div className="opened-window-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="presentation">
      <section className="card modal-window" role="dialog" aria-modal="true">
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon turquoise cmd-picker-icon">{emoji}</div>
            <div>
              <span className="card-kicker">اختار الهدف</span>
              <h2 className="modal-title">{label} — لمين؟</h2>
            </div>
          </div>
          <button type="button" className="modal-close-button" onClick={onClose} aria-label="إغلاق">
            <X size={17} />
          </button>
        </div>

        <div className="modal-content">
          {targets.length === 0 ? (
            <p className="muted">مفيش لاعبين تانيين في الحصة.</p>
          ) : (
            <div className="type-selector">
              {targets.map((p) => (
                <button type="button" className="type-chip" disabled={isPending} onClick={() => onConfirm(p.id)} key={p.id}>
                  {p.name}
                </button>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="button modal-button white" onClick={onClose}>إلغاء</button>
          </div>
        </div>
      </section>
    </div>
  );
}