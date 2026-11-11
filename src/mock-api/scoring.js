// src/mock-api/scoring.js
// كل الحسابات بتتم هنا — الفرونت مايحسبش أي حاجة

export function computeTimeLeftServer({ startedAt, duration, now = Date.now() }) {
  if (!startedAt) return Number(duration) || 30;
  const elapsed = Math.floor((now - startedAt) / 1000);
  return Math.max(0, (Number(duration) || 30) - elapsed);
}

export function computeSpeedBonus({ isCorrect, timeLeft }) {
  return isCorrect ? Math.max(0, Math.round((Number(timeLeft) || 0) * 5)) : 0;
}

export function computePoints({ isCorrect, speedBonus = 0 }) {
  return isCorrect ? 100 + Number(speedBonus || 0) : 0;
}

export function computeNextStreak({ isCorrect, previousStreak = 0 }) {
  return isCorrect ? Number(previousStreak || 0) + 1 : 0;
}

export function pickReaction({
  isCorrect,
  streak = 0,
  speedBonus = 0,
  timeLeft = 0,
  duration = 30,
}) {
  if (!isCorrect) {
    if (timeLeft <= 0) return "hurry";
    if (timeLeft < 3) return "hurry";
    if (timeLeft > duration * 0.6) return "close";
    return "wait";
  }
  if (streak >= 5) return "legend";
  if (streak === 4) return "aaash";
  if (streak === 3) return "fire";
  if (streak === 2) return "gamed";
  if (speedBonus >= 100) return "braaavo";
  if (speedBonus >= 40) return "bravo";
  return "aash";
}