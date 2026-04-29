import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,  // Allow fallback to next port if 5173 is busy
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path, // Keep the /api prefix
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: ['es2020'],
    cssTarget: 'es2020', // Skip CSS minification issues
  },
})
