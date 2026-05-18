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
        target: 'https://lb1.cvip-preprod.citroen.in:40543',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
        rewrite: (path) => path.replace(/^\/api\/fota-lb1-fca/, ''),
      },
      '/api/aws': {
        target: 'https://1jp9u7p9pl.execute-api.ap-south-1.amazonaws.com',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
        rewrite: (path) => path.replace(/^\/api\/aws/, ''),
      },
      '/api/device': {
        target: 'http://localhost:5173', // Dummy target
        bypass: (req, res) => {
          if (req.url === '/api/device/verify-certificate' && req.method === 'POST') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: "SUCCESS",
              message: "Certificate verified successfully",
              timestamp: new Date().toISOString(),
              checks: {
                caVerified: true,
                cnMatch: true,
                issuerValid: true,
                signatureValid: true,
                timestampValid: true
              }
            }));
            return false; // Don't proxy, return the mock response directly
          }
          if (req.url === '/api/device/download' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              const params = new URLSearchParams(body);
              const content = params.get('content') || '';
              const filename = params.get('filename') || 'file.txt';
              res.setHeader('Content-Type', 'application/octet-stream');
              res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
              res.end(content);
            });
            return false;
          }
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