import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, extname, join } from 'node:path'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export default async function setup() {
  const marketing = fileURLToPath(new URL('../../marketing', import.meta.url))
  const temporary = mkdtempSync(join(tmpdir(), 'pas-marketing-join-'))
  const fixture = join(temporary, 'marketing')
  try {
    cpSync(marketing, fixture, { recursive: true, filter: (path) => !['node_modules', 'dist', '.astro'].includes(basename(path)) })
    symlinkSync(realpathSync(join(marketing, 'node_modules')), join(fixture, 'node_modules'), 'junction')
    for (const path of ['astro.config.ts', 'src/site.ts']) {
      const file = join(fixture, path)
      writeFileSync(file, readFileSync(file, 'utf8').replaceAll('APPNAME', 'marketing-join-check'))
    }
    const result = spawnSync('pnpm', ['exec', 'astro', 'build'], {
      cwd: fixture, env: { ...process.env, PAS_MARKETING_PREVIEW: 'false', ASTRO_TELEMETRY_DISABLED: '1' },
      encoding: 'utf8', timeout: 80_000,
    })
    if (result.status !== 0) throw new Error(result.stdout + result.stderr + (result.error || ''))
    // Every browser request, including redirect chains, terminates locally. Playwright route()
    // only intercepts the initial URL of a redirect, so it cannot safely model this contract.
    const cert = join(temporary, 'cert.pem')
    const key = join(temporary, 'key.pem')
    const generated = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=marketing-join-check'], { encoding: 'utf8' })
    if (generated.status !== 0) throw new Error(generated.stderr)
    const origin = 'https://about-marketing-join-check.proappstore.online'
    const observations = { submissions: [], unexpected: [] }
    let scenario = { outcome: 'sent', legacyCsp: false, foreignRedirect: false }
    const sockets = new Set()
    const content = https.createServer({ key: readFileSync(key), cert: readFileSync(cert) }, async (request, response) => {
      const url = new URL(request.url, `https://${request.headers.host}`)
      if (url.origin === 'https://api.proappstore.online' && url.pathname === '/v1/storefront/apps/marketing-join-check/enquiries/team-join' && request.method === 'POST') {
        let body = ''
        for await (const chunk of request) body += chunk
        observations.submissions.push({ method: request.method, origin: request.headers.origin, type: request.headers['content-type'], body })
        response.writeHead(303, { location: scenario.foreignRedirect ? 'https://foreign.example.invalid/' : `${origin}/?team_join=${scenario.outcome}#team-join-${scenario.outcome}`, 'cache-control': 'no-store' })
        return response.end()
      }
      if (url.origin !== origin || request.method !== 'GET') {
        observations.unexpected.push(url.href)
        response.writeHead(404)
        return response.end('Synthetic fixture: destination refused')
      }
      // Match packages/host/src/marketing-site.ts; self permits the fixed 303 return navigation.
      const csp = ["default-src 'none'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data:", "font-src 'self'", "connect-src 'self'", "base-uri 'none'", `form-action ${scenario.legacyCsp ? '' : "'self' "}https://api.proappstore.online`, "frame-ancestors 'none'", "object-src 'none'"].join('; ')
      const path = url.pathname === '/' ? 'index.html' : url.pathname.slice(1)
      const type = { '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' }[extname(path)] || 'application/octet-stream'
      try {
        const body = readFileSync(join(fixture, 'dist', path))
        response.writeHead(200, { 'content-type': type, 'content-security-policy': csp })
        response.end(body)
      } catch {
        response.writeHead(404)
        response.end()
      }
    })
    await new Promise((resolve) => content.listen(0, '127.0.0.1', resolve))
    const proxy = http.createServer(async (request, response) => {
      if (request.url === '/scenario' && request.method === 'POST') {
        let body = ''
        for await (const chunk of request) body += chunk
        scenario = JSON.parse(body)
        observations.submissions.length = 0
        observations.unexpected.length = 0
      }
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify(observations))
    })
    proxy.on('connect', (_request, client, head) => {
      const upstream = net.connect(content.address().port, '127.0.0.1', () => {
        client.write('HTTP/1.1 200 Connection Established\r\n\r\n')
        if (head.length) upstream.write(head)
        client.pipe(upstream)
        upstream.pipe(client)
      })
      for (const socket of [client, upstream]) {
        sockets.add(socket)
        socket.on('close', () => sockets.delete(socket))
        socket.on('error', () => { client.destroy(); upstream.destroy() })
      }
    })
    await new Promise((resolve, reject) => { proxy.once('error', reject); proxy.listen(4197, '127.0.0.1', resolve) })
    return async () => {
      for (const socket of sockets) socket.destroy()
      await Promise.all([new Promise((resolve) => proxy.close(resolve)), new Promise((resolve) => content.close(resolve))])
      rmSync(temporary, { recursive: true, force: true })
    }
  } catch (error) {
    rmSync(temporary, { recursive: true, force: true })
    throw error
  }
}
