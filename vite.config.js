import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/traxo': {
        target: 'https://lb2.cvip-preprod.citroen.in:40543',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/traxo/, '')
      }
    }
  },
  build: {
    rollupOptions: {
      input: '/index.html'  // point to the actual root-level index.html
    }
  }
})