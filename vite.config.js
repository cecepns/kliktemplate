import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = 'https://api-inventory.isavralabel.com/kliktemplate'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/uploads-web-template': { target: API_TARGET, changeOrigin: true },
    },
  },
})
