// src/components/instructor/Leaderboard.jsx
import { useMemo } from "react";
import { Bell, CheckCheck, ClipboardList, Download, LogOut, Trash2 } from "lucide-react";
import SendNotificationModal from "../../modals/SendNotificationModal.jsx";
import { useLeaderboardActions } from "../../hooks/useLeaderboardActions.js";
import { useExportStudentsCSV } from "../../hooks/useExportStudentsCSV.js";
import { sortStudentsForLeaderboard } from "../../utils/instructorView.js";
import { getBellTitle, getStudentStatusLabel } from "../../utils/formatting.js";

export default function Leaderboard({ students = [], onDelete, onSendNotification }) {
  const {
    isOnline,
    onlineCount,
    isCoolingDown,
    targetStudent,
    setTargetStudent,
    sending,
    handleSendNotification,
    handleAction,
  } = useLeaderboardActions({ students, onDelete, onSendNotification });

  const exportToCSV = useExportStudentsCSV({ students });

  const sortedStudents = useMemo(() => sortStudentsForLeaderboard(students), [students]);
  const attendedCount  = students.filter((s) => s.attended).length;

  return (
    <div className="card">
      <div className="card-heading">
        <div className="card-heading-title">
          <div className="card-icon small-card-icon blue">
            <ClipboardList size={19} />
          </div>
          <h2>الحضور والتفاعل</h2>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="count-pill" title="عدد الحاضرين">
            {attendedCount}
          </span>
          <span className="count-pill count-pill--online" title="الطلاب الموجودون الآن">
            {onlineCount} متصل
          </span>
          <button
            type="button"
            className="button icon-button blue-icon"
            onClick={exportToCSV}
            title="تصدير جدول الطلاب (Excel/CSV)"
            aria-label="تصدير الجدول"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      <table className="students-table">
        <thead>
          <tr>
            <th className="col-rank">#</th>
            <th className="col-name">الاسم</th>
            <th className="col-interacted">تفاعل</th>
            <th className="col-timedout">انتهى وقتها</th>
            <th className="col-missed">غاب عنها</th>
            <th className="col-score">Score</th>
            <th className="col-streak">Streak</th>
            <th className="col-warn">تحذير</th>
            <th className="col-delete">إجراء</th>
          </tr>
        </thead>
        <tbody>
          {sortedStudents.map((student, index) => {
            const online                 = isOnline(student);
            const hasActiveNotification  = Boolean(student.activeNotification);
            const isOnCooldown           = isCoolingDown(student.id);
            const isBellDisabled         = !online || hasActiveNotification || isOnCooldown || sending;
            const showCheck              = online && (hasActiveNotification || isOnCooldown);

            const bellTitle = getBellTitle({ online, hasActiveNotification, isOnCooldown });
            const statusLabel = getStudentStatusLabel(student);

            return (
              <tr key={student.id} className={online ? "student-row-online" : "student-row-offline"}>
                <td className="col-rank">{index + 1}</td>

                <td className="col-name">
                  <span
                    className={`online-dot${online ? " online-dot--on" : ""}`}
                    title={online ? "متصل الآن" : "غير متصل"}
                    aria-hidden="true"
                  />
                  {student.name}
                </td>

                <td className="col-interacted">
                  {!student.interacted ? (
                    <span className="status-badge status-badge-inactive" title="لم يتفاعل — لم يجاوب على أي سؤال">
                      لم يتفاعل
                    </span>
                  ) : (student.missedCount || 0) + (student.timedOutCount || 0) > 0 ? (
                    <span className="status-badge status-badge-late" title="متأخر — في أسئلة ناقصة">
                      متأخر
                    </span>
                  ) : (
                    <span className="check-area check-yes" title="تمام ✓ جاوب على كل الأسئلة">
                      ✓
                    </span>
                  )}
                </td>

                <td className="col-timedout">
                  {(student.timedOutCount || 0) > 0 ? (
                    <span
                      className="check-area check-no"
                      title={`${student.timedOutCount} سؤال شافه والوقت خلص`}
                    >
                      {student.timedOutCount}
                    </span>
                  ) : (
                    <span className="cell-null" title="لا يوجد">—</span>
                  )}
                </td>

                <td className="col-missed">
                  {(student.missedCount || 0) > 0 ? (
                    <span
                      className="check-area check-no"
                      title={`${student.missedCount} سؤال ما شافهوش`}
                    >
                      {student.missedCount}
                    </span>
                  ) : (
                    <span className="cell-null" title="لا يوجد">—</span>
                  )}
                </td>

                <td className="col-score">{student.score}</td>
                <td className="col-streak">🔥 {student.highestStreak}</td>

                <td className="col-warn">
                  <button
                    type="button"
                    className={`button icon-button ${!online || showCheck ? "green-icon-toggled" : "orange-icon"}`}
                    onClick={() => setTargetStudent(student)}
                    disabled={isBellDisabled}
                    title={bellTitle}
                  >
                    {showCheck ? <CheckCheck size={15} /> : <Bell size={15} />}
                  </button>
                </td>

                <td className="col-delete">
                  <button
                    type="button"
                    className="button icon-button red-icon"
                    onClick={() => handleAction(student)}
                    title={online ? "إخراج الطالب من الحصة الحية" : "حذف الحساب نهائيًا"}
                    aria-label={online ? `إخراج ${student.name}` : `حذف حساب ${student.name}`}
                  >
                    {online ? <LogOut size={15} /> : <Trash2 size={15} />}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {targetStudent && (
        <SendNotificationModal
          studentName={targetStudent.name}
          onClose={() => setTargetStudent(null)}
          onSend={handleSendNotification}
          isPending={sending}
        />
      )}
    </div>
  );
}