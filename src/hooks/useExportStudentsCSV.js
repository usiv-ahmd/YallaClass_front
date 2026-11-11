// src/hooks/useExportStudentsCSV.js
import { useCallback } from "react";
import {
  buildStudentsCSV,
  downloadCSV,
  sortStudentsForLeaderboard,
} from "../utils/instructorView.js";

export function useExportStudentsCSV({ students }) {
  return useCallback(() => {
    if (!students || students.length === 0) {
      alert("لا يوجد طلاب لتصدير بياناتهم.");
      return;
    }
    const sorted = sortStudentsForLeaderboard(students);
    const csv = buildStudentsCSV({ students: sorted });
    const date = new Date().toLocaleDateString("ar-EG").replace(/\//g, "-");
    downloadCSV(csv, `كشف_الحضور_${date}.csv`);
  }, [students]);
}