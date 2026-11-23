// src/store/roster.store.jsx
import { useCallback, useEffect, useState } from "react";
import { avatarApi, sectionApi, studentApi } from "../api/roster.api.js";
import { normalizeAvatarOptions } from "../adapters/roster.adapter.js";
import { useAuth } from "./auth.store.jsx";

function sortSections(sections) {
  return [...sections].sort((a, b) => a.name.localeCompare(b.name, "ar"));
}

function sortStudents(students) {
  return [...students].sort((a, b) => a.name.localeCompare(b.name, "ar"));
}

function adjustSectionCount(sections, sectionId, delta) {
  if (!sectionId || !delta) return sections;

  return sections.map((section) =>
    section.id === sectionId
      ? {
          ...section,
          studentCount: Math.max(0, (section.studentCount || 0) + delta),
        }
      : section
  );
}

export function useRoster() {
  const { isAuthenticated } = useAuth();
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [avatarOptions, setAvatarOptions] = useState(() =>
    normalizeAvatarOptions({})
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [sectionsRes, studentsRes, avatarsRes] = await Promise.all([
        sectionApi.list(),
        studentApi.list(),
        avatarApi.getOptions(),
      ]);

      setSections(sortSections(sectionsRes.data || []));
      setStudents(sortStudents(studentsRes.data || []));
      setAvatarOptions(avatarsRes.data);
    } catch (e) {
      setError(e.message || "تعذّر تحميل بيانات الطلاب");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const createSection = useCallback(async (payload) => {
    const res = await sectionApi.create(payload);
    setSections((prev) => sortSections([...prev, res.data]));
    return res.data;
  }, []);

  const updateSection = useCallback(async (sectionId, patch) => {
    const res = await sectionApi.update(sectionId, patch);
    setSections((prev) =>
      sortSections(
        prev.map((section) =>
          section.id === sectionId ? { ...section, ...res.data } : section
        )
      )
    );
    return res.data;
  }, []);

  const deleteSection = useCallback(async (sectionId) => {
    await sectionApi.delete(sectionId);
    setSections((prev) => prev.filter((section) => section.id !== sectionId));
  }, []);

  const createStudent = useCallback(async (payload) => {
    const res = await studentApi.create(payload);
    const student = res.data;

    setStudents((prev) => sortStudents([...prev, student]));
    setSections((prev) => adjustSectionCount(prev, student.sectionId, 1));
    return student;
  }, []);

  const importStudents = useCallback(async (sectionId, studentsToImport) => {
    const res = await studentApi.importStudents(sectionId, studentsToImport);
    const imported = res.data?.students || [];

    setStudents((prev) => sortStudents([...prev, ...imported]));
    setSections((prev) =>
      adjustSectionCount(prev, sectionId, imported.length)
    );

    return res.data;
  }, []);

  const updateStudent = useCallback(
    async (studentId, patch) => {
      const existing = students.find((item) => item.id === studentId);
      const res = await studentApi.update(studentId, patch);
      const student = res.data;

      setStudents((prev) =>
        sortStudents(
          prev.map((item) => (item.id === studentId ? student : item))
        )
      );

      if (existing && existing.sectionId !== student.sectionId) {
        setSections((prev) => {
          const movedOut = adjustSectionCount(prev, existing.sectionId, -1);
          return adjustSectionCount(movedOut, student.sectionId, 1);
        });
      }

      return student;
    },
    [students]
  );

  const updateStudentAvatar = useCallback(async (studentId, avatar) => {
    const res = await studentApi.updateAvatar(studentId, avatar);
    setStudents((prev) =>
      prev.map((item) => (item.id === studentId ? res.data : item))
    );
    return res.data;
  }, []);

  const deleteStudent = useCallback(
    async (studentId) => {
      const removed = students.find((item) => item.id === studentId) || null;

      setStudents((prev) => prev.filter((item) => item.id !== studentId));

      try {
        await studentApi.delete(studentId);
        if (removed) {
          setSections((prev) =>
            adjustSectionCount(prev, removed.sectionId, -1)
          );
        }
      } catch (error) {
        if (removed) {
          setStudents((prev) => sortStudents([...prev, removed]));
        }
        throw error;
      }
    },
    [students]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return {
    sections,
    students,
    avatarOptions,
    loading,
    error,
    refresh,
    createSection,
    updateSection,
    deleteSection,
    createStudent,
    importStudents,
    updateStudent,
    updateStudentAvatar,
    deleteStudent,
  };
}

export function useStudentHistory(studentId, { limit = 20, offset = 0, status } = {}) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!studentId) {
      setHistory(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await studentApi.getHistory(studentId, {
        limit,
        offset,
        status,
      });
      setHistory(res.data);
    } catch (e) {
      setError(e.message || "تعذّر تحميل سجل الطالب");
      setHistory(null);
    } finally {
      setLoading(false);
    }
  }, [studentId, limit, offset, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { history, loading, error, refresh };
}
