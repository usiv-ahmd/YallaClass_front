// src/api/roster.api.js
import { client } from "./client";

export const sectionApi = {
  list: (params) => client.roster.listSections(params),
  getById: (sectionId) => client.roster.getSection(sectionId),
  create: (payload) => client.roster.createSection(payload),
  update: (sectionId, patch) => client.roster.updateSection(sectionId, patch),
  delete: (sectionId) => client.roster.deleteSection(sectionId),
};

export const studentApi = {
  list: (params) => client.roster.listStudents(params),
  getById: (studentId) => client.roster.getStudent(studentId),
  create: (payload) => client.roster.createStudent(payload),
  importStudents: (section, students) =>
    client.roster.importStudents(section, students),
  update: (studentId, patch) => client.roster.updateStudent(studentId, patch),
  updateAvatar: (studentId, avatar) =>
    client.roster.updateStudentAvatar(studentId, avatar),
  delete: (studentId) => client.roster.deleteStudent(studentId),
  getHistory: (studentId, params) =>
    client.roster.getStudentHistory(studentId, params),
};

export const avatarApi = {
  getOptions: () => client.roster.getAvatarOptions(),
};
