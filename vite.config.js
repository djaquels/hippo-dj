// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  root: path.resolve(__dirname, 'renderer'),
  plugins: [react()],
  publicDir: path.resolve(__dirname, 'renderer', 'public'),
  build: {
    // Put final build output where Electron expects it (projectRoot/dist)
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      // ensure index.html is used as the app entry (Vite uses root/index.html automatically)
      input: path.resolve(__dirname, 'renderer', 'index.html')
    }
  }
})