// src/components/student/StudentAvatar.jsx
import { AVATAR_PRESETS, DEFAULT_AVATAR } from "../../adapters/roster.adapter.js";
import "../../styles/roster.css";

const PRESET_EMOJI = Object.fromEntries(
  AVATAR_PRESETS.map((preset) => [preset.id, preset.emoji])
);

export default function StudentAvatar({ avatar, size = 44, title }) {
  const preset = avatar?.preset || DEFAULT_AVATAR.preset;
  const color = avatar?.color || DEFAULT_AVATAR.color;
  const emoji = PRESET_EMOJI[preset] || "🙂";

  return (
    <span
      className="student-avatar"
      style={{
        "--avatar-color": color,
        "--avatar-size": `${size}px`,
      }}
      title={title}
    >
      <span aria-hidden="true" className="student-avatar-emoji">
        {emoji}
      </span>
    </span>
  );
}
