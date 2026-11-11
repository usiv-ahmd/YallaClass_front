// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Presentation, ArrowLeft } from "lucide-react";
import { API } from "../mock-api";
import { setAuthSession, setCurrentTeacherName } from "../mock-api/auth.js";
import { MOCK_INSTRUCTOR } from "../constants/auth.js";
import "../styles/auth.css";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);
  const navigate                = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (API.useMock) {
      if (
        formData.email.trim() === MOCK_INSTRUCTOR.email &&
        formData.password === MOCK_INSTRUCTOR.password
      ) {
        setCurrentTeacherName("المدرس");
        setAuthSession({
          token: "mock-token",
          user: {
            name: "المدرس",
            role: "instructor",
            email: MOCK_INSTRUCTOR.email,
          },
        });
        navigate("/instructor-dashboard");
      } else {
        setError("البريد أو كلمة المرور غلط");
      }
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API.baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError(payload?.message || "البريد أو كلمة المرور غلط");
        return;
      }

      setAuthSession({ token: payload.data.token, user: payload.data.user });
      navigate("/instructor-dashboard");
    } catch {
      setError("مش قادر أوصل للسيرفر.");
    } finally {
      setBusy(false);
    }
  };

  const fillMock = () => {
    setFormData({ ...MOCK_INSTRUCTOR });
    setError("");
  };

  return (
    <div className="page">
      <div className="dashboard">
        <div className="layout">
          <div className="card auth-container">
            <div className="auth-header">
              <h2 className="auth-tilte">تسجيل دخول المدرس</h2>
              <p>سجّل دخولك عشان تنشئ الحصص وتتحكم فيها.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <label>البريد الإلكتروني</label>
              <div className="input-wrap">
                <input
                  type="email"
                  name="email"
                  placeholder="instructor@yalla.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <label>كلمة المرور</label>
              <div className="input-wrap">
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && <p className="error-alert">{error}</p>}

              <button type="submit" className="submit-btn red" disabled={busy}>
                {busy ? "جاري الدخول..." : "دخول كمدرس"}
              </button>
            </form>

            <span className="auth-switch">
              انت طالب؟ <Link to="/student-dashboard">دوس هنا</Link>
            </span>

            <span className="auth-back">
              <Link to="/">
                <ArrowLeft size={14} /> رجوع للصفحة الرئيسية
              </Link>
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
        <button
          type="button"
          onClick={fillMock}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px dashed rgba(124, 58, 237, 0.35)",
            background: "rgba(124, 58, 237, 0.05)",
            color: "#7c3aed",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Presentation size={16} /> دخول كمحاضر (Mock)
        </button>
      </div>
    </div>
  );
}