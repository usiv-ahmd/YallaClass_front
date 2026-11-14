// src/components/student/ShoushaCharacter.jsx
import { memo, useId, useMemo } from "react";
import { SHOUSHA } from "../../assets/shousha.js";
import "../../styles/shousha.css";

function ShoushaCharacter({ className = "", hairColor, mode = "full", size = 120, state = "idle", title }) {
  const uid = useId().replace(/:/g, "");
  const clipId = `eyeclip-${uid}`;

  const html = useMemo(() => {
    let s = SHOUSHA.svg;

    s = s.replace(/data-state="[^"]*"/g, `data-state="${state}"`);
    s = s.replace(/id="eyeclip"/g, `id="${clipId}"`);
    s = s.replace(/url\(#eyeclip\)/g, `url(#${clipId})`);

    if (mode === "avatar") {
      s = s.replace(/viewBox="[^"]*"/, 'viewBox="82 52 236 236"');
    }

    return s;
  }, [clipId, mode, state]);

  const hostStyle = {
    "--shousha-size": `${size}px`,
    ...(hairColor ? { "--hair": hairColor } : {}),
  };

  return (
    <span aria-label={title || "شوشة"} className={`shousha-host shousha-host--${mode} ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} role="img" style={hostStyle} />
  );
}

export default memo(ShoushaCharacter);