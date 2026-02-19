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
          // Lottie (~1MB) — только на /thank-you, грузится лениво
          if (id.includes('lottie') || id.includes('@lottiefiles')) {
            return 'chunk-lottie';
          }
          // Recharts + d3 (~300KB) — только в /admin
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'chunk-charts';
          }
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
