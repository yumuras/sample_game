import { useState } from "react";
import { BGM } from "../game/bgm";
import { Button } from "./Button";

export function BgmButton({ className = "" }: { className?: string }) {
  const [enabled, setEnabled] = useState(BGM.isEnabled());
  return (
    <Button
      className={`px-3.5 py-1.25 text-xs ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        setEnabled(BGM.toggle());
      }}
    >
      {enabled ? "♪ BGM ON" : "♪ BGM OFF"}
    </Button>
  );
}
