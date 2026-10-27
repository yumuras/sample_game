import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { assets } from "../game/assets";
import type { GameRunner } from "../game/runner";
import { BgmButton } from "./BgmButton";

const { backgrounds, characters } = assets;

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

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: キー操作は document の keydown で受けている
    // biome-ignore lint/a11y/noStaticElementInteractions: 画面のどこをクリックしても文章を進める
    <section id="play-screen" className={`screen${active ? " active" : ""}`} onClick={advance}>
      <div id="bg" style={{ backgroundImage: bg.image ? `url("${bg.image}")` : bg.placeholder }} />
      <div id="bg-label">{bg.image ? "" : bg.label}</div>
      <div id="characters">
        {Object.entries(save.chars).map(([id, pos]) => {
          const c = characters[id];
          if (!c) return null;
          const style: CSSProperties = { backgroundImage: c.image ? `url("${c.image}")` : silhouette(c.color) };
          return (
            <div key={id} className={`chara pos-${pos}`} style={style} data-label={c.image ? undefined : c.name} />
          );
        })}
      </div>
      <div id="hud">
        <span id="hud-time">{save.time}</span>
        <span id="hud-torii" title="戻れる回数">
          {torii}
        </span>
      </div>
      <div id="effect" key={view.effect?.key} className={view.effect ? `fx-${view.effect.kind}` : ""} />
      <div id="choices">
        {view.choices?.map((opt) => (
          <button
            type="button"
            key={opt.text}
            onClick={(e) => {
              e.stopPropagation();
              runner.choose(opt);
            }}
          >
            {opt.text}
          </button>
        ))}
      </div>
      <div id="textbox" className={view.name ? "" : "narration"} hidden={view.textboxHidden}>
        <div id="namebox" hidden={!view.name}>
          {view.name}
        </div>
        <p id="text">{view.text}</p>
        <span id="next-mark" hidden={!view.waiting}>
          ▼
        </span>
      </div>
      <div id="menu-bar">
        <BgmButton className="btn-bgm" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLogOpen(true);
          }}
        >
          ログ
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTitle();
          }}
        >
          タイトル
        </button>
      </div>
      {logOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: ログ表示中のクリックで文章が進まないようにする
        // biome-ignore lint/a11y/noStaticElementInteractions: 同上
        <div id="log-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="log-inner">
            <div id="log-list" ref={logList}>
              {view.log.map((l, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: ログは後ろに足すだけで並び替えない
                <p key={i}>
                  {l.name && <b>{`${l.name}　`}</b>}
                  {l.text}
                </p>
              ))}
            </div>
            <button type="button" onClick={() => setLogOpen(false)}>
              とじる
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
