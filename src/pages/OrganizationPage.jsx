// src/pages/OrganizationPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Mail, Plus, Trash2, Users, X } from "lucide-react";
import { useAuth } from "../store/auth.store.jsx";
import { useOrganization } from "../store/organization.store.jsx";
import Loading from "../components/ui/Loading.jsx";

const ROLE_LABEL = { OWNER: "مالك", TEACHER: "مدرس", ASSISTANT: "مساعد", ADMIN: "أدمن" };

export default function OrganizationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization, members, loading, error, updateOrganization, addMember, updateMember, removeMember } = useOrganization();

  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState(null);
  const [nameOk, setNameOk] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [memberDraft, setMemberDraft] = useState({ name: "", email: "", password: "", role: "TEACHER" });
  const [addError, setAddError] = useState(null);
  const [addBusy, setAddBusy] = useState(false);

  const canEditOrg = user?.role === "OWNER";
  const canManageMembers = user?.role === "OWNER" || user?.role === "ASSISTANT";

  const handleSaveName = async (e) => {
    e.preventDefault();
    setNameError(null);
    setNameOk(false);
    setSavingName(true);
    try { await updateOrganization({ name: nameDraft }); setNameOk(true); }
    catch (err) { setNameError(err.message || "تعذّر الحفظ"); }
    finally { setSavingName(false); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddError(null);
    setAddBusy(true);
    try {
      await addMember(memberDraft);
      setMemberDraft({ name: "", email: "", password: "", role: "TEACHER" });
      setAddOpen(false);
    } catch (err) {
      setAddError(err.message || "تعذّرت الإضافة");
    } finally {
      setAddBusy(false);
    }
  };

  const handleRoleChange = async (memberId, role) => {
    try { await updateMember(memberId, { role }); }
    catch (err) { alert(err.message || "تعذّر تعديل الدور"); }
  };

  const handleRemove = async (member) => {
    if (!window.confirm(`حذف "${member.name}" من المنظمة؟`)) return;
    try { await removeMember(member.id); }
    catch (err) { alert(err.message || "تعذّر الحذف"); }
  };

  useEffect(() => {
    if (organization?.name) setNameDraft(organization.name);
  }, [organization?.name]);

  if (loading && !organization) {
    return <div className="page"><Loading title="بنحمّل بيانات المنظمة..." description="ثانية واحدة" /></div>;
  }

  if (error && !organization) {
    return (
      <div className="page">
        <div className="card stack-card">
          <p className="error-alert">{error}</p>
          <button className="button button-primary turquoise" type="button" onClick={() => navigate("/instructor-dashboard")}>
            <ArrowRight size={16} /> رجوع للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  if (!organization) return null;

  return (
    <div className="page">
      <header className="card page-heading">
        <div>
          <span className="page-eyebrow"><Building2 size={13} /> المنظمة</span>
          <h1>{organization.name}</h1>
          <p>إدارة المنظمة والأعضاء</p>
        </div>
        <div className="heading-meta">
          <button className="button button-primary ghost" type="button" onClick={() => navigate("/instructor-dashboard")}>
            <ArrowRight size={16} /> رجوع
          </button>
        </div>
      </header>

      <main className="dashboard">
        <div className="layout col-layout">
          <section className="card stack-card">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon turquoise"><Building2 size={22} /></div>
                <div>
                  <span className="card-eyebrow">البيانات الأساسية</span>
                  <h2>معلومات المنظمة</h2>
                </div>
              </div>
            </div>

            <form className="stack-card" onSubmit={handleSaveName}>
              <label>اسم المنظمة</label>
              <div className="input-wrap">
                <input
                  id="org-name"
                  disabled={!canEditOrg || savingName}
                  maxLength={80}
                  required
                  type="text"
                  value={nameDraft}
                  onChange={(e) => { setNameDraft(e.target.value); setNameOk(false); setNameError(null); }}
                />
              </div>

              {nameError && <p className="error-alert">{nameError}</p>}
              {nameOk && <p className="text-success">✓ تم الحفظ</p>}

              {canEditOrg && (
                <button
                  className="button button-primary turquoise"
                  disabled={savingName || nameDraft === organization.name}
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
                <div className="card-icon yellow"><Users size={22} /></div>
                <div>
                  <span className="card-eyebrow">{members.length} عضو</span>
                  <h2>أعضاء المنظمة</h2>
                </div>
              </div>
              {canManageMembers && (
                <button className="button button-primary turquoise" type="button" onClick={() => setAddOpen(true)}>
                  <Plus size={16} /> إضافة عضو
                </button>
              )}
            </div>

            <table className="students-table">
              <thead>
                <tr>
                  <th className="col-name">الاسم</th>
                  <th>البريد</th>
                  <th className="org-col-roles">الدور</th>
                  <th className="org-col-action">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const isSelf = member.id === user?.id;
                  const canEdit = canManageMembers && member.role !== "OWNER";
                  const canDelete = user?.role === "OWNER" && member.role !== "OWNER" && !isSelf;
                  return (
                    <tr key={member.id}>
                      <td className="col-name">
                        {member.name}
                        {isSelf && <small className="org-self-badge">(أنت)</small>}
                      </td>
                      <td>
                        <Mail size={12} className="org-mail-icon" />
                        {member.email}
                      </td>
                      <td>
                        {canEdit ? (
                          <select
                            className="org-select"
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          >
                            <option value="TEACHER">مدرس</option>
                            <option value="ASSISTANT">مساعد</option>
                          </select>
                        ) : (
                          <span className={`status-badge ${member.role === "OWNER" ? "status-badge-inactive" : "status-badge-late"}`}>
                            {ROLE_LABEL[member.role] || member.role}
                          </span>
                        )}
                      </td>
                      <td className="org-td-center">
                        {canDelete ? (
                          <button className="button icon-button red-icon" type="button" onClick={() => handleRemove(member)} aria-label={`حذف ${member.name}`}>
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <span className="cell-null">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>
      </main>

      {addOpen && (
        <div className="opened-window-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setAddOpen(false); }}>
          <section className="card modal-window" role="dialog" aria-modal="true">
            <div className="card-heading">
              <div className="card-heading-title">
                <div className="card-icon turquoise"><Plus size={22} /></div>
                <div>
                  <span className="card-kicker">عضو جديد</span>
                  <h2 className="modal-title">إضافة عضو</h2>
                </div>
              </div>
              <button className="modal-close-button" type="button" onClick={() => setAddOpen(false)} aria-label="إغلاق">
                <X size={17} />
              </button>
            </div>

            <form className="modal-content" onSubmit={handleAddMember}>
              <label>الاسم</label>
              <div className="input-wrap">
                <input placeholder="اسم العضو" required type="text" value={memberDraft.name} onChange={(e) => setMemberDraft({ ...memberDraft, name: e.target.value })} />
              </div>

              <label>البريد الإلكتروني</label>
              <div className="input-wrap">
                <input placeholder="member@yalla.com" required type="email" value={memberDraft.email} onChange={(e) => setMemberDraft({ ...memberDraft, email: e.target.value })} />
              </div>

              <label>كلمة المرور المبدئية</label>
              <div className="input-wrap">
                <input minLength={6} placeholder="6 حروف على الأقل" required type="password" value={memberDraft.password} onChange={(e) => setMemberDraft({ ...memberDraft, password: e.target.value })} />
              </div>

              <label>الدور</label>
              <div className="type-selector">
                <button className={`type-chip${memberDraft.role === "TEACHER" ? " selected" : ""}`} type="button" onClick={() => setMemberDraft({ ...memberDraft, role: "TEACHER" })}>مدرس</button>
                <button className={`type-chip${memberDraft.role === "ASSISTANT" ? " selected" : ""}`} type="button" onClick={() => setMemberDraft({ ...memberDraft, role: "ASSISTANT" })}>مساعد</button>
              </div>

              {addError && <p className="error-alert">{addError}</p>}

              <div className="modal-actions">
                <button className="button modal-button white" type="button" onClick={() => setAddOpen(false)}>إلغاء</button>
                <button className="button modal-button turquoise" disabled={addBusy} type="submit">
                  {addBusy ? "جاري الإضافة..." : "إضافة"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}