import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import ReactInspector from 'vite-plugin-react-inspector';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  plugins: [
    ...(command !== 'build' && mode !== 'production' && process.env.NODE_ENV !== 'production' ? [ReactInspector()] : []),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
}));
