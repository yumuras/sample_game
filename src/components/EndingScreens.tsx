import { scenario } from "../game/scenario";
import { storage } from "../game/storage";
import { Button } from "./Button";
import { Screen } from "./Screen";

const { endings } = scenario;

const background = "bg-[radial-gradient(ellipse_at_center,#2a0f0a,#000_75%)]";
const inner = "flex h-full flex-col items-center justify-center gap-4 p-4 text-center";
const backButton = "mt-4 px-7 py-2.5 text-[15px]";

export function EndingScreen({ active, id, onBack }: { active: boolean; id: string | null; onBack: () => void }) {
  const e = id ? endings[id] : null;
  return (
    <Screen active={active} className={background}>
      <div className={inner}>
        <p className="tracking-[0.5em] opacity-60">ENDING</p>
        <h2 className="text-[clamp(20px,5vw,30px)] font-bold tracking-widest">{e?.title ?? "エンディング"}</h2>
        <p className="opacity-75">{e?.hint ? `ヒント：${e.hint}` : "最後まで遊んでくれて、ありがとうございました。"}</p>
        <Button className={backButton} onClick={onBack}>
          タイトルへ
        </Button>
      </div>
    </Screen>
  );
}

export function EndingsListScreen({ active, onBack }: { active: boolean; onBack: () => void }) {
  const seen = active ? storage.seenEndings() : [];
  return (
    <Screen active={active} className={background}>
      <div className={inner}>
        <h2 className="text-2xl font-bold">エンディング一覧</h2>
        <ul className="flex flex-col gap-2.5">
          {Object.entries(endings).map(([id, e]) => (
            <li
              key={id}
              className={`rounded border border-panel-line px-5 py-2.5 ${seen.includes(id) ? "" : "opacity-40"}`}
            >
              {seen.includes(id) ? e.title : "？？？"}
            </li>
          ))}
        </ul>
        <Button className={backButton} onClick={onBack}>
          もどる
        </Button>
      </div>
    </Screen>
  );
}
