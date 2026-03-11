import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // VITE_BASE is injected by preview CI jobs so that asset paths and the
  // router basename are anchored to the subdirectory where the build is
  // deployed (e.g. /pr-preview/5/ or /branch/my-branch/).
  // Production builds leave it unset, which defaults to the root '/'.
  base: process.env.VITE_BASE || '/',
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
