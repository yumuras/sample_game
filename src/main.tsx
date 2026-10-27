import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BGM } from "./game/bgm";
import "./style.css";

// ブラウザは操作の前に音を出せないので、タップやキー操作でBGMを鳴らし始める。
// スマホでは pointerdown だけでは許可されないため、touchend と click でも呼ぶ。
for (const type of ["pointerdown", "touchend", "click", "keydown"]) {
  document.addEventListener(type, () => BGM.unlock(), { passive: true });
}
BGM.play("title");

const root = document.getElementById("root");
if (!root) throw new Error("#root がありません");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
