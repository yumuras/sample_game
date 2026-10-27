// ノベルゲームの進行エンジン
// シナリオの命令を順に実行し、画面に出す内容（View）を React に渡す。
import { BGM } from "./bgm";
import { scenario } from "./scenario";
import { storage } from "./storage";
import type { Choice, LogEntry, SaveData } from "./types";

const TEXT_SPEED_MS = 28;
const { scenes, start } = scenario;

export interface View {
  save: SaveData;
  name: string;
  /** 表示中の文章（文字送りの途中なら途中まで） */
  text: string;
  /** 文章を最後まで出して、クリックを待っている */
  waiting: boolean;
  choices: Choice[] | null;
  effect: { kind: string; key: number } | null;
  textboxHidden: boolean;
  log: LogEntry[];
}

function newSave(): SaveData {
  return { scene: start, index: 0, flags: {}, torii: 3, time: "", bg: "black", chars: {}, bgm: null };
}

export class GameRunner {
  private view: View;
  private listeners = new Set<() => void>();
  private token: object | null = null;
  private typing: { finish: () => void; timer: number } | null = null;
  private onClick: (() => void) | null = null;
  private onChoose: ((opt: Choice) => void) | null = null;

  constructor(private readonly onEnding: (id: string) => void) {
    this.view = this.initialView(newSave());
  }

  // ───────── React から使う ─────────
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getView = () => this.view;

  start(saved: SaveData | null) {
    this.stop();
    const save = saved ?? newSave();
    this.view = this.initialView(save);
    BGM.unlock();
    BGM.play(save.bgm);
    this.emit();
    this.run();
  }

  stop() {
    this.token = null;
    if (this.typing) {
      clearInterval(this.typing.timer);
      this.typing = null;
    }
    this.onClick = null;
    this.onChoose = null;
  }

  /** クリックやキー操作で文章を進める */
  advance() {
    if (this.typing) this.typing.finish();
    else this.onClick?.();
  }

  choose(opt: Choice) {
    this.onChoose?.(opt);
  }

  // ───────── 内部 ─────────
  private initialView(save: SaveData): View {
    return {
      save,
      name: "",
      text: "",
      waiting: false,
      choices: null,
      effect: null,
      textboxHidden: false,
      log: [],
    };
  }

  private update(patch: Partial<View>) {
    this.view = { ...this.view, ...patch };
    this.emit();
  }

  private updateSave(patch: Partial<SaveData>) {
    this.update({ save: { ...this.view.save, ...patch } });
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  private typeText(name: string, text: string) {
    this.update({ name, text: "", waiting: false, log: [...this.view.log, { name, text }] });
    return new Promise<void>((resolve) => {
      let i = 0;
      const finish = () => {
        if (this.typing) clearInterval(this.typing.timer);
        this.typing = null;
        this.update({ text, waiting: true });
        this.onClick = () => {
          this.onClick = null;
          resolve();
        };
      };
      this.typing = {
        finish,
        timer: window.setInterval(() => {
          i += 1;
          this.update({ text: text.slice(0, i) });
          if (i >= text.length) finish();
        }, TEXT_SPEED_MS),
      };
    });
  }

  private showChoices(options: Choice[]) {
    this.update({ choices: options, textboxHidden: true });
    return new Promise<Choice>((resolve) => {
      this.onChoose = (opt) => {
        this.onChoose = null;
        this.update({
          choices: null,
          textboxHidden: false,
          log: [...this.view.log, { name: "", text: `▶ ${opt.text}` }],
        });
        resolve(opt);
      };
    });
  }

  private playEffect(kind: string) {
    this.update({ effect: { kind, key: Date.now() }, textboxHidden: true });
    const ms = kind === "torii" ? 2600 : 700;
    return new Promise<void>((r) =>
      setTimeout(() => {
        this.update({ effect: null, textboxHidden: false });
        r();
      }, ms),
    );
  }

  private jump(scene: string) {
    if (!scenes[scene]) throw new Error(`シーン「${scene}」がありません`);
    this.updateSave({ scene, index: 0 });
  }

  private async run() {
    const token = {};
    this.token = token;
    while (token === this.token) {
      const save = this.view.save;
      const step = scenes[save.scene][save.index];
      if (!step) throw new Error(`シーン「${save.scene}」が goto か ending で終わっていません`);
      storage.set(storage.SAVE_KEY, save);

      const next: SaveData = { ...save, chars: { ...save.chars }, flags: { ...save.flags } };
      if (step.bg) next.bg = step.bg;
      if (step.bgm !== undefined) {
        next.bgm = step.bgm;
        BGM.play(next.bgm);
      }
      if (step.time !== undefined) next.time = step.time;
      if (step.show) Object.assign(next.chars, step.show);
      if (step.hide) {
        if (step.hide === "all") next.chars = {};
        else delete next.chars[step.hide];
      }
      if (step.set) Object.assign(next.flags, step.set);
      this.updateSave(next);
      if (step.effect) {
        await this.playEffect(step.effect);
        if (token !== this.token) return;
      }
      if (step.torii !== undefined) this.updateSave({ torii: step.torii });

      if (step.text) {
        await this.typeText(step.name ?? "", step.text);
        if (token !== this.token) return;
      }

      if (step.choice) {
        const flags = this.view.save.flags;
        const opt = await this.showChoices(step.choice.filter((o) => !o.if || flags[o.if]));
        if (token !== this.token) return;
        if (opt.set) this.updateSave({ flags: { ...this.view.save.flags, ...opt.set } });
        this.jump(opt.goto);
        continue;
      }
      if (step.goto) {
        this.jump(step.goto);
        continue;
      }
      if (step.ending) {
        this.token = null;
        storage.markEnding(step.ending);
        storage.set(storage.SAVE_KEY, null);
        this.onEnding(step.ending);
        return;
      }

      this.updateSave({ index: this.view.save.index + 1 });
    }
  }
}
