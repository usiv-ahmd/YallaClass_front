// src/mock-api/commands.js
const PLAYER_COMMANDS = [
  { id: "skip",        label: "تخطي",           description: "يعدّي السؤال بدون نقاط", defaultEnabled: true },
  { id: "hint",        label: "تلميح",          description: "تلميح بسيط",            defaultEnabled: true },
  { id: "fifty_fifty", label: "حذف إجابتين",    description: "٥٠:٥٠",                 defaultEnabled: false },
  { id: "extra_time",  label: "وقت إضافي",      description: "ثواني زيادة",            defaultEnabled: false, maxUses: 2 },
];

export async function getPlayerCommands() {
  return PLAYER_COMMANDS;
}