// src/constants/reactions.js

export const LIVE_STATE_REACTIONS = {
  countdown: "yalla",
  paused: "wait",
  finished: "hero",
};

export const REACTION_PRIORITY = {
  legend: 100,
  aaash: 95,
  braaavo: 90,
  fire: 70,
  gamed: 65,
  aash: 60,
  bravo: 55,
  hero: 50,
  surprise: 45,
  yalla: 40,
  focus: 35,
  wait: 30,
  go: 25,
  close: 20,
  hurry: 15,
};

export const URGENT_TIME_THRESHOLD = 5;
export const URGENT_REACTION = "hurry";

export function streakToReaction(streak = 0) {
  if (streak >= 7) return "legend";
  if (streak >= 5) return "aaash";
  if (streak >= 4) return "fire";
  if (streak >= 2) return "gamed";
  if (streak >= 1) return "aash";
  return "null";
}