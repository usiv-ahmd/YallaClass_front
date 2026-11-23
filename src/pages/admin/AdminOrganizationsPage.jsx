// src/pages/admin/AdminOrganizationsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Building2,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { adminApi } from "../../api/admin.api";
import Loading from "../../components/ui/Loading.jsx";
import { STATUS_LABELS } from "../../constants/roles.js";
import { formatDate } from "../../utils/format.js";

const INITIAL_FORM = {
  name: "",
  ownerName: "",
  ownerEmail: "",
  ownerPassword: "",
};

function validateCreateForm(form) {
  const name = form.name.trim();
  const ownerName = form.ownerName.trim();
  const ownerEmail = form.ownerEmail.trim().toLowerCase();
  const ownerPassword = form.ownerPassword;

  if (name.length < 2 || name.length > 100) {
    return "اسم المنظمة لازم يكون بين حرفين و100 حرف.";
  }

  if (ownerName.length < 2 || ownerName.length > 80) {
    return "اسم المالك لازم يكون بين حرفين و80 حرف.";
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ownerEmail)) {
    return "اكتب بريد إلكتروني صالح للمالك.";
  }

  if (ownerPassword.length < 8 || ownerPassword.length > 72) {
    return "كلمة مرور المالك لازم تكون بين 8 و72 حرف.";
  }

  return null;
}

function statusBadgeClass(status) {
  return status === "SUSPENDED"
    ? "status-badge status-badge-suspended"
    : "status-badge status-badge-active";
}

export default function AdminOrganizationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [createOpenState, setCreateOpenState] = useState(false);
  const createOpen = createOpenState || searchParams.get("create") === "1";
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(null);
  const [formBusy, setFormBusy] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await adminApi.listOrganizations();
        if (cancelled) return;
        setOrganizations(response.data || []);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error?.message || "تعذّر تحميل المنظمات");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrganizations = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return organizations;
    }

    return organizations.filter((organization) => {
      const ownerName = organization.owner?.name || "";
      const ownerEmail = organization.owner?.email || "";
      return (
        organization.name.toLowerCase().includes(term) ||
        ownerName.toLowerCase().includes(term) ||
        ownerEmail.toLowerCase().includes(term)
      );
    });
  }, [organizations, search]);

  const closeCreate = () => {
    setCreateOpenState(false);
    setFormError(null);

    if (searchParams.has("create")) {
      const next = new URLSearchParams(searchParams);
      next.delete("create");
      setSearchParams(next, { replace: true });
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (formBusy) return;

    const validationError = validateCreateForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormBusy(true);
    setFormError(null);
    setActionError(null);
    setSuccess("");

    try {
      const response = await adminApi.createOrganization({
        name: form.name.trim(),
        owner: {
          name: form.ownerName.trim(),
          email: form.ownerEmail.trim().toLowerCase(),
          password: form.ownerPassword,
        },
      });

      const created = response.data?.organization;

      if (created) {
        setOrganizations((prev) => [
          created,
          ...prev.filter((organization) => organization.id !== created.id),
        ]);
      }

      setForm(INITIAL_FORM);
      closeCreate();
      setSuccess("تم إنشاء المنظمة وحساب المالك بنجاح.");
    } catch (error) {
      setFormError(error?.message || "تعذّر إنشاء المنظمة");
    } finally {
      setFormBusy(false);
    }
  };

  const handleStatusToggle = async (organization) => {
    if (statusBusyId) return;

    const nextStatus =
      organization.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    if (
      nextStatus === "SUSPENDED" &&
      !window.confirm(
        `إيقاف منظمة "${organization.name}"؟ لن يتمكن أعضاؤها من تسجيل الدخول.`
      )
    ) {
      return;
    }

    setStatusBusyId(organization.id);
    setActionError(null);
    setSuccess("");

    try {
      const response = await adminApi.updateOrganizationStatus(
        organization.id,
        nextStatus
      );

      setOrganizations((prev) =>
        prev.map((item) =>
          item.id === organization.id ? response.data : item
        )
      );
      setSuccess(
        nextStatus === "ACTIVE"
          ? "تم تنشيط المنظمة."
          : "تم إيقاف المنظمة."
      );
    } catch (error) {
      setActionError(error?.message || "تعذّر تغيير حالة المنظمة");
    } finally {
      setStatusBusyId(null);
    }
  };

  return (
    <>
      <section className="card stack-card">
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon turquoise">
              <Building2 size={22} />
            </div>
            <div>
              <span className="card-eyebrow">إدارة المنظمات</span>
              <h2>كل المنظمات</h2>
            </div>
          </div>

          <button
            className="button button-primary turquoise"
            type="button"
            onClick={() => setCreateOpenState(true)}
          >
            <Plus size={16} /> منظمة جديدة
          </button>
        </div>

        {success && <p className="text-success">{success}</p>}
        {actionError && <p className="error-alert">{actionError}</p>}

        {loading && <Loading description="ثانية" title="بنحمّل المنظمات..." />}

        {!loading && loadError && (
          <p className="error-alert">{loadError}</p>
        )}

        {!loading && !loadError && organizations.length === 0 && (
          <div className="empty-questions">
            <Building2 size={26} />
            <strong>لسه مفيش منظمات</strong>
            <span>
              اضغط "منظمة جديدة" لإنشاء أول منظمة مع حساب مالكها في خطوة واحدة.
            </span>
          </div>
        )}

        {!loading && !loadError && organizations.length > 0 && (
          <>
            <div className="admin-filter-bar">
              <div className="input-wrap admin-search">
                <Search size={16} />
                <input
                  aria-label="بحث في المنظمات"
                  placeholder="ابحث باسم المنظمة أو المالك أو البريد"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            {filteredOrganizations.length === 0 ? (
              <div className="empty-questions">
                <Search size={26} />
                <strong>مفيش نتائج</strong>
                <span>جرّب كلمة بحث مختلفة.</span>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="students-table admin-table">
                  <thead>
                    <tr>
                      <th className="col-name">المنظمة</th>
                      <th>المالك</th>
                      <th>الأعضاء</th>
                      <th>الحالة</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrganizations.map((organization) => (
                      <tr key={organization.id}>
                        <td className="col-name">
                          <div className="admin-cell-stack">
                            <strong>{organization.name}</strong>
                            <small>{formatDate(organization.createdAt)}</small>
                          </div>
                        </td>
                        <td>
                          {organization.owner ? (
                            <div className="admin-cell-stack">
                              <span>{organization.owner.name}</span>
                              <small>
                                <Mail size={12} /> {organization.owner.email}
                              </small>
                            </div>
                          ) : (
                            <span className="cell-null">—</span>
                          )}
                        </td>
                        <td>
                          <span className="count-pill">
                            <Users size={13} /> {organization.memberCount}
                          </span>
                        </td>
                        <td>
                          <span className={statusBadgeClass(organization.status)}>
                            {STATUS_LABELS[organization.status] ||
                              organization.status}
                          </span>
                        </td>
                        <td>
                          <div className="admin-inline-actions">
                            <Link
                              className="button small-icon-button turquoise-icon"
                              title="عرض التفاصيل"
                              to={`/admin/organizations/${organization.id}`}
                            >
                              <ShieldCheck size={15} />
                            </Link>
                            <button
                              className={`button small-icon-button ${
                                organization.status === "ACTIVE"
                                  ? "red-icon"
                                  : "green"
                              }`}
                              disabled={statusBusyId === organization.id}
                              title={
                                organization.status === "ACTIVE"
                                  ? "إيقاف المنظمة"
                                  : "تنشيط المنظمة"
                              }
                              type="button"
                              onClick={() => handleStatusToggle(organization)}
                            >
                              <ShieldCheck size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {createOpen && (
        <div
          className="opened-window-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCreate();
          }}
        >
          <section className="card modal-window" role="dialog" aria-modal="true">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon turquoise">
                  <Plus size={22} />
                </div>
                <div>
                  <span className="card-kicker">منظمة جديدة</span>
                  <h2 className="modal-title">إنشاء منظمة وحساب المالك</h2>
                </div>
              </div>
              <button
                className="modal-close-button"
                type="button"
                onClick={closeCreate}
                aria-label="إغلاق"
              >
                <X size={17} />
              </button>
            </div>

            <form className="modal-content" onSubmit={handleCreate}>
              <label>اسم المنظمة</label>
              <div className="input-wrap">
                <input
                  maxLength={100}
                  placeholder="مثال: أكاديمية النور"
                  required
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </div>

              <label>اسم المالك</label>
              <div className="input-wrap">
                <input
                  maxLength={80}
                  placeholder="اسم صاحب المنظمة"
                  required
                  type="text"
                  value={form.ownerName}
                  onChange={(event) =>
                    setForm({ ...form, ownerName: event.target.value })
                  }
                />
              </div>

              <label>بريد المالك</label>
              <div className="input-wrap">
                <input
                  autoComplete="email"
                  placeholder="owner@yalla.com"
                  required
                  type="email"
                  value={form.ownerEmail}
                  onChange={(event) =>
                    setForm({ ...form, ownerEmail: event.target.value })
                  }
                />
              </div>

              <label>كلمة مرور المالك المبدئية</label>
              <div className="input-wrap">
                <input
                  autoComplete="new-password"
                  maxLength={72}
                  minLength={8}
                  placeholder="8 أحرف على الأقل"
                  required
                  type="password"
                  value={form.ownerPassword}
                  onChange={(event) =>
                    setForm({ ...form, ownerPassword: event.target.value })
                  }
                />
              </div>

              <p className="admin-form-hint">
                الدور ثابت: المالك (OWNER). لا يمكن إنشاء حساب أدمن من هذه
                الشاشة.
              </p>

              {formError && <p className="error-alert">{formError}</p>}

              <div className="modal-actions">
                <button
                  className="button modal-button white"
                  disabled={formBusy}
                  type="button"
                  onClick={closeCreate}
                >
                  إلغاء
                </button>
                <button
                  className="button modal-button turquoise"
                  disabled={formBusy}
                  type="submit"
                >
                  {formBusy ? "جاري الإنشاء..." : "إنشاء المنظمة"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
