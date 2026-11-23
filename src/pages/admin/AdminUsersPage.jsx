// src/pages/admin/AdminUsersPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Mail,
  Search,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { adminApi } from "../../api/admin.api";
import Loading from "../../components/ui/Loading.jsx";
import {
  ROLE_LABELS,
  ROLES,
  STATUS_LABELS,
} from "../../constants/roles.js";
import { useAuth } from "../../store/auth.store.jsx";
import { formatDateTime } from "../../utils/format.js";

const ROLE_FILTERS = [
  { value: "ALL", label: "كل الأدوار" },
  { value: ROLES.ADMIN, label: ROLE_LABELS.ADMIN },
  { value: ROLES.OWNER, label: ROLE_LABELS.OWNER },
  { value: ROLES.TEACHER, label: ROLE_LABELS.TEACHER },
  { value: ROLES.ASSISTANT, label: ROLE_LABELS.ASSISTANT },
];

const STATUS_FILTERS = [
  { value: "ALL", label: "كل الحالات" },
  { value: "ACTIVE", label: STATUS_LABELS.ACTIVE },
  { value: "SUSPENDED", label: STATUS_LABELS.SUSPENDED },
];

function statusBadgeClass(status) {
  return status === "SUSPENDED"
    ? "status-badge status-badge-suspended"
    : "status-badge status-badge-active";
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [statusBusyId, setStatusBusyId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await adminApi.listUsers();
        if (cancelled) return;
        setUsers(response.data || []);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error?.message || "تعذّر تحميل المستخدمين");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) {
        return false;
      }

      if (statusFilter !== "ALL" && user.status !== statusFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        String(user.name || "").toLowerCase().includes(term) ||
        String(user.email || "").toLowerCase().includes(term)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const openDetails = async (user) => {
    setDetailId(user.id);
    setDetailUser(user);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const response = await adminApi.getUser(user.id);
      setDetailUser(response.data);
    } catch (error) {
      setDetailError(error?.message || "تعذّر تحميل بيانات المستخدم");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailId(null);
    setDetailUser(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  const handleStatusToggle = async (user) => {
    if (statusBusyId) return;

    if (currentUser?.id === user.id) {
      setActionError("مش ممكن تغيّر حالة حسابك بنفسك.");
      return;
    }

    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    if (
      nextStatus === "SUSPENDED" &&
      !window.confirm(
        `إيقاف حساب "${user.name}"؟ مش هيقدر يسجل دخول لحد ما يتم تنشيطه.`
      )
    ) {
      return;
    }

    setStatusBusyId(user.id);
    setActionError(null);
    setSuccess("");

    try {
      const response = await adminApi.updateUserStatus(user.id, nextStatus);

      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? response.data : item))
      );

      if (detailUser?.id === user.id) {
        setDetailUser(response.data);
      }

      setSuccess(
        nextStatus === "ACTIVE" ? "تم تنشيط الحساب." : "تم إيقاف الحساب."
      );
    } catch (error) {
      setActionError(error?.message || "تعذّر تغيير حالة المستخدم");
    } finally {
      setStatusBusyId(null);
    }
  };

  return (
    <>
      <section className="card stack-card">
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon yellow">
              <Users size={22} />
            </div>
            <div>
              <span className="card-eyebrow">إدارة المستخدمين</span>
              <h2>كل حسابات المنصة</h2>
            </div>
          </div>
        </div>

        {success && <p className="text-success">{success}</p>}
        {actionError && <p className="error-alert">{actionError}</p>}

        {loading && <Loading description="ثانية" title="بنحمّل المستخدمين..." />}

        {!loading && loadError && <p className="error-alert">{loadError}</p>}

        {!loading && !loadError && users.length === 0 && (
          <div className="empty-questions">
            <Users size={26} />
            <strong>لسه مفيش مستخدمين</strong>
            <span>المستخدمون بيظهروا هنا بعد إنشاء المنظمات وأعضاء الفريق.</span>
          </div>
        )}

        {!loading && !loadError && users.length > 0 && (
          <>
            <div className="admin-filter-bar">
              <div className="input-wrap admin-search">
                <Search size={16} />
                <input
                  aria-label="بحث في المستخدمين"
                  placeholder="ابحث بالاسم أو البريد"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <select
                aria-label="تصفية بالدور"
                className="org-select admin-filter-select"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                {ROLE_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="تصفية بالحالة"
                className="org-select admin-filter-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="empty-questions">
                <Search size={26} />
                <strong>مفيش نتائج</strong>
                <span>جرّب تغيير البحث أو الفلاتر.</span>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="students-table admin-table">
                  <thead>
                    <tr>
                      <th className="col-name">المستخدم</th>
                      <th>الدور</th>
                      <th>المنظمة</th>
                      <th>الحالة</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const isSelf = currentUser?.id === user.id;

                      return (
                        <tr key={user.id}>
                          <td className="col-name">
                            <div className="admin-cell-stack">
                              <strong>
                                {user.name}
                                {isSelf && (
                                  <small className="org-self-badge">(أنت)</small>
                                )}
                              </strong>
                              <small>
                                <Mail size={12} /> {user.email}
                              </small>
                            </div>
                          </td>
                          <td>
                            <span className="status-badge">
                              {ROLE_LABELS[user.role] || user.role}
                            </span>
                          </td>
                          <td>
                            {user.organizationId ? (
                              <span className="admin-org-ref">
                                <Building2 size={13} /> مرتبط بمنظمة
                              </span>
                            ) : (
                              <span className="cell-null">بدون منظمة</span>
                            )}
                          </td>
                          <td>
                            <span className={statusBadgeClass(user.status)}>
                              {STATUS_LABELS[user.status] || user.status}
                            </span>
                          </td>
                          <td>
                            <div className="admin-inline-actions">
                              <button
                                className="button small-icon-button blue-icon"
                                title="عرض التفاصيل"
                                type="button"
                                onClick={() => openDetails(user)}
                              >
                                <UserCog size={15} />
                              </button>
                              <button
                                className={`button small-icon-button ${
                                  user.status === "ACTIVE"
                                    ? "red-icon"
                                    : "green"
                                }`}
                                disabled={
                                  isSelf || statusBusyId === user.id
                                }
                                title={
                                  isSelf
                                    ? "لا يمكنك تغيير حالة حسابك"
                                    : user.status === "ACTIVE"
                                      ? "إيقاف الحساب"
                                      : "تنشيط الحساب"
                                }
                                type="button"
                                onClick={() => handleStatusToggle(user)}
                              >
                                <ShieldCheck size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {detailId && (
        <div
          className="opened-window-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <section className="card modal-window" role="dialog" aria-modal="true">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon blue">
                  <UserCog size={22} />
                </div>
                <div>
                  <span className="card-kicker">تفاصيل المستخدم</span>
                  <h2 className="modal-title">
                    {detailUser?.name || "المستخدم"}
                  </h2>
                </div>
              </div>
              <button
                className="modal-close-button"
                type="button"
                onClick={closeDetails}
                aria-label="إغلاق"
              >
                <X size={17} />
              </button>
            </div>

            {detailLoading && (
              <Loading description="ثانية" title="بنحمّل التفاصيل..." />
            )}

            {!detailLoading && detailError && (
              <p className="error-alert">{detailError}</p>
            )}

            {!detailLoading && !detailError && detailUser && (
              <>
                <div className="admin-detail-grid">
                  <div className="admin-detail-item">
                    <span className="admin-detail-label">الاسم</span>
                    <strong>{detailUser.name}</strong>
                  </div>

                  <div className="admin-detail-item">
                    <span className="admin-detail-label">البريد</span>
                    <strong>{detailUser.email}</strong>
                  </div>

                  <div className="admin-detail-item">
                    <span className="admin-detail-label">الدور</span>
                    <strong>
                      {ROLE_LABELS[detailUser.role] || detailUser.role}
                    </strong>
                  </div>

                  <div className="admin-detail-item">
                    <span className="admin-detail-label">الحالة</span>
                    <strong>
                      {STATUS_LABELS[detailUser.status] || detailUser.status}
                    </strong>
                  </div>

                  <div className="admin-detail-item">
                    <span className="admin-detail-label">معرّف المنظمة</span>
                    <strong className="admin-mono">
                      {detailUser.organizationId || "—"}
                    </strong>
                  </div>

                  <div className="admin-detail-item">
                    <span className="admin-detail-label">تاريخ الإنشاء</span>
                    <strong>{formatDateTime(detailUser.createdAt)}</strong>
                  </div>

                  <div className="admin-detail-item">
                    <span className="admin-detail-label">آخر تحديث</span>
                    <strong>{formatDateTime(detailUser.updatedAt)}</strong>
                  </div>
                </div>

                <p className="admin-form-hint">
                  الدور غير قابل للتعديل من لوحة الأدمن. تغيير الحالة لا يغيّر
                  الدور.
                </p>

                <div className="modal-actions">
                  <button
                    className="button modal-button white"
                    type="button"
                    onClick={closeDetails}
                  >
                    إغلاق
                  </button>
                  <button
                    className={`button modal-button ${
                      detailUser.status === "ACTIVE" ? "red" : "turquoise"
                    }`}
                    disabled={
                      currentUser?.id === detailUser.id ||
                      statusBusyId === detailUser.id
                    }
                    type="button"
                    onClick={() => handleStatusToggle(detailUser)}
                  >
                    {statusBusyId === detailUser.id
                      ? "جاري التحديث..."
                      : detailUser.status === "ACTIVE"
                        ? "إيقاف الحساب"
                        : "تنشيط الحساب"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
