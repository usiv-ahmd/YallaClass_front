// src/components/student/JoinScreen.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, ArrowLeft, AlertCircle } from "lucide-react";

export default function JoinScreen({ onJoin, error }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onJoin(name, code);
  };

  return (
    <div className="page">
      <main className="dashboard">
        <div className="layout">
          <div className="card stack-card auth-container">
            <div className="card-heading">
              <div className="card-heading-title">
                <span className="card-icon yellow"><KeyRound size={26} /></span>
                <div>
                  <span className="card-eyebrow">هتدخل على طول</span>
                  <h2>اسمك وكود الحصة</h2>
                </div>
              </div>
            </div>

            <form className="join-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="student-name">اسمك</label>
              <div className="input-wrap">
                <input
                  id="student-name"
                  type="text"
                  autoComplete="off"
                  maxLength={24}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسمك"
                />
              </div>

              <label htmlFor="session-code">كود الحصة</label>
              <div className="input-wrap">
                <KeyRound size={17} aria-hidden="true" />
                <input
                  id="session-code"
                  type="text"
                  autoComplete="off"
                  maxLength={24}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="مثال: ABC123"
                />
              </div>

              {error && (
                <p className="error-alert">
                  <AlertCircle size={14} /> {error}
                </p>
              )}

              <button
                type="submit"
                className="button button-center button-primary join-submit"
              >
                ادخل الحصة <ArrowLeft size={18} />
              </button>

              <span className="auth-back">
                <Link to="/"><ArrowLeft size={14} /> رجوع للصفحة الرئيسية</Link>
              </span>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}