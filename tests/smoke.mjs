import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const url = pathToFileURL(resolve('index.html')).href;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto(url);
await page.waitForTimeout(800);
const text = await page.locator('body').innerText();
const tabs = await page.locator('[data-act]').count();
await page.evaluate(() => {
  const order = ['hellogo', 'home', 'train', 'more', 'home'];
  for (const a of order) {
    const b = document.querySelector('[data-act="' + a + '"]');
    if (b) b.click();
  }
});
await page.waitForTimeout(400);
const after = await page.locator('body').innerText();
await browser.close();
const fail = [];
if (errors.length) fail.push('Erreurs JavaScript : ' + errors.join(' | '));
if (text.trim().length < 20 || after.trim().length < 20) fail.push('Page vide');
if (tabs < 1) fail.push('Aucun bouton trouvé');
if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
console.log('OK : la page se charge sans erreur.');
