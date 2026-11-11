// src/hooks/usePlayerCommands.js
import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeCommandList } from "../utils/playerCommands.js";

export function usePlayerCommands({ loadCommands, enabled = true } = {}) {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const loaderRef = useRef(loadCommands);
  useEffect(() => { loaderRef.current = loadCommands; }, [loadCommands]);

  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const loader = loaderRef.current;
    if (typeof loader !== "function" || !enabled) return;

    const myId = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const payload = await loader();
      if (myId !== requestId.current) return;
      setCommands(normalizeCommandList(payload));
    } catch (e) {
      if (myId !== requestId.current) return;
      console.error("[usePlayerCommands]", e);
      setError(e);
    } finally {
      if (myId === requestId.current) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => { reload(); }, [reload]);

  return { commands, loading, error, reload };
}