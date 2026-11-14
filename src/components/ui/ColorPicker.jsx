// src/components/ui/ColorPicker.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { X } from "lucide-react";
import "../../styles/colorpicker.css";

function hsvToRgb(h, s, v) {
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 255, g: 90, b: 95 };
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("").toUpperCase();
}

export default function ColorPicker({ color, onChange, onClose }) {
  const initialRgb = hexToRgb(color || "#FF5A5F");
  const originalColor = useRef(color || "#FF5A5F");
  const [hsv, setHsv] = useState(() => rgbToHsv(initialRgb.r, initialRgb.g, initialRgb.b));
  const [hexInput, setHexInput] = useState((color || "#FF5A5F").replace("#", ""));
  const pickerRef = useRef(null);
  const hueRef = useRef(null);
  const currentRgb = useMemo(() => hsvToRgb(hsv.h, hsv.s, hsv.v), [hsv]);
  const currentHex = useMemo(() => rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b), [currentRgb]);
  const hueHex = useMemo(() => {
    const c = hsvToRgb(hsv.h, 100, 100);
    return rgbToHex(c.r, c.g, c.b);
  }, [hsv.h]);

  useEffect(() => {
    onChange(currentHex);
    setHexInput(currentHex.replace("#", ""));
  }, [currentHex]);

  const updatePointer = (e, ref, cb) => {
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    cb(x, y);
  };

  const onPickerDown = (e) => {
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);
    updatePointer(e, pickerRef, (x, y) => setHsv((p) => ({ ...p, s: x * 100, v: (1 - y) * 100 })));
  };

  const onPickerMove = (e) => {
    if (e.buttons !== 1) return;
    updatePointer(e, pickerRef, (x, y) => setHsv((p) => ({ ...p, s: x * 100, v: (1 - y) * 100 })));
  };

  const onHueDown = (e) => {
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);
    updatePointer(e, hueRef, (_, y) => setHsv((p) => ({ ...p, h: y * 360 })));
  };

  const onHueMove = (e) => {
    if (e.buttons !== 1) return;
    updatePointer(e, hueRef, (_, y) => setHsv((p) => ({ ...p, h: y * 360 })));
  };

  const handleHexChange = (e) => {
    const v = e.target.value.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
    setHexInput(v);
    if (v.length === 6) {
      const rgb = hexToRgb("#" + v);
      setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
    }
  };

  return (
    <div className="opened-window-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="presentation">
      <section className="card modal-window ps-picker-modal" role="dialog" aria-modal="true">
        <div className="card-heading mb-12">
          <div className="card-heading-title">
            <div className="card-icon yellow">
              <span className="emoji-22">
                🎨
              </span>
            </div>
            <div>
              <span className="card-kicker">
                تخصيص شوشة
              </span>
              <h2 className="modal-title">
                اختار لون الشعر
              </h2>
            </div>
          </div>
          <button type="button" className="modal-close-button" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        <div className="ps-picker-layout">
          <div className="ps-picker-middle">
            <div className="ps-preview-box">
              <span className="ps-preview-label">
                current
              </span>
              <div className="ps-swatch" style={{ "--swatch": originalColor.current }} />
            </div>
            <div className="ps-preview-box">
              <span className="ps-preview-label">
                new
              </span>
              <div className="ps-swatch" style={{ "--swatch": currentHex }} />
            </div>
          </div>

          <div className="ps-picker-top">
            <div className="ps-picker-2d" style={{ "--hue-color": hueHex }} onPointerDown={onPickerDown} onPointerMove={onPickerMove} ref={pickerRef}>
              <div className="ps-picker-2d-cursor" style={{ "--cx": `${hsv.s}%`, "--cy": `${100 - hsv.v}%` }} />
            </div>
            <div className="ps-picker-hue" onPointerDown={onHueDown} onPointerMove={onHueMove} ref={hueRef}>
              <div className="ps-picker-hue-cursor" style={{ "--cy": `${(hsv.h / 360) * 100}%` }} />
            </div>
          </div>

          <div className="ps-picker-bottom">
            <div className="ps-picker-inputs">
              <div className="ps-input-row ps-hex-row">
                <label>#</label>
                <input type="text" className="ps-hex-input" value={hexInput} onChange={handleHexChange} maxLength={6} spellCheck={false} />
              </div>
            </div>
            <div className="ps-picker-actions">
              <button type="button" className="button modal-button white" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="button modal-button turquoise" onClick={onClose}>
                OK
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}