import { useState } from "react";
import { EndingScreen, EndingsListScreen } from "./components/EndingScreens";
import { PlayScreen } from "./components/PlayScreen";
import { TitleScreen } from "./components/TitleScreen";
import { BGM } from "./game/bgm";
import { GameRunner } from "./game/runner";
import { storage } from "./game/storage";
import type { SaveData } from "./game/types";

type Screen = "title" | "play" | "ending" | "endings";

export function App() {
  const [screen, setScreen] = useState<Screen>("title");
  const [endingId, setEndingId] = useState<string | null>(null);
  const [runner] = useState(
    () =>
      new GameRunner((id) => {
        setEndingId(id);
        setScreen("ending");
      }),
  );

  const toTitle = () => {
    runner.stop();
    BGM.play("title");
    setScreen("title");
  };
  const startGame = (saved: SaveData | null) => {
    runner.start(saved);
    setScreen("play");
  };

  return (
    <div id="game">
      <TitleScreen
        active={screen === "title"}
        canContinue={screen === "title" && !!storage.get(storage.SAVE_KEY)}
        onNew={() => startGame(null)}
        onContinue={() => startGame(storage.get<SaveData>(storage.SAVE_KEY))}
        onEndings={() => setScreen("endings")}
      />
      <PlayScreen active={screen === "play"} runner={runner} onTitle={toTitle} />
      <EndingScreen active={screen === "ending"} id={endingId} onBack={toTitle} />
      <EndingsListScreen active={screen === "endings"} onBack={() => setScreen("title")} />
    </div>
  );
}
