import { cp } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import leaderHandler from './api/leader.js'
import leaderVerifyHandler from './api/leader-verify.js'
import configHandler from './api/config.js'

// These handlers run server-side only. Do not expose secrets to Vite clients.
function localLeaderApi() {
  const middleware = (server) => {
    const env = { ...loadEnv(server.config.mode, server.config.root, 'LEADER_'), ...loadEnv(server.config.mode, server.config.root, 'ACTIVITY_'), ...process.env }
    const run = (handler) => (req, res) => {
      void handler(req, res, { env }).catch(() => {
        if (!res.headersSent) res.statusCode = 500
        res.end()
      })
    }
    server.middlewares.use('/api/config', (req, res) => configHandler(req, res, { env }))
    server.middlewares.use('/api/leader-verify', run(leaderVerifyHandler))
    server.middlewares.use('/api/leader', run(leaderHandler))
  }
  return { name: 'local-leader-api', configureServer: middleware, configurePreviewServer: middleware }
}

export default defineConfig({
  plugins: [
    localLeaderApi(),
    {
      name: 'copy-cipher-assets',
      apply: 'build',
      async writeBundle(options) {
        const outputDirectory = options.dir ?? resolve(process.cwd(), 'dist')
        await cp(resolve(process.cwd(), 'images'), resolve(outputDirectory, 'images'), { recursive: true })
        await cp(resolve(process.cwd(), 'papers/sw.js'), resolve(outputDirectory, 'papers/sw.js'), { force: true })
        await cp(resolve(process.cwd(), 'js/peerjs.min.js'), resolve(outputDirectory, 'js/peerjs.min.js'), { force: true })
        await cp(resolve(process.cwd(), 'js/qrcode.min.js'), resolve(outputDirectory, 'js/qrcode.min.js'), { force: true })
        await cp(resolve(process.cwd(), 'js/jsQR.js'), resolve(outputDirectory, 'js/jsQR.js'), { force: true })
        await cp(resolve(process.cwd(), 'js/i18n.js'), resolve(outputDirectory, 'js/i18n.js'), { force: true })
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
        papers: resolve(process.cwd(), 'papers/index.html'),
      },
    },
  },
})
