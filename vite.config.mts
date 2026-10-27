import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // 相対パスで出力して、GitHub Pages のサブフォルダでも Electron（file://）でも読めるようにする
  base: "./",
});
