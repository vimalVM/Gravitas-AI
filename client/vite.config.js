import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const clientRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': path.resolve(clientRoot, '../shared'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  server: {
    port: 5173,
    // Allow importing ../shared/gravitas.config.json during development.
    fs: { allow: [path.resolve(clientRoot, '..')] },
    // Lets you set VITE_API_BASE_URL=/api (handy when testing from a phone on your Wi-Fi).
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
  preview: {
    port: 4173,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
