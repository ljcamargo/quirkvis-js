import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    minify: 'esbuild',
  },
  esbuild: {
    keepNames: true,
  },
  resolve: {
    alias: {
      fs: path.resolve(__dirname, './src/stubs/fs.ts')
    }
  }
})
