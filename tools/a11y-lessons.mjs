import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })
const page = await context.newPage()
await page.goto(pathToFileURL(resolve(root, 'index.html')).href)
await page.waitForTimeout(800)
await page.locator('[data-act="hellogo"]').first().click()
await page.waitForTimeout(300)
await page.locator('[data-act="home"]').first().click()
await page.waitForTimeout(300)
await page.locator('[data-act="more"]').first().click()
await page.waitForTimeout(300)
await page.locator('[data-act="lessons"]').first().click()
await page.waitForTimeout(500)

const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
for (const v of result.violations) {
  console.log(`\n### ${v.id} (${v.impact}) — ${v.help}`)
  for (const node of v.nodes.slice(0, 8)) {
    console.log(' -', node.target.join(' '))
    console.log('   ', node.html.slice(0, 160))
    console.log('   ', (node.failureSummary || '').replace(/\n/g, ' ').slice(0, 240))
  }
}
await browser.close()
