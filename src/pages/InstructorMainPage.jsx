// src/pages/InstructorMainPage.jsx
import { Link, useNavigate } from "react-router-dom";
import { Building2, Library, LogOut, Radio, Sparkles } from "lucide-react";
import { useAuth } from "../store/auth.store.jsx";
import "../styles/Instructor-page.css";

export default function InstructorMainPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page">
      <header className="card page-heading">
        <div>
          <span className="page-eyebrow">
            <Sparkles size={13} /> مساحة المحاضر
          </span>
          <h1>أهلاً {user?.name || "بك"} 👋</h1>
          <p>
            اختار من فين تحب تبدأ — كويزاتك، جلساتك، ولا إعدادات المنظمة.
          </p>
        </div>
        <div className="heading-meta">
          <button className="button icon-button red-icon" title="تسجيل الخروج" type="button" onClick={handleLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="dashboard">
        <div className="grid-cards-280">
          <Link className="card link-card" to="/library">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon turquoise">
                  <Library size={24} />
                </div>
                <div>
                  <span className="card-eyebrow">
                    كويزاتك
                  </span>
                  <h2>المكتبة</h2>
                </div>
              </div>
            </div>
            <p className="card-description">
              أنشئ، عدّل، كرر، وأرشف الكويزات. جهّز أسئلتك هنا قبل ما تفتح جلسة.
            </p>
            <span className="card-eyebrow">
              من هنا →
            </span>
          </Link>

          <Link className="card link-card" to="/sessions">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon yellow">
                  <Radio size={24} />
                </div>
                <div>
                  <span className="card-eyebrow">
                    جلسات اللايف
                  </span>
                  <h2>الجلسات</h2>
                </div>
              </div>
            </div>
            <p className="card-description">
              افتح جلسة من كويز جاهز، شير الكود مع طلابك، وتحكم في اللعب live.
            </p>
            <span className="card-eyebrow">
              من هنا →
            </span>
          </Link>

          <Link className="card link-card" to="/organization">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon blue">
                  <Building2 size={24} />
                </div>
                <div>
                  <span className="card-eyebrow">
                    الفريق
                  </span>
                  <h2>المنظمة</h2>
                </div>
              </div>
            </div>
            <p className="card-description">
              إدارة بيانات المنظمة والأعضاء (مدرسين ومساعدين)، والصلاحيات.
            </p>
            <span className="card-eyebrow">
              من هنا →
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}