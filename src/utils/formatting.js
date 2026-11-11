// src/utils/formatting.js

export function computeRankLabel(rankGain) {
  if (rankGain > 0) return `طلعت ${rankGain} ${rankGain === 1 ? "مركز" : "مراكز"} لفوق!`;
  if (rankGain < 0) return "لسه قدامك فرصة ترجع";
  return "كل نقطة هتقربك للصدارة";
}

export function getBellTitle({ online, hasActiveNotification, isOnCooldown }) {
  if (!online) return "الطالب غير متصل (أوفلاين)";
  if (hasActiveNotification) return "الطالب لديه تنبيه لم يتفاعل معه بعد";
  if (isOnCooldown) return "انتظر لحظات قبل إرسال تنبيه آخر";
  return "إرسال تنبيه للطالب";
}

export function getStudentStatusLabel(student) {
  if (!student?.interacted) return "لم يتفاعل";
  if ((student.missedCount || 0) + (student.timedOutCount || 0) > 0) return "متأخر";
  return "تمام";
}

export function escapeCSVCell(cell) {
  return `"${String(cell ?? "").replace(/"/g, '""')}"`;
}