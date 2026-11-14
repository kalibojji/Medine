#!/usr/bin/env node
/**
 * Progress test: answers a quiz card, checks the daily counter and the saved
 * progress, then reloads to confirm persistence.
 * Run: node tools/progress-test.mjs
 */
import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const failures = []
const fail = message => { failures.push(message); console.error('ÉCHEC : ' + message) }

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })

await page.goto(pathToFileURL(resolve(root, 'index.html')).href)
await page.waitForTimeout(900)
await page.locator('[data-act="hellogo"]').first().click()
await page.waitForTimeout(300)
await page.locator('[data-act="home"]').first().click()
await page.waitForTimeout(300)
await page.locator('[data-act="train"]').first().click()
await page.waitForTimeout(300)
await page.locator('[data-act="trwords"]').first().click()
await page.waitForTimeout(500)

const counter = async () => Number((await page.locator('#app').innerText()).match(/\b(\d+)\s*\/\s*\d+/)?.[1])
const before = await counter()
if (!Number.isFinite(before)) fail('compteur de séance introuvable')

await page.locator('[data-act="reveal"]').first().click()
await page.waitForTimeout(300)
await page.locator('[data-act="ok"]').first().click()
await page.waitForTimeout(700)

const after = await counter()
if (!(after > before)) fail(`compteur non incrémenté (${before} → ${after})`)

const store = await page.evaluate(() => {
  const raw = localStorage.getItem('medine-vocab-v1')
  if (!raw) return null
  const s = JSON.parse(raw)
  const today = new Date().toISOString().slice(0, 10)
  return {
    logToday: (s.log || {})[today] || 0,
    cards: Object.keys(s.cards || {}).length,
    started: (s.started || []).length,
  }
})
if (!store) fail('progression non enregistrée dans localStorage')
else {
  if (store.logToday < 1) fail('compteur quotidien non mis à jour')
}

await page.reload({ waitUntil: 'load' })
await page.waitForTimeout(800)
const afterReload = await page.evaluate(() => {
  const raw = localStorage.getItem('medine-vocab-v1')
  if (!raw) return null
  const s = JSON.parse(raw)
  const today = new Date().toISOString().slice(0, 10)
  return { logToday: (s.log || {})[today] || 0, cards: Object.keys(s.cards || {}).length }
})
if (!afterReload || afterReload.logToday !== store?.logToday) fail('progression perdue au rechargement')

if (errors.length) fail('erreurs JavaScript : ' + errors.join(' | '))

await browser.close()
if (failures.length) { console.error(`\n${failures.length} échec(s).`); process.exit(1) }
console.log(`OK — réponse enregistrée (${store.logToday} aujourd'hui, ${store.cards} carte(s)), persistée après rechargement.`)
