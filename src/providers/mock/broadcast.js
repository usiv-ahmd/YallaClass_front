// src/providers/mock/broadcast.js
const ch = new BroadcastChannel("yalla-class-mock");

export const broadcast = {
  emit: (event, payload) => ch.postMessage({ event, payload, ts: Date.now() }),
  on: (event, handler) => {
    const listener = (msg) => {
      if (msg.event === event) handler(msg.payload);
    };
    ch.addEventListener("message", listener);
    return () => ch.removeEventListener("message", listener);
  },
};