import type { HTMLAttributes } from "react";

// 画面一枚分。active のときだけ表示する
export function Screen({ active, className = "", ...props }: { active: boolean } & HTMLAttributes<HTMLElement>) {
  return <section className={`absolute inset-0 ${active ? "block" : "hidden"} ${className}`} {...props} />;
}
