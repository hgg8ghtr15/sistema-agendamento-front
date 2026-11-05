import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Toda requisição que começar com /api será redirecionada para o back-end
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})