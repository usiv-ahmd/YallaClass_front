// src/pages/StudentJoinPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, User, Palette } from "lucide-react";
import { sessionApi } from "../api/session.api";
import { storePlayerSeat } from "../hooks/usePlayerSession";
import ShoushaCharacter from "../components/student/ShoushaCharacter.jsx";
import ColorPicker from "../components/ui/ColorPicker.jsx";
import "../styles/student-page.css";

export default function StudentJoinPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [hairColor, setHairColor] = useState("#FF5A5F");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await sessionApi.join({
        code,
        name,
        nickname: nickname || name,
        avatar: { hairColor },
      });
      storePlayerSeat(res.data.session.id, res.data.student);
      navigate(`/join/${res.data.session.id}`, { replace: true });
    } catch (err) {
      setError(err.message || "تعذّر الانضمام");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="dashboard">
        <div className="layout">
          <div className="card stack-card auth-container">
            <div className="card-heading">
              <div className="card-heading-title">
                <span className="card-icon yellow">
                  <KeyRound size={26} />
                </span>
                <div>
                  <span className="card-eyebrow">
                    انضم في ثواني
                  </span>
                  <h2>ادخل الحصة</h2>
                </div>
              </div>
            </div>

            <form className="join-form" onSubmit={handleSubmit}>
              <label>اسم الشهرة (اختياري)</label>
              <div className="input-wrap">
                <User size={16} />
                <input id="join-nick" maxLength={24} placeholder="مثال: أحمد" type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
              </div>

              <label>اسمك</label>
              <div className="input-wrap">
                <User size={16} />
                <input id="join-name" maxLength={24} placeholder="الاسم الكامل" required type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <label>كود الحصة</label>
              <div className="input-wrap">
                <KeyRound size={16} />
                <input autoFocus id="join-code" maxLength={8} placeholder="ABC123" required type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
              </div>

              <label>لون شوشة (الأفاتار)</label>
              <div className="color-picker-container">
                <button className="custom-color-button" style={{ "--hair": hairColor }} title="دوس لتغيير اللون" type="button" onClick={() => setIsPickerOpen(true)}>
                  <Palette color={hairColor === "#FFFFFF" || hairColor === "#FFD23F" ? "#000" : "#FFF"} size={26} />
                </button>

                <div className="color-picker-preview">
                  <ShoushaCharacter hairColor={hairColor} mode="full" size={130} />
                </div>
              </div>

              {error && <p className="error-alert">
                {error}
              </p>}

              <button className="button button-center button-primary turquoise join-submit" disabled={busy} type="submit">
                {busy ? "بندخّلك..." : "ادخل الحصة"}
              </button>

              <span className="auth-back">
                <Link to="/">
                  <ArrowLeft size={14} /> رجوع
                </Link>
              </span>
            </form>
          </div>
        </div>
      </div>

      {isPickerOpen && (
        <ColorPicker color={hairColor} onChange={setHairColor} onClose={() => setIsPickerOpen(false)} />
      )}
    </div>
  );
}