import { test, expect } from '@playwright/test'

for (const signedIn of [false, true]) {
  test(`${signedIn ? 'account avatar' : 'guest profile icon'} opens the dedicated Profile from compact navigation`, async ({ page, isMobile }) => {
    const avatar='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32"%3E%3Crect width="32" height="32" fill="teal"/%3E%3C/svg%3E'
    await page.route('**/.pas/auth/me', r => r.fulfill({status:signedIn?200:401,json:signedIn?{id:'nav-test',name:'Navigation Tester',avatarUrl:avatar,roles:[]}: {}}))
    await page.route('**/api/v1/**', r => r.fulfill({json:{rows:[],meta:{changes:1}}}))
    await page.route('https://fonts.googleapis.com/**', r => r.fulfill({body:'',contentType:'text/css'}))
    await page.goto('/', {waitUntil:'domcontentloaded'})
    const header=page.getByRole('banner'), nav=header.getByRole('navigation',{name:'Main'}), profile=header.getByRole('button',{name:'Open profile',exact:true})
    await expect(profile).toBeVisible()
    await expect(nav.getByRole('link')).toHaveCount(2)
    await expect(header.getByRole('button',{name:/menu|sign in|text:/i})).toHaveCount(0)
    await expect(nav.getByRole('link',{name:'Profile',exact:true})).toHaveCount(0)
    for(const target of [header.getByRole('link').first(),profile,nav.getByRole('link').nth(0),nav.getByRole('link').nth(1)]) {
      const box=await target.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44)
    }
    if(isMobile) expect((await header.boundingBox())!.height).toBeLessThanOrEqual(64)
    if(signedIn) await expect(profile.locator('img')).toHaveAttribute('src',avatar)
    await nav.getByRole('link').nth(1).click()
    await profile.click()
    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.getByRole('heading',{name:'Profile',exact:true})).toBeVisible()
    await expect(profile).toHaveAttribute('aria-current','page')
    await expect(page.getByRole('heading',{name:'Appearance',exact:true})).toBeVisible()
    await expect(page.getByRole('button',{name:/Text: default/})).toBeVisible()
    if(signedIn) await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeVisible()
    else await expect(page.getByRole('button',{name:'Sign in with Google',exact:true})).toBeVisible()
    await page.reload({waitUntil:'domcontentloaded'})
    await expect(page.getByRole('heading',{name:'Profile',exact:true})).toBeVisible()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    await page.screenshot({path:`test-results/profile-${signedIn?'account':'guest'}-${test.info().project.name}.png`,fullPage:true})
  })
}
