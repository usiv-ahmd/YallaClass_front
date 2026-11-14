// src/modals/SessionFormWindow.jsx
import { useEffect, useState } from "react";
import { CalendarDays, X, Command, RotateCw } from "lucide-react";

export default function SessionFormWindow({
  onClose,
  onSubmit,
  initialData,
  commands = [],
  commandsLoading = false,
  commandsError = null,
  onReloadCommands,
}) {
  const isEditing = !!initialData;

  const [title, setTitle]       = useState(initialData?.title || "");
  const [subject, setSubject]   = useState(initialData?.subject || "");
  const [date, setDate]         = useState(initialData?.date || "");
  const [time, setTime]         = useState(initialData?.time || "");
  const [duration, setDuration] = useState(initialData?.duration?.toString() || "30");

  const [selected, setSelected] = useState({});
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    if (ready || !commands.length) return;

    const saved   = initialData?.commands;
    const isArray = Array.isArray(saved);
    const next    = {};

    for (const cmd of commands) {
      const value = isArray ? saved.includes(cmd.id) : saved?.[cmd.id];
      next[cmd.id] = typeof value === "boolean" ? value : Boolean(cmd.defaultEnabled);
    }

    setSelected(next);
    setReady(true);
  }, [commands, initialData, ready]);

  const enabledCount = commands.filter((cmd) => selected[cmd.id]).length;

  const toggleCommand = (id) => setSelected((cur) => ({ ...cur, [id]: !cur[id] }));

  const setAllCommands = (value) =>
    setSelected(commands.reduce((acc, cmd) => ({ ...acc, [cmd.id]: value }), {}));

  const handleSubmit = (event) => {
    event.preventDefault();
    const submitter = event.nativeEvent.submitter;
    const newStatus = submitter?.value === "draft" ? "draft" : "scheduled";

    onSubmit?.({
      title,
      subject,
      date,
      time,
      duration,
      commands: commands.filter((cmd) => selected[cmd.id]).map((cmd) => cmd.id),
      status: newStatus,
    });
  };

  return (
    <div
      className="opened-window-backdrop"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section
        className="card modal-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-session-title"
      >
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon turquoise"><CalendarDays size={22} /></div>
            <div>
              <span className="card-kicker">
                {isEditing ? "تعديل الجلسة" : "جلسة جديدة / ٠١"}
              </span>
              <h2 className="modal-title" id="create-session-title">
                {isEditing ? "عدّل تفاصيل جلستك" : "حدّد تفاصيل جلستك"}
              </h2>
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

        <form className="modal-content" onSubmit={handleSubmit}>
          <label htmlFor="session-title">اسم الجلسة</label>
          <div className="input-wrap">
            <input
              id="session-title"
              type="text"
              autoFocus
              required
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مراجعة قوانين الحركة"
            />
          </div>

          <label htmlFor="session-subject">المادة / الصف</label>
          <div className="input-wrap">
            <input
              id="session-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: الفيزياء · الصف الثاني الثانوي"
            />
          </div>

          <div className="field-head">
            <label>الأوامر المسموحة للطالب</label>
            {!commandsLoading && !commandsError && commands.length > 0 && (
              <div className="field-head-actions">
                <span className="field-hint">{enabledCount} / {commands.length}</span>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setAllCommands(true)}
                >
                  الكل
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setAllCommands(false)}
                >
                  لا شيء
                </button>
              </div>
            )}
          </div>

          {commandsLoading && (
            <div className="commands-state">بيتم تحميل الأوامر…</div>
          )}

          {!commandsLoading && commandsError && (
            <div className="commands-state commands-state--error">
              <span>تعذّر تحميل الأوامر.</span>
              {onReloadCommands && (
                <button
                  type="button"
                  className="link-button"
                  onClick={onReloadCommands}
                >
                  <RotateCw size={14} /> حاول تاني
                </button>
              )}
            </div>
          )}

          {!commandsLoading && !commandsError && commands.length === 0 && (
            <div className="commands-state">مفيش أوامر متاحة.</div>
          )}

          {!commandsLoading && !commandsError && commands.length > 0 && (
            <div className="type-selector">
              {commands.map((cmd) => {
                const enabled = Boolean(selected[cmd.id]);
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    className={`type-chip${enabled ? " selected" : ""}`}
                    onClick={() => toggleCommand(cmd.id)}
                    aria-pressed={enabled}
                    title={cmd.description}
                  >
                    <Command size={15} />
                    <span>{cmd.label}</span>
                    {cmd.maxUses != null && <small className="chip-badge">×{cmd.maxUses}</small>}
                  </button>
                );
              })}
            </div>
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
              type="submit"
              className="button modal-button ghost"
              value="draft"
              disabled={commandsLoading}
            >
              حفظ كمسودة
            </button>
            <button
              type="submit"
              className="button modal-button turquoise"
              value="scheduled"
              disabled={commandsLoading}
            >
              <CalendarDays size={16} />
              {isEditing ? "حفظ التعديلات" : "حفظ الحصة"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}