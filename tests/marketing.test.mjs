import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path) => readFileSync(resolve(root, path), 'utf8')

test('the marketing site pins Astro and ships home, Privacy and Terms pages', () => {
  const pkg = JSON.parse(read('marketing/package.json'))

  assert.match(pkg.devDependencies.astro, /^\d+\.\d+\.\d+$/)
  assert.deepEqual(readdirSync(resolve(root, 'marketing/src/pages')).sort(), ['index.astro', 'privacy.astro', 'robots.txt.ts', 'sitemap.xml.ts', 'terms.astro'])
  assert.match(read('marketing/astro.config.ts'), /output: 'static'/)
})

test('APPNAME appears only in files pas create substitutes', () => {
  // pas create replaces APPNAME in .ts/.json/... but not .astro, so app config stays in src/site.ts.
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)])
  for (const file of walk(resolve(root, 'marketing/src')).filter((f) => f.endsWith('.astro'))) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /APPNAME/, file)
  }
})

test('with no contactEmail the legal pages point at the home page contact form (platform#588)', () => {
  assert.match(read('marketing/src/pages/index.astro'), /<section id="contact"[^>]*>[\s\S]*?action=\{`https:\/\/api\.proappstore\.online\/v1\/apps\/\$\{site\.appId\}\/enquiries`\}/)
  assert.match(read('marketing/src/site.ts'), /: `use the contact form at https:\/\/about-\$\{site\.appId\}\.proappstore\.online\/#contact`/)
})

test('optional home page sections are driven by site.ts and empty by default (#6)', () => {
  const site = read('marketing/src/site.ts')
  const home = read('marketing/src/pages/index.astro')
  for (const field of ['features', 'audience', 'phoneScreenshots', 'faq']) {
    assert.match(site, new RegExp(`\\n  ${field}: \\[\\] as `), field)
    assert.match(home, new RegExp(`\\{site\\.${field}\\.length > 0 && \\(`), field)
  }
  assert.match(site, /\n  install: true,/)
  assert.match(home, /\{site\.install && \(/)
})

test('anonymous recruitment uses native forms, fixed outcomes and no public roster (platform#541)', () => {
  const component = read('marketing/src/components/TeamJoinForm.astro')
  assert.match(read('marketing/src/pages/index.astro'), /<TeamJoinForm \/>/)
  assert.match(component, /method="POST"/)
  assert.match(component, /action=\{`https:\/\/api\.proappstore\.online\/v1\/storefront\/apps\/\$\{site.appId\}\/enquiries\/team-join`\}/)
  assert.match(component, /enctype="application\/x-www-form-urlencoded"/)
  assert.doesNotMatch(component, /<script|fetch\(|avatar|github|profile|return_url|redirect_uri/i)
  for (const outcome of ['sent', 'invalid', 'rate-limited', 'unavailable']) {
    assert.match(component, new RegExp(`id="team-join-${outcome}"[^>]+target:block`))
  }
  for (const [field, limit] of [['name', 100], ['email', 254], ['message', 5000]]) {
    assert.match(component, new RegExp(`name="${field}"[^>]+required[^>]+maxlength="${limit}"`))
  }
  assert.match(component, /name="website"[^>]+tabindex="-1"/)
  assert.match(component, /Availability is checked when you submit/)
})
