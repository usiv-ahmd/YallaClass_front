// src/pages/admin/AdminDashboardPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Plus,
  ShieldAlert,
  Users,
} from "lucide-react";
import { adminApi } from "../../api/admin.api";
import Loading from "../../components/ui/Loading.jsx";
import { STATUS_LABELS } from "../../constants/roles.js";
import { formatDate } from "../../utils/format.js";

export default function AdminDashboardPage() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    organizations: [],
    users: [],
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [organizationsRes, usersRes] = await Promise.all([
          adminApi.listOrganizations(),
          adminApi.listUsers(),
        ]);

        if (cancelled) return;

        setState({
          loading: false,
          error: null,
          organizations: organizationsRes.data || [],
          users: usersRes.data || [],
        });
      } catch (error) {
        if (cancelled) return;

        setState((prev) => ({
          ...prev,
          loading: false,
          error: error?.message || "تعذّر تحميل بيانات لوحة الإدارة",
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return (
      <Loading
        description="بنحمّل المنظمات والمستخدمين"
        title="ثانية واحدة..."
      />
    );
  }

  if (state.error) {
    return (
      <section className="card stack-card">
        <p className="error-alert">{state.error}</p>
        <Link className="button button-primary turquoise" to="/admin/organizations">
          <Building2 size={16} /> الانتقال للمنظمات
        </Link>
      </section>
    );
  }

  const { organizations, users } = state;
  const activeOrganizations = organizations.filter(
    (organization) => organization.status === "ACTIVE"
  ).length;
  const suspendedOrganizations = organizations.filter(
    (organization) => organization.status === "SUSPENDED"
  ).length;
  const activeUsers = users.filter((user) => user.status === "ACTIVE").length;
  const suspendedUsers = users.filter(
    (user) => user.status === "SUSPENDED"
  ).length;
  const recentOrganizations = organizations.slice(0, 5);

  return (
    <>
      <section className="card stack-card">
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon turquoise">
              <Building2 size={22} />
            </div>
            <div>
              <span className="card-eyebrow">إجراء سريع</span>
              <h2>إضافة منظمة وحساب مالكها</h2>
            </div>
          </div>

          <Link
            className="button button-primary turquoise"
            to="/admin/organizations?create=1"
          >
            <Plus size={16} /> منظمة جديدة
          </Link>
        </div>

        <p className="card-description">
          إنشاء المنظمة وحساب المالك بيتم في طلب واحد، وبعدها المالك يقدر يضيف
          المدرسين والمساعدين من لوحة المنظمة.
        </p>
      </section>

      <section className="admin-stats-grid">
        <article className="card admin-stat-card">
          <div className="admin-stat-icon turquoise">
            <Building2 size={20} />
          </div>
          <span className="admin-stat-label">إجمالي المنظمات</span>
          <strong className="admin-stat-value">{organizations.length}</strong>
          <small className="admin-stat-hint">
            {activeOrganizations} نشطة · {suspendedOrganizations} موقوفة
          </small>
        </article>

        <article className="card admin-stat-card">
          <div className="admin-stat-icon yellow">
            <Users size={20} />
          </div>
          <span className="admin-stat-label">إجمالي المستخدمين</span>
          <strong className="admin-stat-value">{users.length}</strong>
          <small className="admin-stat-hint">
            {activeUsers} نشط · {suspendedUsers} موقوف
          </small>
        </article>

        <article className="card admin-stat-card">
          <div className="admin-stat-icon green">
            <CheckCircle2 size={20} />
          </div>
          <span className="admin-stat-label">منظمات نشطة</span>
          <strong className="admin-stat-value">{activeOrganizations}</strong>
          <Link className="admin-stat-link" to="/admin/organizations">
            عرض المنظمات
          </Link>
        </article>

        <article className="card admin-stat-card">
          <div className="admin-stat-icon red">
            <ShieldAlert size={20} />
          </div>
          <span className="admin-stat-label">حسابات موقوفة</span>
          <strong className="admin-stat-value">{suspendedUsers}</strong>
          <Link className="admin-stat-link" to="/admin/users">
            عرض المستخدمين
          </Link>
        </article>
      </section>

      <section className="card stack-card">
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon blue">
              <Building2 size={22} />
            </div>
            <div>
              <span className="card-eyebrow">أحدث المنظمات</span>
              <h2>آخر ما تم إنشاؤه</h2>
            </div>
          </div>
          <Link className="button button-primary ghost" to="/admin/organizations">
            عرض الكل
          </Link>
        </div>

        {recentOrganizations.length === 0 ? (
          <div className="empty-questions">
            <Building2 size={26} />
            <strong>لسه مفيش منظمات</strong>
            <span>ابدأ بإنشاء أول منظمة وحساب مالكها من زر "منظمة جديدة".</span>
          </div>
        ) : (
          <div className="admin-list">
            {recentOrganizations.map((organization) => (
              <Link
                key={organization.id}
                className="admin-list-row"
                to={`/admin/organizations/${organization.id}`}
              >
                <div className="admin-list-main">
                  <strong>{organization.name}</strong>
                  <small>
                    المالك: {organization.owner?.name || "—"} ·{" "}
                    {organization.memberCount} عضو
                  </small>
                </div>
                <div className="admin-list-meta">
                  <span
                    className={`status-badge ${
                      organization.status === "SUSPENDED"
                        ? "status-badge-suspended"
                        : "status-badge-active"
                    }`}
                  >
                    {STATUS_LABELS[organization.status] || organization.status}
                  </span>
                  <small>{formatDate(organization.createdAt)}</small>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
