import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/tracy-utilities/', // Top-level base config for GitHub Pages
  plugins: [vue()],
  server: {
    port: 5000,
    host: true,
    hmr: true,
    strictPort: true,
    allowedHosts: true
  },
  build: {
    outDir: 'dist',
    assetsDir: '.',
  }
});
