/**
 * GitHub Pages 専用 Vite ビルド設定
 *
 * 使い方:
 *   pnpm build:gh
 *
 * ビルド後、/docs フォルダが生成されます。
 * GitHub Pages の設定: Settings → Pages → Source: main branch / docs folder
 */

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // リポジトリ名に合わせた base パス
  base: "/beyond-beauty-simulator/",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    // GitHub Pages は /docs フォルダを参照する設定にする
    outDir: path.resolve(import.meta.dirname, "docs"),
    emptyOutDir: true,
  },
});
