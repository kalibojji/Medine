import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.on('pageerror', e => console.log('ERR', e.message))
await page.goto(pathToFileURL(resolve(root, 'index.html')).href)
await page.waitForTimeout(800)
await page.locator('[data-act="hellogo"]').first().click()
await page.waitForTimeout(400)
await page.locator('[data-act="home"]').first().click()
await page.waitForTimeout(400)

for (const act of ['guide', 'course', 'train']) {
  const b = page.locator(`[data-act="${act}"]`).first()
  if (!(await b.count())) { console.log(act, 'absent'); continue }
  await b.click()
  await page.waitForTimeout(500)
  const info = await page.evaluate(() => ({
    title: document.querySelector('h1')?.innerText,
    actions: [...document.querySelectorAll('[data-act]')].slice(0, 25).map(e => `${e.dataset.act}:${(e.innerText || '').trim().slice(0, 30).replace(/\s+/g, ' ')}`),
  }))
  console.log('\n===', act, '===')
  console.log(JSON.stringify(info, null, 1))
  await page.screenshot({ path: `tests/screens/explore-${act}.png` })
}
await browser.close()
