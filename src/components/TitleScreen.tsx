import { BgmButton } from "./BgmButton";

interface Props {
  active: boolean;
  canContinue: boolean;
  onNew: () => void;
  onContinue: () => void;
  onEndings: () => void;
}

export function TitleScreen({ active, canContinue, onNew, onContinue, onEndings }: Props) {
  return (
    <section id="title-screen" className={`screen${active ? " active" : ""}`}>
      <div className="title-bg" />
      <div className="title-inner">
        <p className="title-sub">短編ループノベル</p>
        <h1 className="title-main">
          千本鳥居の
          <br />
          向こう側
        </h1>
        <nav className="title-menu">
          <button type="button" onClick={onNew}>
            はじめから
          </button>
          <button type="button" onClick={onContinue} disabled={!canContinue}>
            つづきから
          </button>
          <button type="button" onClick={onEndings}>
            エンディング一覧
          </button>
        </nav>
        <p className="title-note">約15分 ／ タップかクリック、スペースキーで進みます</p>
        <BgmButton className="btn-bgm title-bgm" />
      </div>
    </section>
  );
}
