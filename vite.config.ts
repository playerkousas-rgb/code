import { cp } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'copy-cipher-assets',
      apply: 'build',
      async writeBundle(options) {
        const outputDirectory = options.dir ?? resolve(process.cwd(), 'dist')
        await cp(resolve(process.cwd(), 'images'), resolve(outputDirectory, 'images'), { recursive: true })
        for (const file of [
          'js/peerjs.min.js',
          'js/qrcode.min.js',
          'js/supabase.min.js',
          'js/cloud-config.js',
          'js/cloud.js',
        ]) {
          await cp(resolve(process.cwd(), file), resolve(outputDirectory, file), { force: true })
        }
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
        bank: resolve(process.cwd(), 'training/bank.html'),
      },
    },
  },
})
