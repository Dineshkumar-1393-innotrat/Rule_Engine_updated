import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/traxo': {
        target: 'https://cvipiot-preprod.fca-india.com:40543',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
        rewrite: (path) => path.replace(/^\/api\/traxo/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
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
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
          });
        }
      },
      '/api/platform': {
        target: 'https://lb2.cvip-preprod.citroen.in:40543',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
        rewrite: (path) => path.replace(/^\/api\/platform/, ''),
      },
      '/api/fota-fca': {
        target: 'https://cvipiot-preprod.fca-india.com:40543',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
        rewrite: (path) => path.replace(/^\/api\/fota-fca/, ''),
      },
      '/api/fota-lb1-fca': {
        target: 'https://cvipiot-preprod.fca-india.com:40543',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
        rewrite: (path) => path.replace(/^\/api\/fota-lb1-fca/, ''),
      },
      '/api/aws': {
        target: 'https://gp98o9kt3c.execute-api.ap-south-1.amazonaws.com',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
        rewrite: (path) => path.replace(/^\/api\/aws/, ''),
      }
    }
  },
  build: {
    rollupOptions: {
      input: '/index.html'  // point to the actual root-level index.html
    }
  }
})