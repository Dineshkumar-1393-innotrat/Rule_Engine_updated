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
        timeout: 60000,
        proxyTimeout: 60000,
        rewrite: (path) => path.replace(/^\/api\/traxo/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('[Vite Proxy Error - TRAXO]:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[Vite Proxy Request - TRAXO]:', req.method, req.url, '->', options.target + proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[Vite Proxy Response - TRAXO]:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/api/jeep': {
        target: 'https://cvipapi-preprod.fca-india.com',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
        rewrite: (path) => path.replace(/^\/api\/jeep/, '/jeep'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('[Vite Proxy Error - JEEP]:', err);
          });
        }
      }
    }
  },
  build: {
    rollupOptions: {
      input: '/index.html'  // point to the actual root-level index.html
    }
  }
})