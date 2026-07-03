import { defineConfig, loadEnv, type Connect, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import type { ServerResponse } from 'node:http'
import { fileURLToPath, URL } from 'node:url'
import { GET as commandSearchHandler } from './src/server/command-search-handler.ts'

function applyEnvToProcess(env: Record<string, string>) {
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function createCommandSearchMiddleware() {
  return async (
    req: Connect.IncomingMessage,
    res: ServerResponse,
    next: Connect.NextFunction,
  ) => {
    if (!req.url?.startsWith('/api/command-search')) {
      next()
      return
    }

    const host = req.headers.host ?? 'localhost:5173'
    const request = new Request(`http://${host}${req.url}`, {
      method: req.method ?? 'GET',
    })

    try {
      const response = await commandSearchHandler(request)

      res.statusCode = response.status
      response.headers.forEach((value, key) => {
        res.setHeader(key, value)
      })

      const body = await response.text()
      res.end(body)
    } catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(error instanceof Error ? error.message : 'Command search failed.')
    }
  }
}

function commandSearchDevPlugin() {
  return {
    name: 'command-search-dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(createCommandSearchMiddleware())
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  applyEnvToProcess(env)

  return {
    plugins: [react(), commandSearchDevPlugin()],
    resolve: {
      alias: {
        'cmdk-vectorized': fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
      },
    },
  }
})