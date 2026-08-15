import { cp } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'copy-cipher-images',
      apply: 'build',
      async writeBundle(options) {
        const outputDirectory = options.dir ?? resolve(process.cwd(), 'dist')
        await cp(resolve(process.cwd(), 'images'), resolve(outputDirectory, 'images'), { recursive: true })
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        training: resolve(process.cwd(), 'training/index.html'),
      },
    },
  },
})
