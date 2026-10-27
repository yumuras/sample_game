import { scenario } from "../game/scenario";
import { storage } from "../game/storage";

const { endings } = scenario;

export function EndingScreen({ active, id, onBack }: { active: boolean; id: string | null; onBack: () => void }) {
  const e = id ? endings[id] : null;
  return (
    <section id="ending-screen" className={`screen${active ? " active" : ""}`}>
      <div className="ending-inner">
        <p className="ending-label">ENDING</p>
        <h2 id="ending-title">{e?.title ?? "エンディング"}</h2>
        <p id="ending-hint">{e?.hint ? `ヒント：${e.hint}` : "最後まで遊んでくれて、ありがとうございました。"}</p>
        <button type="button" onClick={onBack}>
          タイトルへ
        </button>
      </div>
    </section>
  );
}

export function EndingsListScreen({ active, onBack }: { active: boolean; onBack: () => void }) {
  const seen = active ? storage.seenEndings() : [];
  return (
    <section id="endings-screen" className={`screen${active ? " active" : ""}`}>
      <div className="ending-inner">
        <h2>エンディング一覧</h2>
        <ul id="endings-list">
          {Object.entries(endings).map(([id, e]) => (
            <li key={id} className={seen.includes(id) ? "" : "locked"}>
              {seen.includes(id) ? e.title : "？？？"}
            </li>
          ))}
        </ul>
        <button type="button" onClick={onBack}>
          もどる
        </button>
      </div>
    </section>
  );
}
