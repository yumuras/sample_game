import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { assets } from "../game/assets";
import type { GameRunner } from "../game/runner";
import type { Position } from "../game/types";
import { BgmButton } from "./BgmButton";
import { Button } from "./Button";
import { Screen } from "./Screen";

const { backgrounds, characters } = assets;

const CHARA_POSITION: Record<Position, string> = {
  left: "left-[4%]",
  center: "left-[33%] max-[600px]:left-[28%]",
  right: "right-[4%]",
};

const EFFECT: Record<string, string> = {
  flash: "animate-flash",
  torii: "animate-torii bg-[repeating-linear-gradient(90deg,var(--color-vermilion)_0_8%,#000_8%_16%)]",
};

// 立ち絵の画像がないあいだに出す仮のシルエット
function silhouette(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400">
    <circle cx="100" cy="80" r="46" fill="${color}"/>
    <path d="M100 130c-55 0-82 38-88 95l-12 175h200l-12-175c-6-57-33-95-88-95z" fill="${color}"/>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

interface Props {
  active: boolean;
  runner: GameRunner;
  onTitle: () => void;
}

export function PlayScreen({ active, runner, onTitle }: Props) {
  const view = useSyncExternalStore(runner.subscribe, runner.getView);
  const { save } = view;
  const [logOpen, setLogOpen] = useState(false);
  const logList = useRef<HTMLDivElement>(null);

  const advance = () => {
    if (!logOpen) runner.advance();
  };

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!logOpen) runner.advance();
      }
      if (e.key === "Escape") setLogOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, logOpen, runner]);

  useLayoutEffect(() => {
    if (logOpen && logList.current) logList.current.scrollTop = logList.current.scrollHeight;
  }, [logOpen]);

  const bg = backgrounds[save.bg] ?? backgrounds.black;
  const torii = "⛩".repeat(save.torii) + "・".repeat(Math.max(0, 3 - save.torii));

  const menuButton = "px-3.5 py-1.25 text-xs";

  return (
    <Screen active={active} onClick={advance}>
      {/* 背景 */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-[background-image] duration-600"
        style={{ backgroundImage: bg.image ? `url("${bg.image}")` : bg.placeholder }}
      />
      {!bg.image && bg.label && (
        <div className="absolute top-11 left-3 rounded-[3px] bg-black/40 px-2 py-0.5 text-[11px] opacity-55">
          {bg.label}
        </div>
      )}

      {/* 立ち絵 */}
      <div className="pointer-events-none absolute inset-0">
        {Object.entries(save.chars).map(([id, pos]) => {
          const c = characters[id];
          if (!c) return null;
          const style: CSSProperties = { backgroundImage: c.image ? `url("${c.image}")` : silhouette(c.color) };
          return (
            <div
              key={id}
              className={`absolute bottom-0 h-[82%] w-[34%] animate-fadein bg-contain bg-bottom bg-no-repeat opacity-92 max-[600px]:h-[70%] max-[600px]:w-[44%] ${CHARA_POSITION[pos]}`}
              style={style}
            >
              {!c.image && (
                <span className="absolute top-[30%] left-1/2 -translate-x-1/2 text-xs whitespace-nowrap opacity-70">
                  {c.name}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 時刻と、戻れる回数 */}
      <div className="absolute top-2.5 right-3 left-3 flex justify-between text-sm tracking-widest [text-shadow:0_1px_4px_#000]">
        <span>{save.time}</span>
        <span className="text-lg tracking-[0.2em] text-vermilion" title="戻れる回数">
          {torii}
        </span>
      </div>

      {/* 演出 */}
      <div
        key={view.effect?.key}
        className={`pointer-events-none absolute inset-0 ${EFFECT[view.effect?.kind ?? ""] ?? ""}`}
      />

      {/* 選択肢 */}
      <div className="pointer-events-none absolute inset-x-3 top-0 bottom-12 flex flex-col items-center justify-center gap-3.5">
        {view.choices?.map((opt) => (
          <Button
            key={opt.text}
            className="pointer-events-auto w-[min(480px,100%)] animate-fadein-fast px-4 py-3.5 text-base"
            onClick={(e) => {
              e.stopPropagation();
              runner.choose(opt);
            }}
          >
            {opt.text}
          </Button>
        ))}
      </div>

      {/* 文章 */}
      <div
        className="absolute right-3 bottom-12 left-3 min-h-33 rounded-md border border-panel-line bg-panel px-5 pt-5.5 pb-4.5 max-[600px]:min-h-30 max-[600px]:px-3.5 max-[600px]:pt-5 max-[600px]:pb-4"
        hidden={view.textboxHidden}
      >
        {view.name && (
          <div className="absolute -top-3.5 left-4 rounded-[3px] bg-vermilion px-3.5 py-0.75 text-sm tracking-widest">
            {view.name}
          </div>
        )}
        <p
          className={`text-[17px] leading-[1.9] whitespace-pre-wrap max-[600px]:text-[15px] max-[600px]:leading-[1.8] ${view.name ? "" : "opacity-92"}`}
        >
          {view.text}
        </p>
        {view.waiting && <span className="absolute right-4 bottom-2 animate-blink text-xs text-vermilion">▼</span>}
      </div>

      {/* メニュー */}
      <div className="absolute right-3 bottom-2.5 flex gap-2">
        <BgmButton />
        <Button
          className={menuButton}
          onClick={(e) => {
            e.stopPropagation();
            setLogOpen(true);
          }}
        >
          ログ
        </Button>
        <Button
          className={menuButton}
          onClick={(e) => {
            e.stopPropagation();
            onTitle();
          }}
        >
          タイトル
        </Button>
      </div>

      {/* ログ */}
      {logOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: ログ表示中のクリックで文章が進まないようにする
        // biome-ignore lint/a11y/noStaticElementInteractions: 同上
        <div className="absolute inset-0 bg-black/90 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex h-full flex-col gap-3">
            <div className="flex-1 overflow-y-auto text-sm leading-[1.8]" ref={logList}>
              {view.log.map((l, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: ログは後ろに足すだけで並び替えない
                <p key={i} className="mb-2">
                  {l.name && <span className="text-vermilion">{`${l.name}　`}</span>}
                  {l.text}
                </p>
              ))}
            </div>
            <Button className="self-center px-7 py-2" onClick={() => setLogOpen(false)}>
              とじる
            </Button>
          </div>
        </div>
      )}
    </Screen>
  );
}
