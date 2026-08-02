import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

try {
  const sourcePath = '/home/pirate13thebes/.gemini/antigravity-ide/brain/671973a4-3ba9-4903-a35e-eb249ac0bb2f/media__1785692324145.jpg';
  const targetLogoPath = path.resolve(__dirname, './public/logo.jpeg');
  const targetFaviconPath = path.resolve(__dirname, './public/favicon.jpeg');

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetLogoPath);
    fs.copyFileSync(sourcePath, targetFaviconPath);
  }
} catch (e) {}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['framer-motion', 'sonner'],
          charts: ['recharts'],
          web3: ['ethers'],
          leaflet: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
});
