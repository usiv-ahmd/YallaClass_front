// src/providers/mock/broadcast.js
//
// BroadcastChannel does not deliver a message back to the channel object that
// posted it, so same-tab subscribers are notified through a local listener map
// in addition to the cross-tab channel.
const ch = new BroadcastChannel("yalla-class-mock");
const localListeners = new Map();

export const broadcast = {
  emit: (event, payload) => {
    const message = { event, payload, ts: Date.now() };

    for (const handler of localListeners.get(event) || []) {
      handler(payload);
    }

    ch.postMessage(message);
  },
  on: (event, handler) => {
    const listeners = localListeners.get(event) || new Set();
    listeners.add(handler);
    localListeners.set(event, listeners);

    const listener = (msg) => {
      if (msg.event === event) handler(msg.payload);
    };
    ch.addEventListener("message", listener);

    return () => {
      listeners.delete(handler);

      if (listeners.size === 0) {
        localListeners.delete(event);
      }

      ch.removeEventListener("message", listener);
    };
  },
};