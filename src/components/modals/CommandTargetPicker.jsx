// src/components/modals/CommandTargetPicker.jsx
import { X } from "lucide-react";
import ShoushaCharacter from "../student/ShoushaCharacter.jsx";
import "../../styles/command-target.css";

export default function CommandTargetPicker({ command, label, emoji, players, selfId, onConfirm, onClose, isPending }) {
  const targets = (players || [])
    .filter((p) => p.id !== selfId)
    .sort((a, b) => (a.rank || 999) - (b.rank || 999));

  let themeColor, subtitle, cmdColor;

  if (command === "thief") {
    cmdColor = "red";
    themeColor = "var(--C-yalla-danger)";
    subtitle = "اختار مين تسرقه. لمسة واحدة وبتنقّل!";
  } else if (command === "gift") {
    cmdColor = "yellow";
    themeColor = "var(--C-yalla-highlight)";
    subtitle = "اختار مين تدي له الهدية!";
  } else if (command === "rocket") {
    cmdColor = "turquoise";
    themeColor = "var(--C-yalla-info)";
    subtitle = "اختار مين يتضرب. لمسة واحدة وبتنفذ!";
  }

  return (
    <div className="opened-window-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="presentation">
      <section aria-modal="true" className="card modal-window ctp-modal" role="dialog" style={{ "--cmd-color": themeColor }}>
        <div className="card-heading">
          <div className="card-heading-title">
            <div className={`card-icon ${cmdColor}`}>
              {emoji}
            </div>
            <div>
              <span className="card-kicker">
              </span>
              <h2 className="modal-title">
                {label}!
              </h2>
            </div>
          </div>
          <button aria-label="إغلاق" className="modal-close-button" onClick={onClose} type="button">
            <X size={17} />
          </button>
        </div>

        <div className="card-eyebrow" style={{ "--element-color": themeColor }}>
          {subtitle}
        </div>

        <div className="ctp-list-container">
          {targets.length === 0 ? (
            <p className="ctp-empty">
              مفيش لاعبين تانيين في الحصة.
            </p>
          ) : (
            <div className="ctp-list">
              {targets.map((p, index) => {
                const isFirst = index === 0;
                return (
                  <button className={`ctp-row ${isFirst ? "ctp-row--first" : ""}`} disabled={isPending} key={p.id} onClick={() => onConfirm(p.id)} type="button">
                    <span className="ctp-rank">
                      {p.rank || index + 1}
                    </span>
                    <span className="ctp-avatar-wrap">
                      <ShoushaCharacter hairColor={p.avatar?.hairColor} mode="avatar" size={44} />
                    </span>
                    <span className="ctp-name">
                      {p.name}
                    </span>
                    <span className="ctp-score">
                      {p.score}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="ctp-footer">
          <button className="button button-primary white" onClick={onClose} style={{ width: "100%" }} type="button">
            إلغاء
          </button>
        </div>
      </section>
    </div>
  );
}