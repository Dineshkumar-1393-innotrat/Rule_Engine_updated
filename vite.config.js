// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: '/index.html'  // point to the actual root-level index.html
    }
  }
})