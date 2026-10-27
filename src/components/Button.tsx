import type { ButtonHTMLAttributes } from "react";

// ゲーム内で共通の見た目のボタン。大きさなどは className で足す
export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`cursor-pointer rounded border border-panel-line bg-panel font-serif text-ink enabled:hover:border-vermilion disabled:cursor-default disabled:opacity-35 ${className}`}
      {...props}
    />
  );
}
