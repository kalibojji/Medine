import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.on('pageerror', e => console.log('ERR', e.message))
await page.goto(pathToFileURL(resolve(process.cwd(), 'index.html')).href)
await page.waitForTimeout(700)
await page.locator('[data-act="hellogo"]').first().click()
await page.waitForTimeout(300)
await page.locator('[data-act="home"]').first().click()
await page.waitForTimeout(300)

const dump = async label => {
  const info = await page.evaluate(() => ({
    title: document.querySelector('h1')?.innerText,
    actions: [...document.querySelectorAll('[data-act]')].slice(0, 20).map(e => `${e.dataset.act}:${(e.innerText || '').trim().slice(0, 26).replace(/\s+/g, ' ')}`),
  }))
  console.log('\n===', label, '===')
  console.log(JSON.stringify(info))
  await page.screenshot({ path: `tests/screens/explore2-${label}.png` })
}

await page.locator('[data-act="more"]').first().click()
await page.waitForTimeout(300)
await dump('more')
const lessons = page.locator('[data-act="lessons"]').first()
if (await lessons.count()) { await lessons.click(); await page.waitForTimeout(400); await dump('lessons') }
const lesson = page.locator('[data-act="lesson"]').first()
if (await lesson.count()) { await lesson.click(); await page.waitForTimeout(400); await dump('lesson') }

await page.locator('[data-act="train"]').first().click()
await page.waitForTimeout(300)
const quiz = page.locator('[data-act="trwords"]').first()
if (await quiz.count()) { await quiz.click(); await page.waitForTimeout(400); await dump('trwords') }
const start = page.locator('[data-act="qstart"], [data-act="q5go"], [data-act="sstart"]').first()
if (await start.count()) { await start.click(); await page.waitForTimeout(600); await dump('quiz-running') }
await browser.close()
