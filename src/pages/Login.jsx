// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../store/auth.store.jsx";
import { resolvePostLoginPath } from "../constants/roles.js";
import "../styles/auth.css";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, isReady, isAuthenticated, user } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    try {
      const nextUser = await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      const to = resolvePostLoginPath(nextUser?.role, location.state?.from);
      navigate(to, { replace: true });
    } catch {
      // The auth store exposes the backend error through `error`.
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (isReady && isAuthenticated) {
      const to = resolvePostLoginPath(user?.role, location.state?.from);
      navigate(to, { replace: true });
    }
  }, [isReady, isAuthenticated, user?.role, navigate, location.state]);

  return (
    <div className="page">
      <div className="dashboard">
        <div className="layout">
          <div className="card auth-container">
            <div className="auth-header">
              <h2 className="auth-tilte">تسجيل الدخول</h2>
              <p>سجّل دخولك للوصول للوحة التحكم المناسبة لدورك.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <label>البريد الإلكتروني</label>
              <div className="input-wrap">
                <input
                  autoComplete="email"
                  name="email"
                  placeholder="name@yalla.com"
                  required
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <label>كلمة المرور</label>
              <div className="input-wrap">
                <input
                  autoComplete="current-password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {error && <p className="error-alert">{error}</p>}

              <button className="submit-btn red" disabled={busy} type="submit">
                {busy ? "جاري الدخول..." : "دخول"}
              </button>
            </form>

            <span className="auth-switch">
              انت طالب؟ <Link to="/join">دوس هنا</Link>
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
