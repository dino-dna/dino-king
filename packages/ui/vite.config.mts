import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/bundle-analysis.html',
      open: !!process.env.BUNDLE_VISUALIZER,
    }) as any,
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:9999',
        ws: true,
        rewriteWsOrigin: true,
      }
    }
  }
})
