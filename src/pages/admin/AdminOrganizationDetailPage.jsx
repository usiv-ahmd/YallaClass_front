// src/pages/admin/AdminOrganizationDetailPage.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { adminApi } from "../../api/admin.api";
import Loading from "../../components/ui/Loading.jsx";
import { STATUS_LABELS } from "../../constants/roles.js";
import { formatDateTime } from "../../utils/format.js";

function statusBadgeClass(status) {
  return status === "SUSPENDED"
    ? "status-badge status-badge-suspended"
    : "status-badge status-badge-active";
}

export default function AdminOrganizationDetailPage() {
  const { id } = useParams();

  // Keying the inner component by id gives each organization a fresh loading
  // state when navigating between detail pages.
  return <AdminOrganizationDetail key={id} id={id} />;
}

function AdminOrganizationDetail({ id }) {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [nameDraft, setNameDraft] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await adminApi.getOrganization(id);
        if (cancelled) return;

        setOrganization(response.data);
        setNameDraft(response.data?.name || "");
      } catch (error) {
        if (cancelled) return;
        setLoadError(error?.message || "تعذّر تحميل بيانات المنظمة");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSaveName = async (event) => {
    event.preventDefault();
    if (saveBusy) return;

    const name = nameDraft.trim();

    if (name.length < 2 || name.length > 100) {
      setSaveError("اسم المنظمة لازم يكون بين حرفين و100 حرف.");
      return;
    }

    setSaveBusy(true);
    setSaveError(null);
    setSuccess("");

    try {
      const response = await adminApi.updateOrganization(id, { name });
      setOrganization(response.data);
      setNameDraft(response.data?.name || "");
      setSuccess("تم حفظ اسم المنظمة.");
    } catch (error) {
      setSaveError(error?.message || "تعذّر حفظ اسم المنظمة");
    } finally {
      setSaveBusy(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!organization || statusBusy) return;

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

    setStatusBusy(true);
    setStatusError(null);
    setSuccess("");

    try {
      const response = await adminApi.updateOrganizationStatus(id, nextStatus);
      setOrganization(response.data);
      setSuccess(
        nextStatus === "ACTIVE"
          ? "تم تنشيط المنظمة."
          : "تم إيقاف المنظمة."
      );
    } catch (error) {
      setStatusError(error?.message || "تعذّر تغيير حالة المنظمة");
    } finally {
      setStatusBusy(false);
    }
  };

  if (loading) {
    return (
      <Loading description="ثانية" title="بنحمّل بيانات المنظمة..." />
    );
  }

  if (loadError || !organization) {
    return (
      <section className="card stack-card">
        <p className="error-alert">
          {loadError || "المنظمة مش موجودة"}
        </p>
        <Link
          className="button button-primary turquoise"
          to="/admin/organizations"
        >
          <ArrowRight size={16} /> رجوع للمنظمات
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="card stack-card">
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon turquoise">
              <Building2 size={22} />
            </div>
            <div>
              <span className="card-eyebrow">تفاصيل المنظمة</span>
              <h2>{organization.name}</h2>
            </div>
          </div>

          <div className="admin-inline-actions">
            <span className={statusBadgeClass(organization.status)}>
              {STATUS_LABELS[organization.status] || organization.status}
            </span>
            <Link
              className="button button-primary ghost"
              to="/admin/organizations"
            >
              <ArrowRight size={16} /> رجوع
            </Link>
          </div>
        </div>

        {success && <p className="text-success">{success}</p>}

        <div className="admin-detail-grid">
          <div className="admin-detail-item">
            <span className="admin-detail-label">المالك</span>
            <strong>{organization.owner?.name || "—"}</strong>
            {organization.owner?.email && (
              <small>
                <Mail size={12} /> {organization.owner.email}
              </small>
            )}
          </div>

          <div className="admin-detail-item">
            <span className="admin-detail-label">عدد الأعضاء</span>
            <strong>
              <Users size={16} /> {organization.memberCount}
            </strong>
          </div>

          <div className="admin-detail-item">
            <span className="admin-detail-label">تاريخ الإنشاء</span>
            <strong>{formatDateTime(organization.createdAt)}</strong>
          </div>

          <div className="admin-detail-item">
            <span className="admin-detail-label">آخر تحديث</span>
            <strong>{formatDateTime(organization.updatedAt)}</strong>
          </div>
        </div>
      </section>

      <section className="card stack-card">
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon blue">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="card-eyebrow">بيانات المنظمة</span>
              <h2>تعديل الاسم</h2>
            </div>
          </div>
        </div>

        <form className="stack-card" onSubmit={handleSaveName}>
          <label htmlFor="admin-org-name">اسم المنظمة</label>
          <div className="input-wrap">
            <input
              id="admin-org-name"
              maxLength={100}
              required
              type="text"
              value={nameDraft}
              onChange={(event) => {
                setNameDraft(event.target.value);
                setSaveError(null);
                setSuccess("");
              }}
            />
          </div>

          {saveError && <p className="error-alert">{saveError}</p>}

          <button
            className="button button-primary turquoise"
            disabled={
              saveBusy ||
              nameDraft.trim().length === 0 ||
              nameDraft.trim() === organization.name
            }
            type="submit"
          >
            {saveBusy ? "جاري الحفظ..." : "حفظ الاسم"}
          </button>
        </form>
      </section>

      <section className="card stack-card">
        <div className="card-heading">
          <div className="card-heading-title">
            <div className="card-icon red">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="card-eyebrow">حالة المنظمة</span>
              <h2>تنشيط أو إيقاف</h2>
            </div>
          </div>
        </div>

        <p className="card-description">
          إيقاف المنظمة يمنع أعضاءها من تسجيل الدخول. تقدر ترجّعها نشطة في أي
          وقت.
        </p>

        {statusError && <p className="error-alert">{statusError}</p>}

        <button
          className={`button button-primary ${
            organization.status === "ACTIVE" ? "red" : "turquoise"
          }`}
          disabled={statusBusy}
          type="button"
          onClick={handleStatusToggle}
        >
          {statusBusy
            ? "جاري التحديث..."
            : organization.status === "ACTIVE"
              ? "إيقاف المنظمة"
              : "تنشيط المنظمة"}
        </button>
      </section>
    </>
  );
}
