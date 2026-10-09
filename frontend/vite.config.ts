import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["vital-worcester-spas-undefined.trycloudflare.com"],
    proxy: {
      '/register': 'http://127.0.0.1:8000',
      '/login': 'http://127.0.0.1:8000',
      '/refresh': 'http://127.0.0.1:8000',
      '/logout': 'http://127.0.0.1:8000',
      '/document': 'http://127.0.0.1:8000',
      '/agent': 'http://127.0.0.1:8000',
    }
  }
})
