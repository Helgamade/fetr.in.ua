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
          // React + ReactDOM — ПЕРВЫМ ДЕЛОМ явно отправляем в vendor-react.
          // Без этого Rollup может затащить react-dom внутрь chunk-charts/chunk-lottie
          // (если recharts или @lottiefiles бандлят React), и тогда index.js получает
          // статический импорт этих чанков — они грузятся на ВСЕХ страницах.
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-is/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          // Lottie (~1MB) — только на /thank-you, грузится лениво
          if (id.includes('lottie') || id.includes('@lottiefiles')) {
            return 'chunk-lottie';
          }
          // Recharts + d3 — НЕ форсируем вручную.
          // Dashboard lazy-loaded → recharts естественно попадёт в Dashboard chunk.
          // Ручной manualChunks для recharts вызывал статический импорт в index.js.
          // TinyMCE + Tiptap (~heavy) — только в /admin
          if (
            id.includes('tinymce') ||
            id.includes('@tinymce') ||
            id.includes('@tiptap')
          ) {
            return 'chunk-editor';
          }
        },
      },
    },
  },
}));
