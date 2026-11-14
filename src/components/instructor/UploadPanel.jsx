// src/components/student/UploadPanel.jsx
import { useState } from "react";
import { FileText, Sparkles, Trash2, UploadCloud } from "lucide-react";

export default function UploadPanel() {
  const [isUploading] = useState(false);
  const [files] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log("[UploadPanel] TODO wire to backend:", file.name);
  };

  const handleRemoveFile = (idx) => {
    console.log("[UploadPanel] TODO wire to backend, remove idx:", idx);
  };

  return (
    <div className="card screen stack-card">
      <div className="card-heading">
        <div className="card-heading-title">
          <div className="card-icon small-card-icon blue">
            <Sparkles size={19} />
          </div>
          <div>
            <span className="card-eyebrow">الذكاء الاصطناعي</span>
            <h2>ارفع ملف الشرح وهنعمل لك الاسئله</h2>
          </div>
        </div>
      </div>

      <div className="upload-box-container">
        <input type="file" id="material-upload-input" accept=".pdf,.docx,.txt" onChange={handleFileUpload} hidden />
        <label htmlFor="material-upload-input" className="upload-dropzone">
          <UploadCloud size={26} />
          <span>{isUploading ? "جاري تحليل المستند وتوليد الأسئلة..." : "إسقاط ملف PDF جديد هنا أو اضغط للرفع"}</span>
          <small>سيتم استخراج أسئلة تلقائية بالذكاء الاصطناعي للحصة الحالية</small>
        </label>

        {files.length > 0 && (
          <div className="attached-files-list">
            {files.map((f, idx) => (
              <div className="field attached-file-field" key={idx}>
                <FileText size={14} /> الملف المرفق: <b>{f.name}</b>
                <a href={f.url} target="_blank" rel="noreferrer">(عرض)</a>
                <button type="button" className="attached-file-remove" onClick={() => handleRemoveFile(idx)} aria-label={`حذف الملف ${f.name}`} title="حذف الملف">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}