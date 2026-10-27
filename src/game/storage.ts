// ブラウザ（Electron でも同じ）への保存
const SAVE_KEY = "senbon-torii:save";
const ENDINGS_KEY = "senbon-torii:endings";

function get<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
}

function set(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 保存できなくても遊べる */
  }
}

function seenEndings(): string[] {
  return get<string[]>(ENDINGS_KEY) ?? [];
}

function markEnding(id: string) {
  const seen = seenEndings();
  if (!seen.includes(id)) set(ENDINGS_KEY, [...seen, id]);
}

export const storage = { SAVE_KEY, get, set, seenEndings, markEnding };
