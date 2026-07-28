import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const BASE = process.env.VITE_BASE_PATH ?? '/'
const STRAT_DATA_DIR = path.resolve(__dirname, '../strat-data')

export default defineConfig({
  plugins: [
    react(),
    {
      // In dev, serve ../strat-data at /strat-data/ so hooks can fetch
      // local JSON without pushing to GitHub first.
      name: 'serve-strat-data',
      configureServer(server) {
        server.middlewares.use('/strat-data', (req, res, next) => {
          const filePath = path.join(STRAT_DATA_DIR, req.url ?? '')
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'application/json')
            res.end(fs.readFileSync(filePath))
          } else {
            next()
          }
        })
      },
    },
  ],
  base: BASE,
})
