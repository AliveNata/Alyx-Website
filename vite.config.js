import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: "all"
  },
  build: {
    rollupOptions: {
      output: {
        // Split the React runtime into its own chunk so the entry stays small
        // and the vendor libs cache across app deploys (PK-16).
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})