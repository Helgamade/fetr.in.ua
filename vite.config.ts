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
    rollupOptions: {
      // Читаем исходный шаблон из index.src.html, а не из index.html.
      // index.html в корне — всегда скомпилированная версия для Apache.
      // index.src.html — неизменяемый источник с /src/main.tsx.
      input: path.resolve(__dirname, "index.src.html"),
    },
  },
}));
