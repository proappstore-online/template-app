import { test, expect } from '@playwright/test'
const origin = 'https://about-marketing-join-check.proappstore.online'
const fixture = 'http://127.0.0.1:4197'
const scenario = async (options: object) => {
  await fetch(`${fixture}/scenario`, { method: 'POST', body: JSON.stringify(options) })
}
const observations = async () => (await fetch(`${fixture}/observations`)).json()
const outcomes = {
  sent: 'Request sent.',
  invalid: 'Check your details.',
  'rate-limited': 'Please wait before trying again.',
  unavailable: 'Requests are unavailable.',
}

for (const [outcome, message] of Object.entries(outcomes)) {
  test(`native form and ${outcome} outcome under production CSP, no JavaScript`, async ({ page }, testInfo) => {
    await scenario({ outcome })
    await page.goto(`${origin}/#team-join`)
    const section = page.locator('#team-join')
    const form = page.getByRole('form', { name: 'Request to join', exact: true })
    await expect(section.getByRole('heading', { name: 'Help improve this app' })).toBeVisible()
    await expect(section).toContainText('Availability is checked when you submit')
    await expect(section.locator('img, script, a[href*="github"], [data-user-id]')).toHaveCount(0)
    for (const key of Object.keys(outcomes)) await expect(page.locator(`#team-join-${key}`)).toBeHidden()
    await expect(page.locator('#contact form')).toHaveAttribute('action', 'https://api.proappstore.online/v1/apps/marketing-join-check/enquiries')
    await form.getByLabel('Name', { exact: true }).fill('Synthetic Applicant')
    await form.getByLabel('Email', { exact: true }).fill('applicant@example.invalid')
    // Markup passes native validation, but the server rejects it: exercise the invalid redirect.
    await form.getByLabel('How would you like to help?').fill(outcome === 'invalid' ? '<b>Synthetic test</b>' : 'Synthetic QA request — never sent to a live API.')
    await form.getByRole('button', { name: 'Request to join', exact: true }).click({ noWaitAfter: true })
    await expect(page).toHaveURL(`${origin}/?team_join=${outcome}#team-join-${outcome}`)
    const banner = page.locator(`#team-join-${outcome}`)
    await expect(banner).toBeVisible()
    await expect(banner).toContainText(message)
    await expect(banner).toHaveAttribute('role', outcome === 'sent' ? 'status' : 'alert')
    for (const key of Object.keys(outcomes).filter((key) => key !== outcome)) await expect(page.locator(`#team-join-${key}`)).toBeHidden()
    const { submissions, unexpected } = await observations()
    expect(submissions).toHaveLength(1)
    expect(submissions[0]).toMatchObject({ method: 'POST', origin, type: 'application/x-www-form-urlencoded' })
    const body = new URLSearchParams(submissions[0].body)
    expect([...body.keys()].sort()).toEqual(['email', 'message', 'name', 'website'])
    expect(body.get('email')).toBe('applicant@example.invalid')
    expect(body.get('website')).toBe('')
    expect(page.url()).not.toMatch(/applicant|Synthetic|example.invalid/)
    expect(unexpected).toEqual([])
    // Evaluate is test instrumentation, not page JavaScript; the page runs with JavaScript disabled.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const button = await form.getByRole('button', { name: 'Request to join', exact: true }).boundingBox()
    expect(button?.height).toBeGreaterThanOrEqual(44)
    if (outcome === 'sent') await section.screenshot({ path: testInfo.outputPath('team-join.png') })
  })
}

// The original API-only form-action blocks the fixed return redirect.
// Retain evidence of why self is needed without changing script-src or connect-src.
test('legacy CSP blocks the return redirect', async ({ page }) => {
  await scenario({ outcome: 'sent', legacyCsp: true })
  const violation = page.waitForEvent('console', { predicate: (message) => message.text().includes('form-action') })
  await page.goto(`${origin}/#team-join`)
  const form = page.getByRole('form', { name: 'Request to join', exact: true })
  await form.getByLabel('Name', { exact: true }).fill('Synthetic Applicant')
  await form.getByLabel('Email', { exact: true }).fill('applicant@example.invalid')
  await form.getByLabel('How would you like to help?').fill('Synthetic QA only')
  await form.getByRole('button', { name: 'Request to join', exact: true }).click({ noWaitAfter: true })
  await violation
  await expect(page).toHaveURL(`${origin}/#team-join`)
  expect((await observations()).submissions).toHaveLength(1)
})

test('foreign form destination remains blocked by CSP', async ({ page }) => {
  await scenario({ outcome: 'sent' })
  await page.goto(`${origin}/#team-join`)
  const form = page.getByRole('form', { name: 'Request to join', exact: true })
  // Test instrumentation changes only the destination to exercise the policy boundary.
  await form.evaluate((node) => node.setAttribute('action', 'https://foreign.example.invalid/'))
  await form.getByLabel('Name', { exact: true }).fill('Synthetic Applicant')
  await form.getByLabel('Email', { exact: true }).fill('applicant@example.invalid')
  await form.getByLabel('How would you like to help?').fill('Synthetic QA only')
  const violation = page.waitForEvent('console', { predicate: (message) => message.text().includes('form-action') })
  await form.getByRole('button', { name: 'Request to join', exact: true }).click({ noWaitAfter: true })
  await violation
  expect(await observations()).toEqual({ submissions: [], unexpected: [] })
})

test('foreign redirect remains blocked by CSP', async ({ page }) => {
  await scenario({ outcome: 'sent', foreignRedirect: true })
  await page.goto(`${origin}/#team-join`)
  const form = page.getByRole('form', { name: 'Request to join', exact: true })
  await form.getByLabel('Name', { exact: true }).fill('Synthetic Applicant')
  await form.getByLabel('Email', { exact: true }).fill('applicant@example.invalid')
  await form.getByLabel('How would you like to help?').fill('Synthetic QA only')
  const violation = page.waitForEvent('console', { predicate: (message) => message.text().includes('form-action') })
  await form.getByRole('button', { name: 'Request to join', exact: true }).click({ noWaitAfter: true })
  await violation
  await expect(page).toHaveURL(`${origin}/#team-join`)
  expect((await observations()).unexpected).toEqual([])
})
