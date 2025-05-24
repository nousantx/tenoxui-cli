import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  build: {
    target: 'es2017',
    lib: {
      entry: './src/index.js',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: [
        'commander',
        'chokidar',
        'chalk',
        'glob',
        'path',
        'fs',
        'url',
        'tenoxui',
        'nguraijs'
      ],
      output: {
        exports: 'named'
      }
    }
  }
})
