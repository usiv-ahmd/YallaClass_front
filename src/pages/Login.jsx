// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Presentation, ArrowLeft } from "lucide-react";
import { useAuth } from "../store/auth.store.jsx";
import { MOCK_INSTRUCTOR } from "../constants/auth.js";
import "../styles/auth.css";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, isReady, isAuthenticated } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      const to = location.state?.from || "/instructor-dashboard";
      navigate(to, { replace: true });
    } catch {
    } finally {
      setBusy(false);
    }
  };

  const fillMock = () => {
    setFormData({ ...MOCK_INSTRUCTOR });
  };

  useEffect(() => {
    if (isReady && isAuthenticated) {
      const to = location.state?.from || "/instructor-dashboard";
      navigate(to, { replace: true });
    }
  }, [isReady, isAuthenticated, navigate, location.state]);

  return (
    <div className="page">
      <div className="dashboard">
        <div className="layout">
          <div className="card auth-container">
            <div className="auth-header">
              <h2 className="auth-tilte">
                تسجيل دخول المدرس
              </h2>
              <p>
                سجّل دخولك عشان تنشئ الحصص وتتحكم فيها.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <label>البريد الإلكتروني</label>
              <div className="input-wrap">
                <input name="email" placeholder="instructor@yalla.com" required type="email" value={formData.email} onChange={handleChange} />
              </div>

              <label>كلمة المرور</label>
              <div className="input-wrap">
                <input name="password" placeholder="••••••••" required type="password" value={formData.password} onChange={handleChange} />
              </div>

              {error && <p className="error-alert">
                {error}
              </p>}

              <button className="submit-btn red" disabled={busy} type="submit">
                {busy ? "جاري الدخول..." : "دخول كمدرس"}
              </button>
            </form>

            <span className="auth-switch">
              انت طالب؟ <Link to="/join">
                دوس هنا
              </Link>
            </span>

            <span className="auth-back">
              <Link to="/">
                <ArrowLeft size={14} /> رجوع للصفحة الرئيسية
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}