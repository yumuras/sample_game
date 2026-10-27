// シナリオとセーブデータの型

export type Position = "left" | "center" | "right";
export type Flags = Record<string, boolean>;

export interface Choice {
  text: string;
  goto: string;
  /** 選んだときに立てるフラグ */
  set?: Flags;
  /** このフラグが立っているときだけ出す */
  if?: string;
}

/** シナリオの命令。一つの命令に複数の項目を書ける（README.md を参照） */
export interface Step {
  bg?: string;
  bgm?: string | null;
  time?: string;
  show?: Record<string, Position>;
  hide?: string;
  set?: Flags;
  effect?: "flash" | "torii";
  torii?: number;
  name?: string;
  text?: string;
  choice?: Choice[];
  goto?: string;
  ending?: string;
}

export interface Ending {
  title: string;
  hint: string;
}

export interface Scenario {
  start: string;
  scenes: Record<string, Step[]>;
  endings: Record<string, Ending>;
}

/** 「つづきから」で再開するために保存する進行状況 */
export interface SaveData {
  scene: string;
  index: number;
  flags: Flags;
  torii: number;
  time: string;
  bg: string;
  chars: Record<string, Position>;
  bgm: string | null;
}

export interface LogEntry {
  name: string;
  text: string;
}
