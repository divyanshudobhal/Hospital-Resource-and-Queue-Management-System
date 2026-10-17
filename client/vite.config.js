import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  cacheDir: resolve(tmpdir(), 'hospital-management-system-vite-cache'),
  server: {
    port: 5173,
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
