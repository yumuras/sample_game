import { BgmButton } from "./BgmButton";
import { Button } from "./Button";
import { Screen } from "./Screen";

interface Props {
  active: boolean;
  canContinue: boolean;
  onNew: () => void;
  onContinue: () => void;
  onEndings: () => void;
}

export function TitleScreen({ active, canContinue, onNew, onContinue, onEndings }: Props) {
  const menuButton = "p-3 text-base tracking-[0.2em]";
  return (
    <Screen active={active}>
      {/* 流れていく鳥居と、まわりを暗くするぼかし */}
      <div className="absolute inset-0 animate-drift bg-[repeating-linear-gradient(90deg,rgba(210,58,31,0.9)_0_7%,rgba(20,8,6,0.95)_7%_14%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#000_80%)]" />
      <div className="relative flex h-full flex-col items-center justify-center p-4 text-center">
        <p className="mb-3 text-sm tracking-[0.4em] opacity-80">短編ループノベル</p>
        <h1 className="mb-10 text-[clamp(36px,8vw,64px)] leading-tight font-bold tracking-[0.15em] [text-shadow:0_0_24px_rgba(210,58,31,0.8)]">
          千本鳥居の
          <br />
          向こう側
        </h1>
        <nav className="flex w-[min(260px,100%)] flex-col gap-3">
          <Button className={menuButton} onClick={onNew}>
            はじめから
          </Button>
          <Button className={menuButton} onClick={onContinue} disabled={!canContinue}>
            つづきから
          </Button>
          <Button className={menuButton} onClick={onEndings}>
            エンディング一覧
          </Button>
        </nav>
        <p className="mt-7 text-xs opacity-60">約15分 ／ タップかクリック、スペースキーで進みます</p>
        <BgmButton className="mt-3" />
      </div>
    </Screen>
  );
}
