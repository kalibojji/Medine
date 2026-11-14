#!/usr/bin/env node
/**
 * Static checks for the single-file build. Fails fast with an explicit report.
 * Run: node tools/check.mjs
 */
import { readFileSync, existsSync, writeFileSync, mkdtempSync, readdirSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const failures = []
const notes = []
const ok = (label, condition, detail = '') => {
  if (condition) notes.push(`ok   ${label}${detail ? ' — ' + detail : ''}`)
  else failures.push(`${label}${detail ? ' — ' + detail : ''}`)
}

const index = readFileSync(join(root, 'index.html'), 'utf8')
ok('index.html non vide', index.length > 100000, `${index.length} caractères`)
const gzipBytes = gzipSync(Buffer.from(index, 'utf8')).length
ok('budget HTML compressé', gzipBytes < 700 * 1024, `${Math.round(gzipBytes / 1024)} Ko compressés`)

const doctype = index.match(/^<!doctype html>/i)
ok('doctype html', Boolean(doctype))

const htmlTag = index.match(/<html\b[^>]*>/i)
ok('html lang="fr"', Boolean(htmlTag && /lang="fr"/.test(htmlTag[0])))

const headMatch = index.match(/<head>([\s\S]*?)<\/head>/i)
ok('un seul <head>', (index.match(/<head>/g) || []).length === 1)
const head = headMatch ? headMatch[1] : ''
ok('title dans le head', /<title>[^<]+<\/title>/.test(head))
ok('meta description', /name="description"/.test(head))
ok('lien canonical', /rel="canonical"/.test(head))
ok('Open Graph', /property="og:title"/.test(head))

const bodyStart = index.indexOf('<body>')
const bodyEnd = index.lastIndexOf('</body>')
const body = bodyStart >= 0 && bodyEnd > bodyStart ? index.slice(bodyStart, bodyEnd) : ''
ok('title absent du body', !/^<title>/i.test(body.trimStart()))

ok('aucune police en base64', !/data:font\//.test(index))
const fontRefs = [...index.matchAll(/url\(fonts\/([^)]+)\)/g)].map(m => m[1])
ok('références de polices présentes', fontRefs.length > 0, `${fontRefs.length}`)
for (const ref of fontRefs) {
  ok(`police ${ref}`, existsSync(join(root, 'fonts', ref)))
}
const fontDir = join(root, 'fonts')
const fontBytes = existsSync(fontDir)
  ? readdirSync(fontDir).reduce((n, name) => n + statSync(join(fontDir, name)).size, 0)
  : 0
ok('budget polices', fontBytes < 400 * 1024, `${Math.round(fontBytes / 1024)} Ko`)

const jsonMatch = index.match(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/)
ok('script de données présent', Boolean(jsonMatch))
if (jsonMatch) {
  try {
    const data = JSON.parse(jsonMatch[1])
    const lessons = Array.isArray(data) ? data.reduce((n, g) => n + (g.l?.length || 0), 0) : 0
    ok('données JSON valides', Array.isArray(data), `${data.length} tomes, ${lessons} leçons`)
    ok('volume de données', lessons > 500, `${lessons} leçons`)
  } catch (error) {
    failures.push(`données JSON invalides — ${error.message}`)
  }
}

const appMatch = index.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)
ok('script applicatif présent', Boolean(appMatch))
if (appMatch) {
  const dir = mkdtempSync(join(tmpdir(), 'medine-check-'))
  const file = join(dir, 'app.mjs')
  writeFileSync(file, appMatch[1])
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })
    ok('script applicatif syntaxiquement valide', true)
  } catch (error) {
    failures.push(`script applicatif invalide — ${String(error.stderr || error.message).split('\n')[0]}`)
  }
}

ok('point de montage #app', /id="app"/.test(index))

const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'))
ok('manifest lisible', Boolean(manifest.name))
for (const icon of manifest.icons || []) ok(`icône ${icon.src}`, existsSync(join(root, icon.src)))

const sw = readFileSync(join(root, 'sw.js'), 'utf8')
const core = sw.match(/const CORE=\[([\s\S]*?)\]/)
ok('service worker avec CORE', Boolean(core))
if (core) {
  const entries = [...core[1].matchAll(/"([^"]+)"/g)].map(m => m[1])
  for (const entry of entries) {
    const file = entry === './' ? 'index.html' : entry
    ok(`précache ${entry}`, existsSync(join(root, file)))
  }
}
const version = sw.match(/const V='([^']+)'/)
ok('service worker versionné', Boolean(version), version ? version[1] : '')

console.log(notes.join('\n'))
if (failures.length) {
  console.error('\nÉCHEC :\n' + failures.map(f => ' - ' + f).join('\n'))
  process.exit(1)
}
console.log(`\n${notes.length} vérifications réussies.`)
