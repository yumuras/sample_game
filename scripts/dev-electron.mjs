// pnpm dev:app で呼ばれる。Vite の開発サーバーを立ててから Electron を開く。
// コードを保存すると、アプリの画面がすぐ更新される。
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "vite";

const server = await createServer();
await server.listen();
const url = server.resolvedUrls.local[0];

const electron = createRequire(import.meta.url)("electron");
const app = spawn(electron, ["."], { stdio: "inherit", env: { ...process.env, VITE_DEV_SERVER_URL: url } });
app.on("close", async (code) => {
  await server.close();
  process.exit(code ?? 0);
});
