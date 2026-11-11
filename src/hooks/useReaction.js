// hooks/useReaction.js
import { useCallback, useState } from "react";

export function useReaction() {
  const [reaction, setReaction] = useState(null);
  const triggerReaction = useCallback((key) => {
    if (!key) return;
    setReaction({ key, id: Date.now() });
  }, []);
  const clearReaction = useCallback(() => setReaction(null), []);
  return { reaction, triggerReaction, clearReaction };
}