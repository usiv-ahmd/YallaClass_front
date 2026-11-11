// hooks/useTick.js
import { useCallback, useEffect, useState } from "react";

export function useTick(active, intervalMs = 500) {
  const [now, setNow] = useState(() => Date.now());
  const refresh = useCallback(() => setNow(Date.now()), []);

  useEffect(() => {
    if (!active) return;
    refresh();
    const i = setInterval(refresh, intervalMs);
    return () => clearInterval(i);
  }, [active, intervalMs, refresh]);

  return { now, refresh };
}