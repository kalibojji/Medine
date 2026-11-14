import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()
await page.goto(pathToFileURL(resolve(process.cwd(), 'index.html')).href)
await page.waitForTimeout(800)
await page.locator('[data-act="hellogo"]').first().click()
await page.waitForTimeout(300)
await page.locator('[data-act="home"]').first().click()
await page.waitForTimeout(400)
await page.screenshot({ path: 'tests/screens/new-home.png', fullPage: true })
await page.locator('[data-act="explore"]').first().click()
await page.waitForTimeout(400)
await page.screenshot({ path: 'tests/screens/new-explorer.png', fullPage: true })
await page.locator('[data-act="more"]').first().click()
await page.waitForTimeout(400)
await page.screenshot({ path: 'tests/screens/new-plus.png', fullPage: true })
console.log('captures prêtes')
await browser.close()
