import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/shared/ui'),
      '@/lib': path.resolve(__dirname, './src/shared/utils'),
      '@/hooks': path.resolve(__dirname, './src/shared/hooks'),
      '@/stores': path.resolve(__dirname, './src/shared/stores'),
      '@/api': path.resolve(__dirname, './src/shared/api'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
