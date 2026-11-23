// src/pages/OrganizationPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Mail,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import { useAuth } from "../store/auth.store.jsx";
import { useOrganization } from "../store/organization.store.jsx";
import Loading from "../components/ui/Loading.jsx";
import { ROLE_LABELS, STATUS_LABELS } from "../constants/roles.js";
import "../styles/admin.css";

const EMPTY_MEMBER = {
  name: "",
  email: "",
  password: "",
  role: "TEACHER",
};

function validateMember({ name, email, password, role }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (cleanName.length < 2 || cleanName.length > 80) {
    return "الاسم لازم يكون بين حرفين و80 حرف.";
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
    return "البريد الإلكتروني غير صالح.";
  }

  if (cleanPassword.length < 8 || cleanPassword.length > 72) {
    return "كلمة المرور لازم تكون بين 8 و72 حرف.";
  }

  if (!["TEACHER", "ASSISTANT"].includes(role)) {
    return "الدور لازم يكون مدرس أو مساعد.";
  }

  return null;
}

function statusBadgeClass(status) {
  return status === "SUSPENDED"
    ? "status-badge status-badge-suspended"
    : "status-badge status-badge-active";
}

export default function OrganizationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    organization,
    members,
    loading,
    error,
    updateOrganization,
    addMember,
    updateMember,
    removeMember,
  } = useOrganization();

  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState(null);
  const [nameOk, setNameOk] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [memberDraft, setMemberDraft] = useState(EMPTY_MEMBER);
  const [addError, setAddError] = useState(null);
  const [addBusy, setAddBusy] = useState(false);

  const [editMember, setEditMember] = useState(null);
  const [editDraft, setEditDraft] = useState({
    name: "",
    role: "TEACHER",
    status: "ACTIVE",
  });
  const [editError, setEditError] = useState(null);
  const [editBusy, setEditBusy] = useState(false);

  const [memberBusyId, setMemberBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionOk, setActionOk] = useState("");

  // Backend permissions: only OWNER can mutate the organization and members.
  const canEditOrg = user?.role === "OWNER";
  const canManageMembers = user?.role === "OWNER";

  const clearActionFeedback = () => {
    setActionError(null);
    setActionOk("");
  };

  const handleSaveName = async (event) => {
    event.preventDefault();
    if (savingName) return;

    const name = nameDraft.trim();

    if (name.length < 2 || name.length > 100) {
      setNameError("اسم المنظمة لازم يكون بين حرفين و100 حرف.");
      return;
    }

    setNameError(null);
    setNameOk(false);
    setSavingName(true);

    try {
      await updateOrganization({ name });
      setNameOk(true);
    } catch (err) {
      setNameError(err?.message || "تعذّر الحفظ");
    } finally {
      setSavingName(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    if (addBusy) return;

    const validationError = validateMember(memberDraft);
    if (validationError) {
      setAddError(validationError);
      return;
    }

    setAddError(null);
    setAddBusy(true);
    clearActionFeedback();

    try {
      await addMember({
        name: memberDraft.name.trim(),
        email: memberDraft.email.trim().toLowerCase(),
        password: memberDraft.password,
        role: memberDraft.role,
      });
      setMemberDraft(EMPTY_MEMBER);
      setAddOpen(false);
      setActionOk("تمت إضافة العضو بنجاح.");
    } catch (err) {
      setAddError(err?.message || "تعذّرت الإضافة");
    } finally {
      setAddBusy(false);
    }
  };

  const openEditMember = (member) => {
    setEditMember(member);
    setEditDraft({
      name: member.name || "",
      role: member.role === "ASSISTANT" ? "ASSISTANT" : "TEACHER",
      status: member.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
    });
    setEditError(null);
    clearActionFeedback();
  };

  const closeEditMember = () => {
    setEditMember(null);
    setEditError(null);
  };

  const handleEditMember = async (event) => {
    event.preventDefault();
    if (editBusy || !editMember) return;

    const name = editDraft.name.trim();

    if (name.length < 2 || name.length > 80) {
      setEditError("الاسم لازم يكون بين حرفين و80 حرف.");
      return;
    }

    if (!["TEACHER", "ASSISTANT"].includes(editDraft.role)) {
      setEditError("الدور لازم يكون مدرس أو مساعد.");
      return;
    }

    if (!["ACTIVE", "SUSPENDED"].includes(editDraft.status)) {
      setEditError("الحالة غير صالحة.");
      return;
    }

    setEditBusy(true);
    setEditError(null);
    clearActionFeedback();

    try {
      await updateMember(editMember.id, {
        name,
        role: editDraft.role,
        status: editDraft.status,
      });
      closeEditMember();
      setActionOk("تم تحديث بيانات العضو.");
    } catch (err) {
      setEditError(err?.message || "تعذّر تعديل العضو");
    } finally {
      setEditBusy(false);
    }
  };

  const handleStatusToggle = async (member) => {
    if (memberBusyId) return;

    const currentStatus = member.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    if (
      nextStatus === "SUSPENDED" &&
      !window.confirm(`إيقاف حساب "${member.name}"؟ مش هيقدر يسجل دخول.`)
    ) {
      return;
    }

    setMemberBusyId(member.id);
    clearActionFeedback();

    try {
      await updateMember(member.id, { status: nextStatus });
      setActionOk(
        nextStatus === "ACTIVE" ? "تم تنشيط العضو." : "تم إيقاف العضو."
      );
    } catch (err) {
      setActionError(err?.message || "تعذّر تغيير حالة العضو");
    } finally {
      setMemberBusyId(null);
    }
  };

  const handleRemove = async (member) => {
    if (memberBusyId) return;

    if (!window.confirm(`حذف "${member.name}" من المنظمة نهائيًا؟`)) {
      return;
    }

    setMemberBusyId(member.id);
    clearActionFeedback();

    try {
      await removeMember(member.id);
      setActionOk("تم حذف العضو.");
    } catch (err) {
      setActionError(err?.message || "تعذّر الحذف");
    } finally {
      setMemberBusyId(null);
    }
  };

  useEffect(() => {
    // Keep the local form draft in sync when the organization first loads or
    // is refreshed after a save.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (organization?.name) setNameDraft(organization.name);
  }, [organization?.name]);

  if (loading && !organization) {
    return (
      <div className="page">
        <Loading title="بنحمّل بيانات المنظمة..." description="ثانية واحدة" />
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="page">
        <div className="card stack-card">
          <p className="error-alert">{error}</p>
          <button
            className="button button-primary turquoise"
            type="button"
            onClick={() => navigate("/instructor-dashboard")}
          >
            <ArrowRight size={16} /> رجوع للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="page">
        <div className="card stack-card">
          <p className="error-alert">لا توجد منظمة مرتبطة بحسابك.</p>
          <button
            className="button button-primary turquoise"
            type="button"
            onClick={() => navigate("/instructor-dashboard")}
          >
            <ArrowRight size={16} /> رجوع للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="card page-heading">
        <div>
          <span className="page-eyebrow">
            <Building2 size={13} /> المنظمة
          </span>
          <h1>{organization.name}</h1>
          <p>
            {canManageMembers
              ? "إدارة المنظمة والأعضاء"
              : "عرض بيانات المنظمة وفريق العمل"}
          </p>
        </div>

        <div className="heading-meta">
          <span className={statusBadgeClass(organization.status)}>
            {STATUS_LABELS[organization.status] || organization.status || "نشط"}
          </span>
          <button
            className="button button-primary ghost"
            type="button"
            onClick={() => navigate("/instructor-dashboard")}
          >
            <ArrowRight size={16} /> رجوع
          </button>
        </div>
      </header>

      <main className="dashboard">
        <div className="layout col-layout">
          <section className="card stack-card">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon turquoise">
                  <Building2 size={22} />
                </div>
                <div>
                  <span className="card-eyebrow">البيانات الأساسية</span>
                  <h2>معلومات المنظمة</h2>
                </div>
              </div>
            </div>

            <form className="stack-card" onSubmit={handleSaveName}>
              <label htmlFor="org-name">اسم المنظمة</label>
              <div className="input-wrap">
                <input
                  id="org-name"
                  disabled={!canEditOrg || savingName}
                  maxLength={100}
                  required
                  type="text"
                  value={nameDraft}
                  onChange={(event) => {
                    setNameDraft(event.target.value);
                    setNameOk(false);
                    setNameError(null);
                  }}
                />
              </div>

              {nameError && <p className="error-alert">{nameError}</p>}
              {nameOk && <p className="text-success">✓ تم الحفظ</p>}

              {!canEditOrg && (
                <p className="card-description">
                  تعديل بيانات المنظمة متاح للمالك فقط.
                </p>
              )}

              {canEditOrg && (
                <button
                  className="button button-primary turquoise"
                  disabled={
                    savingName ||
                    nameDraft.trim().length === 0 ||
                    nameDraft.trim() === organization.name
                  }
                  type="submit"
                >
                  {savingName ? "جاري الحفظ..." : "حفظ الاسم"}
                </button>
              )}
            </form>
          </section>

          <section className="card stack-card">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon yellow">
                  <Users size={22} />
                </div>
                <div>
                  <span className="card-eyebrow">{members.length} عضو</span>
                  <h2>أعضاء المنظمة</h2>
                </div>
              </div>

              {canManageMembers && (
                <button
                  className="button button-primary turquoise"
                  type="button"
                  onClick={() => {
                    clearActionFeedback();
                    setAddError(null);
                    setAddOpen(true);
                  }}
                >
                  <Plus size={16} /> إضافة عضو
                </button>
              )}
            </div>

            {!canManageMembers && (
              <p className="card-description">
                إدارة الأعضاء متاحة للمالك فقط. تقدر تشوف الأدوار والحالات من
                هنا.
              </p>
            )}

            {actionOk && <p className="text-success">{actionOk}</p>}
            {actionError && <p className="error-alert">{actionError}</p>}

            {members.length === 0 ? (
              <div className="empty-questions">
                <Users size={26} />
                <strong>لسه مفيش أعضاء</strong>
                <span>
                  {canManageMembers
                    ? 'اضغط "إضافة عضو" لإنشاء أول حساب مدرس أو مساعد.'
                    : "المنظمة لسه مفيهاش أعضاء."}
                </span>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="students-table admin-table">
                  <thead>
                    <tr>
                      <th className="col-name">الاسم</th>
                      <th>البريد</th>
                      <th className="org-col-roles">الدور</th>
                      <th>الحالة</th>
                      <th className="org-col-action">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const isSelf = member.id === user?.id;
                      const isManageable =
                        canManageMembers &&
                        member.role !== "OWNER" &&
                        member.role !== "ADMIN";
                      const isBusy = memberBusyId === member.id;

                      return (
                        <tr key={member.id}>
                          <td className="col-name">
                            {member.name}
                            {isSelf && (
                              <small className="org-self-badge">(أنت)</small>
                            )}
                          </td>
                          <td>
                            <Mail size={12} className="org-mail-icon" />
                            {member.email}
                          </td>
                          <td>
                            <span className="status-badge">
                              {ROLE_LABELS[member.role] || member.role}
                            </span>
                          </td>
                          <td>
                            <span className={statusBadgeClass(member.status)}>
                              {STATUS_LABELS[member.status] ||
                                member.status ||
                                STATUS_LABELS.ACTIVE}
                            </span>
                          </td>
                          <td className="org-td-center">
                            {isManageable ? (
                              <div className="admin-inline-actions">
                                <button
                                  className="button small-icon-button blue-icon"
                                  disabled={isBusy}
                                  title="تعديل العضو"
                                  type="button"
                                  onClick={() => openEditMember(member)}
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  className={`button small-icon-button ${
                                    member.status === "SUSPENDED"
                                      ? "green"
                                      : "red-icon"
                                  }`}
                                  disabled={isBusy}
                                  title={
                                    member.status === "SUSPENDED"
                                      ? "تنشيط العضو"
                                      : "إيقاف العضو"
                                  }
                                  type="button"
                                  onClick={() => handleStatusToggle(member)}
                                >
                                  {member.status === "SUSPENDED" ? (
                                    <UserCheck size={15} />
                                  ) : (
                                    <UserX size={15} />
                                  )}
                                </button>
                                <button
                                  className="button small-icon-button red-icon"
                                  disabled={isBusy}
                                  title="حذف العضو"
                                  type="button"
                                  onClick={() => handleRemove(member)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            ) : (
                              <span className="cell-null">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {addOpen && (
        <div
          className="opened-window-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAddOpen(false);
          }}
        >
          <section className="card modal-window" role="dialog" aria-modal="true">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon turquoise">
                  <Plus size={22} />
                </div>
                <div>
                  <span className="card-kicker">عضو جديد</span>
                  <h2 className="modal-title">إضافة عضو</h2>
                </div>
              </div>
              <button
                className="modal-close-button"
                type="button"
                onClick={() => setAddOpen(false)}
                aria-label="إغلاق"
              >
                <X size={17} />
              </button>
            </div>

            <form className="modal-content" onSubmit={handleAddMember}>
              <label>الاسم</label>
              <div className="input-wrap">
                <input
                  maxLength={80}
                  placeholder="اسم العضو"
                  required
                  type="text"
                  value={memberDraft.name}
                  onChange={(event) =>
                    setMemberDraft({ ...memberDraft, name: event.target.value })
                  }
                />
              </div>

              <label>البريد الإلكتروني</label>
              <div className="input-wrap">
                <input
                  autoComplete="email"
                  placeholder="member@yalla.com"
                  required
                  type="email"
                  value={memberDraft.email}
                  onChange={(event) =>
                    setMemberDraft({ ...memberDraft, email: event.target.value })
                  }
                />
              </div>

              <label>كلمة المرور المبدئية</label>
              <div className="input-wrap">
                <input
                  autoComplete="new-password"
                  maxLength={72}
                  minLength={8}
                  placeholder="8 أحرف على الأقل"
                  required
                  type="password"
                  value={memberDraft.password}
                  onChange={(event) =>
                    setMemberDraft({
                      ...memberDraft,
                      password: event.target.value,
                    })
                  }
                />
              </div>

              <label>الدور</label>
              <div className="type-selector">
                <button
                  className={`type-chip${
                    memberDraft.role === "TEACHER" ? " selected" : ""
                  }`}
                  disabled={addBusy}
                  type="button"
                  onClick={() =>
                    setMemberDraft({ ...memberDraft, role: "TEACHER" })
                  }
                >
                  مدرس
                </button>
                <button
                  className={`type-chip${
                    memberDraft.role === "ASSISTANT" ? " selected" : ""
                  }`}
                  disabled={addBusy}
                  type="button"
                  onClick={() =>
                    setMemberDraft({ ...memberDraft, role: "ASSISTANT" })
                  }
                >
                  مساعد
                </button>
              </div>

              {addError && <p className="error-alert">{addError}</p>}

              <div className="modal-actions">
                <button
                  className="button modal-button white"
                  disabled={addBusy}
                  type="button"
                  onClick={() => setAddOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  className="button modal-button turquoise"
                  disabled={addBusy}
                  type="submit"
                >
                  {addBusy ? "جاري الإضافة..." : "إضافة"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {editMember && (
        <div
          className="opened-window-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditMember();
          }}
        >
          <section className="card modal-window" role="dialog" aria-modal="true">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon blue">
                  <Pencil size={22} />
                </div>
                <div>
                  <span className="card-kicker">تعديل عضو</span>
                  <h2 className="modal-title">{editMember.name}</h2>
                </div>
              </div>
              <button
                className="modal-close-button"
                type="button"
                onClick={closeEditMember}
                aria-label="إغلاق"
              >
                <X size={17} />
              </button>
            </div>

            <form className="modal-content" onSubmit={handleEditMember}>
              <label>الاسم</label>
              <div className="input-wrap">
                <input
                  maxLength={80}
                  required
                  type="text"
                  value={editDraft.name}
                  onChange={(event) => {
                    setEditDraft({ ...editDraft, name: event.target.value });
                    setEditError(null);
                  }}
                />
              </div>

              <label>الدور</label>
              <div className="type-selector">
                <button
                  className={`type-chip${
                    editDraft.role === "TEACHER" ? " selected" : ""
                  }`}
                  disabled={editBusy}
                  type="button"
                  onClick={() =>
                    setEditDraft({ ...editDraft, role: "TEACHER" })
                  }
                >
                  مدرس
                </button>
                <button
                  className={`type-chip${
                    editDraft.role === "ASSISTANT" ? " selected" : ""
                  }`}
                  disabled={editBusy}
                  type="button"
                  onClick={() =>
                    setEditDraft({ ...editDraft, role: "ASSISTANT" })
                  }
                >
                  مساعد
                </button>
              </div>

              <label>الحالة</label>
              <div className="type-selector">
                <button
                  className={`type-chip${
                    editDraft.status === "ACTIVE" ? " selected" : ""
                  }`}
                  disabled={editBusy}
                  type="button"
                  onClick={() =>
                    setEditDraft({ ...editDraft, status: "ACTIVE" })
                  }
                >
                  نشط
                </button>
                <button
                  className={`type-chip${
                    editDraft.status === "SUSPENDED" ? " selected" : ""
                  }`}
                  disabled={editBusy}
                  type="button"
                  onClick={() =>
                    setEditDraft({ ...editDraft, status: "SUSPENDED" })
                  }
                >
                  موقوف
                </button>
              </div>

              {editError && <p className="error-alert">{editError}</p>}

              <div className="modal-actions">
                <button
                  className="button modal-button white"
                  disabled={editBusy}
                  type="button"
                  onClick={closeEditMember}
                >
                  إلغاء
                </button>
                <button
                  className="button modal-button turquoise"
                  disabled={editBusy}
                  type="submit"
                >
                  {editBusy ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
