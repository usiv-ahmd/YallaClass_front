// src/providers/mock/report.mock.js
import * as XLSX from "xlsx";
import { db } from "./db";
import { delay, requireOrg } from "./latency";

function ownSessionOrThrow(sessionId, user) {
  const session = db.sessions.findById(sessionId);
  if (!session) throw { status: 404, message: "الحصة مش موجودة" };
  if (session.organizationId !== user.organizationId) {
    throw { status: 403, message: "غير مصرح" };
  }
  return session;
}

function assertFinished(session) {
  if (!session.finishedAt) {
    throw { status: 409, message: "الجلسة لسه مخلصتش — أنهِها الأول عشان تتحسب التقارير" };
  }
}

function getAnswers(session, studentId) {
  return session.answers?.[studentId] || {};
}

function countAnswered(session, studentId) {
  const answers = getAnswers(session, studentId);
  return Object.values(answers).filter((a) => a && a.selectedOption != null).length;
}

function attendanceFor(session, student) {
  const totalQ = session.questions?.length || 0;
  const threshold = session.settings?.attendanceThreshold ?? 0.5;
  const answered = countAnswered(session, student.id);
  const present = totalQ > 0 && answered / totalQ >= threshold;
  return present ? "PRESENT" : "ABSENT";
}

function buildSummary(session) {
  const totalStudents = session.students?.length || 0;
  const totalQuestions = session.questions?.length || 0;
  const durationSeconds = Math.round(((session.finishedAt || Date.now()) - session.createdAt) / 1000);

  const allAnswers = [];
  for (const s of session.students || []) {
    for (const a of Object.values(getAnswers(session, s.id))) {
      if (a) allAnswers.push(a);
    }
  }
  const answeredCount = allAnswers.filter((a) => a.selectedOption != null).length;
  const correctCount = allAnswers.filter((a) => a.isCorrect && a.selectedOption != null).length;
  const correctPercentage = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  const averageScore = totalStudents > 0 ? Math.round(session.students.reduce((sum, s) => sum + (s.score || 0), 0) / totalStudents) : 0;

  const topPlayers = [...(session.students || [])]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3)
    .map((s) => ({ id: s.id, name: s.name, score: s.score || 0 }));

  let hardestQuestion = null;
  for (const q of session.questions || []) {
    let answered = 0;
    let correct = 0;
    for (const s of session.students || []) {
      const a = getAnswers(session, s.id)[q.id];
      if (a && a.selectedOption != null) {
        answered++;
        if (a.isCorrect) correct++;
      }
    }
    if (answered === 0) continue;
    const pct = Math.round((correct / answered) * 100);
    if (!hardestQuestion || pct < hardestQuestion.correctPercentage) {
      hardestQuestion = { id: q.id, text: q.text, correctPercentage: pct, answersCount: answered };
    }
  }

  return {
    totalParticipants: totalStudents,
    totalQuestions,
    durationSeconds,
    averageScore,
    correctPercentage,
    topPlayers,
    hardestQuestion,
  };
}

function buildQuestions(session) {
  return (session.questions || []).map((q, idx) => {
    const distribution = {};
    let answered = 0;
    let correct = 0;
    let timedOut = 0;

    for (const s of session.students || []) {
      const a = getAnswers(session, s.id)[q.id];
      if (!a) continue;
      if (a.selectedOption == null) {
        timedOut++;
        continue;
      }
      answered++;
      distribution[a.selectedOption] = (distribution[a.selectedOption] || 0) + 1;
      if (a.isCorrect) correct++;
    }

    const totalStudents = session.students?.length || 0;
    const skipped = Math.max(0, totalStudents - answered - timedOut);

    let mostCommonWrong = null;
    let maxCount = 0;
    for (const [optIdx, count] of Object.entries(distribution)) {
      if (Number(optIdx) === q.correctOptionIndex) continue;
      if (count > maxCount) {
        maxCount = count;
        mostCommonWrong = { optionIndex: Number(optIdx), optionText: q.options?.[Number(optIdx)] || "", count };
      }
    }

    return {
      questionIndex: idx + 1,
      questionId: q.id,
      text: q.text,
      type: q.type,
      correctOptionIndex: q.correctOptionIndex,
      correctPercentage: answered > 0 ? Math.round((correct / answered) * 100) : 0,
      answeredCount: answered,
      correctCount: correct,
      timedOutCount: timedOut,
      skippedCount: skipped,
      distribution,
      mostCommonWrong,
    };
  });
}

function buildStudents(session) {
  const totalQuestions = session.questions?.length || 0;

  return (session.students || [])
    .slice()
    .sort((a, b) => (a.rank || 999) - (b.rank || 999))
    .map((s) => {
      const answers = getAnswers(session, s.id);
      const answerList = Object.values(answers).filter((a) => a && a.selectedOption != null);
      const avgResponseMs = answerList.length > 0 ? Math.round(answerList.reduce((sum, a) => sum + (a.responseMs || 0), 0) / answerList.length) : 0;
      const wrongQuestions = Object.values(answers)
        .filter((a) => a && a.selectedOption != null && !a.isCorrect)
        .map((a) => {
          const q = (session.questions || []).find((x) => x.id === a.questionId);
          return { questionId: a.questionId, text: q?.text || "" };
        });

      return {
        studentId: s.id,
        name: s.name,
        nickname: s.nickname || s.name,
        score: s.score || 0,
        rank: s.rank || 0,
        correctAnswers: s.correctAnswers || 0,
        wrongAnswers: s.wrongAnswers || 0,
        answeredQuestions: answerList.length,
        totalQuestions,
        avgResponseMs,
        highestStreak: s.highestStreak || 0,
        wrongQuestions,
        attendanceStatus: attendanceFor(session, s),
      };
    });
}

function buildAttendance(session) {
  const totalQuestions = session.questions?.length || 0;
  const threshold = session.settings?.attendanceThreshold ?? 0.5;

  return (session.students || []).map((s) => {
    const answered = countAnswered(session, s.id);
    const present = totalQuestions > 0 && answered / totalQuestions >= threshold;
    const durationSeconds = Math.round(((s.leftAt || session.finishedAt || Date.now()) - s.joinedAt) / 1000);
    return {
      studentId: s.id,
      name: s.name,
      joinedAt: s.joinedAt,
      leftAt: s.leftAt,
      durationSeconds,
      answeredQuestions: answered,
      totalQuestions,
      status: present ? "PRESENT" : "ABSENT",
    };
  });
}

function buildCommandLog(session) {
  return (session.events || [])
    .filter((e) => String(e.type).startsWith("command:"))
    .map((e) => {
      const actor = (session.students || []).find((s) => s.id === e.actorId);
      const target = e.targetId ? (session.students || []).find((s) => s.id === e.targetId) : null;
      const question = e.questionId ? (session.questions || []).find((q) => q.id === e.questionId) : null;
      const questionIndex = question ? (session.questions || []).indexOf(question) + 1 : null;

      return {
        id: e.id,
        command: String(e.type).replace("command:", ""),
        actorName: actor?.name || e.actorName || "—",
        targetName: target?.name || e.targetName || null,
        value: e.value ?? null,
        questionIndex,
        questionText: question?.text || null,
        createdAt: e.createdAt,
        metadata: e.metadata || null,
      };
    });
}

function appendSheet(wb, name, rows) {
  const data = rows && rows.length > 0 ? rows : [{ "—": "لا يوجد بيانات" }];
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!dir"] = "rtl";
  XLSX.utils.book_append_sheet(wb, ws, name);
}

function buildWorkbook(session) {
  const wb = XLSX.utils.book_new();
  const students = buildStudents(session);
  const questions = buildQuestions(session);
  const attendance = buildAttendance(session);
  const commandLog = buildCommandLog(session);
  const summary = buildSummary(session);

  appendSheet(wb, "Attendance", attendance.map((r) => ({
    "الاسم": r.name,
    "الحالة": r.status === "PRESENT" ? "حاضر" : "غايب",
    "عدد الأسئلة المُجابة": r.answeredQuestions,
    "إجمالي الأسئلة": r.totalQuestions,
    "مدة الحضور (ث)": r.durationSeconds,
  })));

  appendSheet(wb, "Results", students.map((s) => ({
    "الاسم": s.name,
    "النقاط": s.score,
    "الترتيب": s.rank,
    "صح": s.correctAnswers,
    "غلط": s.wrongAnswers,
    "أعلى ستريك": s.highestStreak,
    "متوسط زمن الإجابة (ث)": Math.round(s.avgResponseMs / 100) / 10,
  })));

  const answerDetails = [];
  for (const st of session.students || []) {
    for (const q of session.questions || []) {
      const a = session.answers?.[st.id]?.[q.id];
      answerDetails.push({
        "الطالب": st.name,
        "السؤال": q.text,
        "الإجابة المختارة": a?.selectedOption != null ? q.options[a.selectedOption] : a ? "انتهى الوقت" : "لم يشاهد",
        "الإجابة الصحيحة": q.options?.[q.correctOptionIndex] || "",
        "صحيح؟": a?.isCorrect ? "نعم" : "لا",
        "النقاط": a?.points ?? 0,
        "زمن الإجابة (ث)": a?.responseMs ? Math.round(a.responseMs / 100) / 10 : "",
      });
    }
  }
  appendSheet(wb, "Answer Details", answerDetails);

  appendSheet(wb, "Question Analysis", questions.map((q) => {
    const rawQ = session.questions?.[q.questionIndex - 1];
    return {
      "رقم السؤال": q.questionIndex,
      "السؤال": q.text,
      "النوع": q.type === "true_false" ? "صح/غلط" : "اختيار من متعدد",
      "الإجابة الصحيحة": rawQ?.options?.[q.correctOptionIndex] || "",
      "نسبة الإجابات الصحيحة %": q.correctPercentage,
      "عدد الإجابات": q.answeredCount,
      "عدد الصح": q.correctCount,
      "تم تخطيه": q.skippedCount,
      "انتهى وقته": q.timedOutCount,
      "أكثر غلطة": q.mostCommonWrong?.optionText || "—",
    };
  }));

  appendSheet(wb, "Commands", commandLog.map((c) => ({
    "الأمر": c.command,
    "بواسطة": c.actorName,
    "الهدف": c.targetName || "—",
    "القيمة": c.value ?? "—",
    "السؤال": c.questionIndex ?? "—",
    "الوقت": new Date(c.createdAt).toLocaleString("ar-EG"),
  })));

  const summaryRows = [
    { "البند": "عدد المشاركين", "القيمة": summary.totalParticipants },
    { "البند": "عدد الأسئلة", "القيمة": summary.totalQuestions },
    { "البند": "مدة الجلسة (ث)", "القيمة": summary.durationSeconds },
    { "البند": "متوسط النقاط", "القيمة": summary.averageScore },
    { "البند": "نسبة الإجابات الصحيحة %", "القيمة": summary.correctPercentage },
  ];
  if (summary.hardestQuestion) {
    summaryRows.push({ "البند": "أصعب سؤال", "القيمة": `${summary.hardestQuestion.text} (${summary.hardestQuestion.correctPercentage}%)` });
  }
  summary.topPlayers.forEach((p, i) => {
    summaryRows.push({ "البند": `المركز ${i + 1}`, "القيمة": `${p.name} — ${p.score} نقطة` });
  });
  appendSheet(wb, "Summary", summaryRows);

  return wb;
}

export const reportMock = {
  async getSummary(sessionId) {
    await delay();
    const user = requireOrg();
    const session = ownSessionOrThrow(sessionId, user);
    assertFinished(session);
    return { data: buildSummary(session) };
  },

  async getQuestions(sessionId) {
    await delay();
    const user = requireOrg();
    const session = ownSessionOrThrow(sessionId, user);
    assertFinished(session);
    return { data: buildQuestions(session) };
  },

  async getStudents(sessionId) {
    await delay();
    const user = requireOrg();
    const session = ownSessionOrThrow(sessionId, user);
    assertFinished(session);
    return { data: buildStudents(session) };
  },

  async getAttendance(sessionId) {
    await delay();
    const user = requireOrg();
    const session = ownSessionOrThrow(sessionId, user);
    assertFinished(session);
    return { data: buildAttendance(session) };
  },

  async getCommandLog(sessionId) {
    await delay();
    const user = requireOrg();
    const session = ownSessionOrThrow(sessionId, user);
    assertFinished(session);
    return { data: buildCommandLog(session) };
  },

  async exportXlsx(sessionId) {
    await delay(300);
    const user = requireOrg();
    const session = ownSessionOrThrow(sessionId, user);
    assertFinished(session);

    const wb = buildWorkbook(session);
    const arrayBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    const date = new Date(session.finishedAt || Date.now()).toISOString().slice(0, 10);
    const filename = `yalla-report-${session.code}-${date}.xlsx`;

    return { data: { buffer: arrayBuffer, filename } };
  },
};