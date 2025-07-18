import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://43.165.198.49:8089', // Ganti dengan URL API yang benar
        changeOrigin: true, // Memastikan origin diubah
        rewrite: (path) => path.replace(/^\/api/, ''), // Menghapus '/api' jika perlu
      },
    },
  },
})
