import { useState } from "react";
import { BGM } from "../game/bgm";

export function BgmButton({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(BGM.isEnabled());
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        setEnabled(BGM.toggle());
      }}
    >
      {enabled ? "♪ BGM ON" : "♪ BGM OFF"}
    </button>
  );
}
