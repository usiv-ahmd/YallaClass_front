// hooks/useNotificationCooldown.js
import { useCallback, useState } from "react";

export function useNotificationCooldown(cooldownMs = 2000) {
  const [cooldowns, setCooldowns] = useState({});

  const markCooldown = useCallback((studentId) => {
    setCooldowns((prev) => ({ ...prev, [studentId]: true }));
    setTimeout(() => {
      setCooldowns((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    }, cooldownMs);
  }, [cooldownMs]);

  const isCoolingDown = useCallback(
    (studentId) => Boolean(cooldowns[studentId]),
    [cooldowns]
  );

  return { markCooldown, isCoolingDown };
}