// src/providers/http/roster.http.js
import { http } from "../../api/httpClient";
import { envelopeData, ok, pick } from "./response";
import {
  buildAvatarPayload,
  buildImportPayload,
  buildSectionPatch,
  buildSectionPayload,
  buildStudentPatch,
  buildStudentPayload,
  normalizeAvatarOptions,
  normalizeSection,
  normalizeSectionList,
  normalizeStudent,
  normalizeStudentHistory,
  normalizeStudentList,
} from "../../adapters/roster.adapter.js";

function queryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const text = query.toString();
  return text ? `?${text}` : "";
}

export const rosterHttp = {
  async listSections(params = {}) {
    const body = await http.get(`/sections${queryString(params)}`);
    return ok(normalizeSectionList(pick(body, "sections") ?? []));
  },

  async getSection(sectionId) {
    const body = await http.get(`/sections/${sectionId}`);
    return ok(normalizeSection(pick(body, "section")));
  },

  async createSection(payload = {}) {
    const body = await http.post("/sections", buildSectionPayload(payload));
    return ok(normalizeSection(pick(body, "section")));
  },

  async updateSection(sectionId, patch = {}) {
    const body = await http.patch(
      `/sections/${sectionId}`,
      buildSectionPatch(patch)
    );
    return ok(normalizeSection(pick(body, "section")));
  },

  async deleteSection(sectionId) {
    const body = await http.delete(`/sections/${sectionId}`);
    return ok(pick(body, "id") ?? sectionId);
  },

  async listStudents(params = {}) {
    const body = await http.get(`/students${queryString(params)}`);
    return ok(normalizeStudentList(pick(body, "students") ?? []));
  },

  async getStudent(studentId) {
    const body = await http.get(`/students/${studentId}`);
    return ok(normalizeStudent(pick(body, "student")));
  },

  async createStudent(payload = {}) {
    const body = await http.post("/students", buildStudentPayload(payload));
    return ok(normalizeStudent(pick(body, "student")));
  },

  async importStudents(section, students) {
    const body = await http.post(
      "/students/import",
      buildImportPayload(section, students)
    );

    return ok({
      importedCount: Number(pick(body, "importedCount")) || 0,
      students: normalizeStudentList(pick(body, "students") ?? []),
    });
  },

  async updateStudent(studentId, patch = {}) {
    const body = await http.patch(
      `/students/${studentId}`,
      buildStudentPatch(patch)
    );
    return ok(normalizeStudent(pick(body, "student")));
  },

  async updateStudentAvatar(studentId, avatar = {}) {
    const body = await http.patch(
      `/students/${studentId}/avatar`,
      buildAvatarPayload(avatar)
    );
    return ok(normalizeStudent(pick(body, "student")));
  },

  async deleteStudent(studentId) {
    const body = await http.delete(`/students/${studentId}`);
    return ok(pick(body, "id") ?? studentId);
  },

  async getStudentHistory(studentId, params = {}) {
    const body = await http.get(
      `/students/${studentId}/history${queryString(params)}`
    );
    return ok(normalizeStudentHistory(pick(body, "history")));
  },

  async getAvatarOptions() {
    const body = await http.get("/avatars/options");
    return ok(normalizeAvatarOptions(envelopeData(body)));
  },
};
