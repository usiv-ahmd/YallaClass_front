// src/realtime/events.js
//
// Socket.IO contract verified from the backend game module. Server events are
// the source of truth for gameplay; the UI never invents state locally.

export const SOCKET_EVENTS = {
  // Server -> client
  GAME_STATE: "game:state",
  GAME_STARTED: "game:started",
  GAME_PAUSED: "game:paused",
  GAME_RESUMED: "game:resumed",
  GAME_FINISHED: "game:finished",
  GAME_REVEALED: "game:revealed",
  GAME_PHASE_ADVANCED: "game:phase-advanced",
  GAME_SKIPPED: "game:skipped",
  GAME_ERROR: "game:error",
  GAME_COMMAND_SETTINGS_UPDATED: "game:command-settings-updated",
  GAME_PHASE_SETTINGS_UPDATED: "game:phase-settings-updated",
  QUESTION_STARTED: "question:started",
  QUESTION_ENDED: "question:ended",
  ANSWER_REVEALED: "answer:revealed",
  ANSWER_REVEALED_DETAILS: "answer:revealed:details",
  EXPLANATION_SHOWN: "explanation:shown",
  ANSWER_SUBMITTED: "answer:submitted",
  ANSWER_RESULT: "answer:result",
  POINTS_UPDATED: "points:updated",
  POINTS_SHOWN: "points:shown",
  LEADERBOARD_UPDATED: "leaderboard:updated",
  PHONE_LEADERBOARD_UPDATED: "phone-leaderboard:updated",
  PLAYER_JOINED: "player:joined",
  PLAYER_LEFT: "player:left",
  PLAYER_RECONNECTED: "player:reconnected",
  PLAYER_KICKED: "player:kicked",
  SESSION_KICKED: "session:kicked",
  JOIN_LOCK_UPDATED: "session:join-lock-updated",
  COMMAND_QUEUED: "command:queued",
  COMMAND_STARTED: "command:started",
  COMMAND_TARGET_REQUIRED: "command:target-required",
  COMMAND_COMPLETED: "command:completed",
  COMMAND_CANCELLED: "command:cancelled",
  COMMAND_PAUSED: "command:paused",
  COMMAND_RESUMED: "command:resumed",
  COMMANDS_COMPLETED: "commands:completed",
  GIFT_RECEIVED: "gift:received",
  THIEF_RESULT: "thief:result",
  ROCKET_RESULT: "rocket:result",

  // Client -> server
  SYNC: "game:sync",
  ANSWER_SUBMIT: "answer:submit",
  START: "game:start",
  PAUSE: "game:pause",
  RESUME: "game:resume",
  FINISH: "game:finish",
  JOIN_LOCK: "game:join-lock",
  REVEAL: "game:reveal",
  NEXT: "game:next",
  SKIP: "game:skip",
  COMMAND_SETTINGS: "game:command-settings",
  PHASE_SETTINGS: "game:phase-settings",
  PARTICIPANT_KICK: "participant:kick",
  SELECT_TARGET: "command:select-target",
};

// Any of these can change the server game state, so the client requests a full
// `game:sync` instead of merging partial payloads by hand.
export const LIVE_SYNC_EVENTS = [
  SOCKET_EVENTS.GAME_STARTED,
  SOCKET_EVENTS.GAME_PAUSED,
  SOCKET_EVENTS.GAME_RESUMED,
  SOCKET_EVENTS.GAME_FINISHED,
  SOCKET_EVENTS.GAME_REVEALED,
  SOCKET_EVENTS.GAME_PHASE_ADVANCED,
  SOCKET_EVENTS.GAME_SKIPPED,
  SOCKET_EVENTS.GAME_COMMAND_SETTINGS_UPDATED,
  SOCKET_EVENTS.GAME_PHASE_SETTINGS_UPDATED,
  SOCKET_EVENTS.QUESTION_STARTED,
  SOCKET_EVENTS.QUESTION_ENDED,
  SOCKET_EVENTS.ANSWER_REVEALED,
  SOCKET_EVENTS.EXPLANATION_SHOWN,
  SOCKET_EVENTS.ANSWER_SUBMITTED,
  SOCKET_EVENTS.ANSWER_RESULT,
  SOCKET_EVENTS.POINTS_UPDATED,
  SOCKET_EVENTS.POINTS_SHOWN,
  SOCKET_EVENTS.LEADERBOARD_UPDATED,
  SOCKET_EVENTS.PHONE_LEADERBOARD_UPDATED,
  SOCKET_EVENTS.PLAYER_JOINED,
  SOCKET_EVENTS.PLAYER_LEFT,
  SOCKET_EVENTS.PLAYER_RECONNECTED,
  SOCKET_EVENTS.PLAYER_KICKED,
  SOCKET_EVENTS.JOIN_LOCK_UPDATED,
  SOCKET_EVENTS.COMMAND_QUEUED,
  SOCKET_EVENTS.COMMAND_STARTED,
  SOCKET_EVENTS.COMMAND_TARGET_REQUIRED,
  SOCKET_EVENTS.COMMAND_COMPLETED,
  SOCKET_EVENTS.COMMAND_CANCELLED,
  SOCKET_EVENTS.COMMAND_PAUSED,
  SOCKET_EVENTS.COMMAND_RESUMED,
  SOCKET_EVENTS.COMMANDS_COMPLETED,
  SOCKET_EVENTS.GIFT_RECEIVED,
  SOCKET_EVENTS.THIEF_RESULT,
  SOCKET_EVENTS.ROCKET_RESULT,
];

// Events that should refresh the state but are too noisy to trigger a sync per
// event (e.g. every answer during a live question). Hooks throttle these.
export const LIVE_HIGH_FREQUENCY_EVENTS = [
  SOCKET_EVENTS.ANSWER_SUBMITTED,
  SOCKET_EVENTS.ANSWER_RESULT,
  SOCKET_EVENTS.POINTS_UPDATED,
];

export const CONNECTION_STATUS = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
};
