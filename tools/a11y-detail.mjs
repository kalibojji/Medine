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
await page.waitForTimeout(500)

for (const [label, act] of [['accueil', 'home'], ['entrainement', 'train'], ['plus', 'more']]) {
  const target = page.locator(`[data-act="${act}"]`).first()
  if (await target.count()) { await target.click(); await page.waitForTimeout(400) }
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  for (const v of result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')) {
    console.log(`\n### ${label} — ${v.id} (${v.impact})`)
    for (const node of v.nodes.slice(0, 8)) {
      console.log(' -', node.target.join(' '))
      console.log('   ', node.html.slice(0, 140))
      console.log('   ', (node.failureSummary || '').replace(/\n/g, ' ').slice(0, 220))
    }
  }
}
await browser.close()
