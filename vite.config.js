import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
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
    assetsDir: 'assets',
    // assetsInlineLimit: 100000000, // Large enough to inline assets
    // cssCodeSplit: false, // Avoids splitting CSS into separate file
    // rollupOptions: {
	// 	output: {
	// 	  inlineDynamicImports: true, // Inline dynamic imports
	// 	},
	//   },
  }
});
