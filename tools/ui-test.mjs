#!/usr/bin/env node
/**
 * End-to-end smoke test in a real browser: loads the app, walks the main
 * navigation, captures screenshots and audits accessibility with axe-core.
 * Run: node tools/ui-test.mjs
 */
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const screens = resolve(root, 'tests/screens')
mkdirSync(screens, { recursive: true })

const failures = []
const fail = message => { failures.push(message); console.error('ÉCHEC : ' + message) }
const a11y = []

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: 'light',
  locale: 'fr-FR',
})
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })

const url = pathToFileURL(resolve(root, 'index.html')).href
await page.goto(url, { waitUntil: 'load' })
await page.waitForTimeout(1200)

const bodyText = (await page.locator('body').innerText()).trim()
if (bodyText.length < 20) fail('page vide au chargement')
if (!(await page.title()).includes('Médine')) fail('titre de page manquant')

await page.screenshot({ path: resolve(screens, '01-accueil.png') })
await page.locator('[data-act="hellogo"]').first().click()
await page.waitForTimeout(600)
await page.screenshot({ path: resolve(screens, '02-que-veux-tu-faire.png') })

const audit = async label => {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  const serious = result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  for (const v of serious) {
    a11y.push(`${label} : ${v.id} (${v.impact}) — ${v.help} [${v.nodes.length} nœud(s)]`)
  }
}

const goto = async (act, name) => {
  const target = page.locator(`[data-act="${act}"]`).first()
  if (!(await target.count())) { fail(`bouton ${act} introuvable`); return }
  await target.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: resolve(screens, name) })
  await audit(name)
}

await goto('home', '03-accueil-complet.png')
await goto('train', '04-entrainement.png')
await goto('more', '05-plus.png')
await goto('hub', '05b-exercices.png')
await goto('stats', '05c-statistiques.png')
await goto('surahs', '06-coran.png')

const tabs = await page.locator('.tabbar .tb').count()
if (tabs !== 4) fail(`barre d'onglets : ${tabs} entrées au lieu de 4`)
if ((await page.locator('.tabbar [aria-current="page"]').count()) !== 1) fail('onglet courant ambigu')

await page.emulateMedia({ colorScheme: 'dark' })
await page.waitForTimeout(300)
await page.screenshot({ path: resolve(screens, '07-sombre.png') })
await audit('sombre')

if (errors.length) fail('erreurs JavaScript : ' + errors.join(' | '))
if (a11y.length) {
  console.error('\nAccessibilité (sérieux/critique) :\n' + a11y.map(a => ' - ' + a).join('\n'))
  fail(`${a11y.length} problème(s) d'accessibilité sérieux ou critiques`)
}

await browser.close()
if (failures.length) {
  console.error(`\n${failures.length} échec(s).`)
  process.exit(1)
}
console.log(`OK — ${tabs} onglets, captures dans tests/screens/, accessibilité sans erreur sérieuse.`)
