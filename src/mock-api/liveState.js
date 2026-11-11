// src/mock-api/liveState.js

export function recomputeStudentStats(student, answers, questions) {
  const seen = student?.seenQuestions || {};
  const map = answers || {};

  let score = 0;
  let correct = 0;
  let wrong = 0;
  let streak = 0;
  let highest = 0;
  let answered = 0;
  let missedCount = 0;
  let timedOutCount = 0;

  for (const q of questions) {
    const a = map[q.id];
    if (a) {
      answered++;
      if (a.isCorrect) {
        score += a.points || 0;
        correct++;
        streak++;
        if (streak > highest) highest = streak;
      } else {
        wrong++;
        streak = 0;
      }
    } else if (seen[q.id]) {
      timedOutCount++;
    } else {
      missedCount++;
    }
  }

  const finishedAt =
    questions.length && answered >= questions.length
      ? (student.finishedAt ?? Date.now())
      : (student.finishedAt ?? null);

  const isFinished =
    Boolean(student.finishedAt) ||
    (questions.length > 0 && missedCount === 0);

  return {
    ...student,
    score,
    correctAnswers: correct,
    wrongAnswers: wrong,
    highestStreak: highest,
    currentStreak: streak,
    interacted: answered > 0,
    finishedAt,
    answeredCount: answered,
    missedCount,
    timedOutCount,
    isFinished,
  };
}

export function enrichSession(session, questions) {
  if (!session) return session;
  const answers = session.answers || {};

  const students = (session.students || []).map((st) =>
    recomputeStudentStats(st, answers[st.id], questions)
  );

  const pendingStudentsCount = students.filter((st) => !st.isFinished).length;

  return {
    ...session,
    students,
    pendingStudentsCount,
    finishedStudentsCount: students.length - pendingStudentsCount,
    reopenedStudentsCount: session.reopenedFor?.studentIds?.length ?? 0,
  };
}