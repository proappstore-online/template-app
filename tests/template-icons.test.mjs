import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
// These neutral placeholders are recognized by platform 6027cbfa's default-icon
// detector. Changing them requires coordinating that allowlist so creation still
// personalizes the icons instead of protecting them as custom artwork (#558).
const defaults = {
  192: '5115a5755bf951f3e772d9d41d8203258bb44666ccd56763698e9b30a772cb2c',
  512: '13f7625cfa333cfd1d8c873e59d819e2206d6a514f3aff30141f86355cf85709',
}
const legacy = [
  '068ce0b22606087c2bf67ee3125a7b18522f2ec95a762f5fe2be104fcacc5384',
  'ebe6d029764e050f2d2229d5516dec4d5b7f488ff18961db0c757687247c10a6',
]

function checkIcon(path, size) {
  const bytes = readFileSync(path)
  assert.equal(bytes.toString('hex', 0, 8), '89504e470d0a1a0a', path)
  assert.equal(bytes.readUInt32BE(16), size, path)
  assert.equal(bytes.readUInt32BE(20), size, path)
  assert(!legacy.includes(hash(bytes)), `legacy F icon: ${path}`)
  assert.equal(hash(bytes), defaults[size], `must remain personalizable: ${path}`)
}

test('web and marketing ship matching, personalizable neutral PNGs', () => {
  for (const dir of ['web', 'marketing']) {
    for (const size of [192, 512]) checkIcon(join(root, dir, 'public', `icon-${size}.png`), size)
  }
})

test('a copied template builds favicon, Apple-touch and install references to neutral binary assets', { timeout: 180_000 }, () => {
  const temporary = mkdtempSync(join(tmpdir(), 'pas-template-icons-'))
  const fixture = join(temporary, 'web')
  try {
    cpSync(join(root, 'web'), fixture, {
      recursive: true,
      filter: (path) => !['node_modules', 'dist'].includes(basename(path)),
    })
    symlinkSync(realpathSync(join(root, 'web/node_modules')), join(fixture, 'node_modules'), 'junction')
    for (const path of ['index.html', 'vite.config.ts', 'package.json']) {
      const file = join(fixture, path)
      writeFileSync(file, readFileSync(file, 'utf8').replaceAll('APPNAME', 'icon-template-check'))
    }
    const result = spawnSync(process.execPath, [process.env.npm_execpath, 'exec', 'vite', 'build'], {
      cwd: fixture, encoding: 'utf8', timeout: 120_000,
    })
    assert.equal(result.status, 0, result.stdout + result.stderr + (result.error || ''))
    const html = readFileSync(join(fixture, 'dist/index.html'), 'utf8')
    for (const rel of ['icon', 'apple-touch-icon']) {
      const href = html.match(new RegExp(`<link rel="${rel}" href="([^"]+)"`))?.[1]
      assert(href, rel)
      const url = new URL(href, 'https://example.test')
      assert(url.search, 'invalidate previously cached F icons')
      checkIcon(join(fixture, 'dist', url.pathname), 192)
    }
    const manifestHref = html.match(/rel="manifest" href="([^"]+)"/)?.[1]
    assert(manifestHref)
    const manifest = JSON.parse(readFileSync(join(fixture, 'dist', manifestHref), 'utf8'))
    assert.equal(manifest.name, 'icon-template-check')
    assert.deepEqual(manifest.icons.map(({ sizes, purpose }) => [sizes, purpose]), [
      ['192x192', 'any'], ['512x512', 'any'], ['512x512', 'maskable'],
    ])
    for (const icon of manifest.icons) {
      const url = new URL(icon.src, 'https://example.test')
      assert(url.search)
      assert.equal(icon.type, 'image/png')
      checkIcon(join(fixture, 'dist', url.pathname), Number(icon.sizes.split('x')[0]))
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
})
