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

const timing = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0]
  const fcp = performance.getEntriesByName('first-contentful-paint')[0]
  return {
    domContentLoaded: Math.round(nav?.domContentLoadedEventEnd ?? 0),
    load: Math.round(nav?.loadEventEnd ?? 0),
    firstContentfulPaint: fcp ? Math.round(fcp.startTime) : null,
  }
})
console.log('Timing local :', JSON.stringify(timing))

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
await goto('learn', '03a-apprendre.png')
await goto('home', '03a-retour.png')
await goto('explore', '03b-explorer.png')
await goto('home', '03c-retour-accueil.png')
await goto('train', '04-entrainement.png')
await goto('more', '05-plus.png')
await goto('hub', '05b-exercices.png')
await goto('stats', '05c-statistiques.png')

await page.locator('[data-act="more"]').first().click()
await page.waitForTimeout(300)
await goto('tomes', '05i-livres.png')
await page.locator('[data-act="home"]').first().click()
await page.waitForTimeout(400)
await page.locator('[data-act="more"]').first().click()
await page.waitForTimeout(300)
await goto('lessons', '05d-lecons.png')
await goto('lessonopen', '05e-lecon.png')
await page.locator('[data-act="home"]').first().click()
await page.waitForTimeout(400)
await goto('train', '05f-entrainement.png')
if (!(await page.getByText('Commence une leçon pour créer tes premières cartes').count())) fail('aide « cartes vides » absente')
await goto('trwords', '05g-quiz.png')
await goto('reveal', '05h-reponse.png')
await page.locator('[data-act="ok"]').first().click()
await page.waitForTimeout(1400)
await page.screenshot({ path: resolve(screens, '05h2-reponse-validee.png') })
await audit('05h2-reponse-validee.png')
await goto('quitses', '05i-quitter.png')
const quitHeading = await page.locator('h1').first().innerText()
if (!quitHeading.includes('Quitter la séance')) fail('confirmation de sortie absente')
await goto('resumeq', '05j-reprise.png')
await goto('quitses', '05k-quitter-confirme.png')
await page.locator('[data-act="home"]').first().click()
await page.waitForTimeout(400)

await goto('surahs', '06-coran.png')
await goto('surah', '06b-sourate.png')
await page.locator('[data-act="surahs"]').first().click()
await page.waitForTimeout(400)

const tabs = await page.locator('.tabbar .tb').count()
if (tabs !== 5) fail(`barre d'onglets : ${tabs} entrées au lieu de 5`)
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
