// src/components/admin/AdminLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../../store/auth.store.jsx";
import "../../styles/admin.css";

const NAV_ITEMS = [
  { to: "/admin", label: "نظرة عامة", icon: LayoutDashboard, end: true },
  { to: "/admin/organizations", label: "المنظمات", icon: Building2 },
  { to: "/admin/users", label: "المستخدمون", icon: Users },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page admin-page">
      <header className="card page-heading admin-page-heading">
        <div>
          <span className="page-eyebrow">
            <ShieldCheck size={13} /> لوحة إدارة المنصة
          </span>
          <h1>إدارة يلا كلاس</h1>
          <p>
            إنشاء المنظمات وحسابات المالكين، ومتابعة حالة المستخدمين على مستوى
            المنصة.
          </p>
        </div>

        <div className="heading-meta admin-heading-meta">
          <div className="admin-user-chip">
            <strong>{user?.name || "أدمن"}</strong>
            <small>{user?.email || ""}</small>
          </div>
          <button
            className="button icon-button red-icon"
            title="تسجيل الخروج"
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <nav className="card admin-nav" aria-label="أقسام لوحة الإدارة">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            className={({ isActive }) =>
              `admin-nav-link${isActive ? " is-active" : ""}`
            }
            end={end}
            to={to}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="dashboard admin-content">
        <Outlet />
      </main>
    </div>
  );
}
