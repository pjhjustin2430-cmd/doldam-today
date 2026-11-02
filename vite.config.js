import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// npm run dev 에서도 /api/* 서버 함수가 동작하도록 하는 개발용 미들웨어
// (배포 후에는 Vercel 이 api/ 폴더를 그대로 서버 함수로 실행한다)
function devApi(env) {
  return {
    name: 'dev-api',
    configureServer(server) {
      Object.assign(process.env, env)
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        const m = url.pathname.match(/^\/api\/([\w-]+)$/)
        if (!m) return next()
        try {
          let body
          if (req.method === 'POST') {
            let raw = ''
            for await (const c of req) raw += c
            body = raw ? JSON.parse(raw) : {}
          }
          const mod = await server.ssrLoadModule(`/api/${m[1]}.js`)
          req.query = Object.fromEntries(url.searchParams)
          req.body = body
          res.status = (code) => { res.statusCode = code; return res }
          res.json = (data) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)) }
          await mod.default(req, res)
        } catch (e) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: e.message }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), devApi(loadEnv(mode, process.cwd(), ''))],
}))
