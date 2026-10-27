import { app, BrowserWindow, Menu } from "electron";
import path from "node:path";

// ゲーム本体（index.html と css/ js/）はブラウザ版と同じファイルをそのまま読み込む
const ROOT = path.join(__dirname, "..");

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 640,
    minHeight: 360,
    backgroundColor: "#000000",
    title: "千本鳥居の向こう側",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // BGMをクリック前から鳴らせるようにする
      autoplayPolicy: "no-user-gesture-required",
    },
  });

  win.loadFile(path.join(ROOT, "index.html"));

  // F11 で全画面を切り替え
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });
}

// ゲームなのでメニューバーは出さない
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
