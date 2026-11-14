#!/usr/bin/env node
/**
 * Offline test: serves the app over HTTP, waits for the service worker,
 * goes offline and checks that the app still loads.
 * Run: node tools/offline-test.mjs
 */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const types = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff': 'font/woff',
  '.png': 'image/png',
}
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const file = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
    const body = await readFile(join(root, file))
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404); res.end('not found')
  }
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const url = `http://127.0.0.1:${server.address().port}/`

const failures = []
const fail = message => { failures.push(message); console.error('ÉCHEC : ' + message) }

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()
page.on('pageerror', error => console.error('pageerror : ' + error.message))

await page.goto(url, { waitUntil: 'load' })
await page.waitForTimeout(800)

const registered = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'unsupported'
  try {
    await navigator.serviceWorker.ready
    await new Promise(done => setTimeout(done, 500))
    return navigator.serviceWorker.controller ? 'controlled' : 'activated'
  } catch (error) {
    return 'error: ' + error.message
  }
})
if (registered === 'unsupported') fail('service worker non supporté')

await page.reload({ waitUntil: 'load' })
await page.waitForTimeout(800)
const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller))
if (!controlled) fail(`page non contrôlée après rechargement (${registered})`)

await context.setOffline(true)
await page.reload({ waitUntil: 'load' })
await page.waitForTimeout(1000)
const offlineText = (await page.locator('body').innerText()).trim()
if (offlineText.length < 20) fail('page vide hors-ligne')
if (!(await page.locator('[data-act="hellogo"]').count())) fail('application non montée hors-ligne')

await browser.close()
server.close()
if (failures.length) { console.error(`\n${failures.length} échec(s).`); process.exit(1) }
console.log('OK — chargement hors-ligne après service worker.')
