// src/components/student/ShoushaCharacter.jsx
import { memo, useId, useMemo } from "react";
import { SHOUSHA } from "../../assets/shousha.js";
import "../../styles/shousha.css";
import "../../styles/reactions.css";

function ShoushaCharacter({ size = 120, hairColor, mode = "full", className = "", title }) {
  const uid = useId().replace(/:/g, "");
  const clipId = `eyeclip-${uid}`;

  const html = useMemo(() => {
    let s = SHOUSHA.svg;
    s = s.replace(/data-state="[^"]*"/g, 'data-state="idle"');
    s = s.replace(/id="eyeclip"/g, `id="${clipId}"`);
    s = s.replace(/url\(#eyeclip\)/g, `url(#${clipId})`);

    if (mode === "avatar") {
      s = s.replace(/viewBox="[^"]*"/, 'viewBox="82 52 236 236"');
    }

    return s;
  }, [clipId, mode]);

  const hostStyle = {
    "--shousha-size": `${size}px`,
    ...(hairColor ? { "--hair": hairColor } : {}),
  };

  return (
    <span
      className={`shousha-host shousha-host--${mode} ${className}`.trim()}
      style={hostStyle}
      dangerouslySetInnerHTML={{ __html: html }}
      role="img"
      aria-label={title || "شوشة"}
    />
  );
}

export default memo(ShoushaCharacter);