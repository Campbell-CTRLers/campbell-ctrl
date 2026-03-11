import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/gsap')) return 'gsap';
          if (id.includes('node_modules/firebase')) return 'firebase';
          if (id.includes('node_modules/lucide-react')) return 'lucide';
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    }
  }
})
