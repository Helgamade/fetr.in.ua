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
      output: {
        manualChunks: (id) => {
          // Admin-only heavy deps: TinyMCE, Tiptap, Recharts
          if (
            id.includes('tinymce') ||
            id.includes('@tinymce') ||
            id.includes('@tiptap')
          ) {
            return 'chunk-editor';
          }
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'chunk-charts';
          }
          // Lottie
          if (id.includes('lottie') || id.includes('@lottiefiles')) {
            return 'chunk-lottie';
          }
          // Framer Motion
          if (id.includes('framer-motion')) {
            return 'chunk-motion';
          }
          // Radix UI
          if (id.includes('@radix-ui')) {
            return 'chunk-radix';
          }
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'chunk-react';
          }
          // React Router
          if (id.includes('react-router')) {
            return 'chunk-router';
          }
          // React Query
          if (id.includes('@tanstack')) {
            return 'chunk-query';
          }
          // Forms
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
            return 'chunk-forms';
          }
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'chunk-vendor';
          }
        },
      },
    },
  },
}));
