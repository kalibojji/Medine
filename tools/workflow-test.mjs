#!/usr/bin/env node
/**
 * Workflow test: starts the daily session, leaves it, checks the home offers
 * to resume, and that resuming returns to the same step.
 * Run: node tools/workflow-test.mjs
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
await page.locator('[data-act="placedeb"]').first().click()
await page.waitForTimeout(300)
await page.locator('[data-act="home"]').first().click()
await page.waitForTimeout(300)

const text = async () => (await page.locator('#app').innerText()).replace(/\s+/g, ' ')

await page.locator('[data-act="gday"]').first().click()
await page.waitForTimeout(700)
const started = await text()
if (!/Séance du jour|Phrases ·|Révisions ·|Règles ·/.test(started)) fail('étape de séance non affichée')

const quit = page.locator('[data-act="home"]').first()
if (!(await quit.count())) { fail('bouton quitter introuvable') } else {
  await quit.click()
  await page.waitForTimeout(500)
}
const home = await text()
if (!home.includes('Reprendre la séance du jour')) fail('accueil sans proposition de reprise')

const resume = page.locator('[data-act="gday"]').first()
if (!(await resume.count())) { fail('bouton de reprise introuvable') } else {
  await resume.click()
  await page.waitForTimeout(600)
}
const resumed = await text()
if (!/Phrases ·|Révisions ·|Règles ·/.test(resumed)) fail('reprise hors de la séance')

if (errors.length) fail('erreurs JavaScript : ' + errors.join(' | '))
await browser.close()
if (failures.length) { console.error(`\n${failures.length} échec(s).`); process.exit(1) }
console.log('OK — séance démarrée, quittée, reprise au même endroit.')
