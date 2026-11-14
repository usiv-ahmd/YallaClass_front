// src/components/Reaction.jsx
import { useEffect, useRef, useState } from "react";
import { BIG_HOLD_MS, LEAVE_MS, SMALL_HOLD_MS, YC_REACTIONS } from "../assets/reactions.js";
import "../styles/reactions.css";

export function Reaction({ onDone, reactionKey, triggerId }) {
  const [activeKey, setActiveKey] = useState(null);
  const [phase, setPhase] = useState("enter");
  const onDoneRef = useRef(onDone);

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    if (!reactionKey) {
      setActiveKey(null);
      return;
    }

    const reaction = YC_REACTIONS[reactionKey];
    if (!reaction) return;

    const holdMs = reaction.big ? BIG_HOLD_MS : SMALL_HOLD_MS;

    setActiveKey(reactionKey);
    setPhase("enter");

    const holdTimer = setTimeout(() => setPhase("leave"), holdMs);
    const doneTimer = setTimeout(() => {
      setActiveKey(null);
      onDoneRef.current?.();
    }, holdMs + LEAVE_MS);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [reactionKey, triggerId]);

  if (!activeKey || !YC_REACTIONS[activeKey]) return null;

  const reaction = YC_REACTIONS[activeKey];
  const isBig = reaction.big;

  return (
    <div className="student-reaction-container">
      <div className={`yc-reaction ${isBig ? "yc-wide" : ""} ${phase === "enter" ? "yc-enter" : "yc-leave"}`} dangerouslySetInnerHTML={{ __html: reaction.svg }} />
    </div>
  );
}