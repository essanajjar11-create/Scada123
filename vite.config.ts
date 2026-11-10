import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) {
              return 'three-vendor';
            }
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
              return 'charts-vendor';
            }
            if (id.includes('node_modules/pptxgenjs')) {
              return 'pptx-vendor';
            }
          },
        },
      },
    },
    server: {
      proxy: {
        '/ws': {
          target: 'ws://localhost:3000',
          ws: true,
        },
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
