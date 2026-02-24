import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Отключаем modulepreload — Vite иначе добавляет <link rel="modulepreload">
    // для chunk-lottie и chunk-charts прямо в index.html, и браузер скачивает их
    // на главной странице даже если они нужны только на /thank-you и /admin
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Только React/ReactDOM выделяем явно — остальное Rollup распределяет сам.
          // lottie, recharts, tiptap — всё уходит в lazy-чанки страниц где используется.
          // Принудительный manualChunks для них вызывал статические импорты в index.js.
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-is/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
        },
      },
    },
  },
}));
