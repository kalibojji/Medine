#!/usr/bin/env node
/**
 * Placement test: verifies that placing at a lesson updates the training range.
 * Run: node tools/placement-test.mjs
 */
import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))

await page.goto(pathToFileURL(resolve(root, 'index.html')).href)
await page.waitForTimeout(800)
await page.locator('[data-act="hellogo"]').first().click()
await page.waitForTimeout(300)
await page.locator('[data-act="placemid"]').first().click()
await page.waitForTimeout(400)
await page.selectOption('#plsel', '8')
await page.locator('[data-act="placeset"]').first().click()
await page.waitForTimeout(600)
await page.locator('[data-act="train"]').first().click()
await page.waitForTimeout(500)

const text = (await page.locator('#app').innerText()).replace(/\s+/g, ' ')
const state = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('medine-vocab-v1') || '{}')
  return { prog: s.prog, tr: s.tr }
})
const failures = []
if (state.prog !== 8) failures.push('programme non réglé à 8 : ' + state.prog)
if (!state.tr || state.tr.b !== 8) failures.push('plage non mise à jour : ' + JSON.stringify(state.tr))
if (!text.includes('6 à 8')) failures.push('la plage affichée ne suit pas le placement')
if (errors.length) failures.push('erreurs JS : ' + errors.join(' | '))

await browser.close()
if (failures.length) { console.error('ÉCHEC : ' + failures.join(' ; ')); process.exit(1) }
console.log('OK — placement à la leçon 8 : entraînement sur 6 à 8.')
