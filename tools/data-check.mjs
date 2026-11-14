#!/usr/bin/env node
/**
 * Content quality checks for the curriculum data embedded in index.html.
 * Run: node tools/data-check.mjs
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const index = readFileSync(resolve(root, 'index.html'), 'utf8')

const failures = []
const warnings = []
const ok = (label, condition, detail = '') => {
  if (!condition) failures.push(`${label}${detail ? ' — ' + detail : ''}`)
}

// Tome data: <script type="application/json" id="tmjs">
const jsonMatch = index.match(/<script type="application\/json"[^>]*id="tmjs"[^>]*>([\s\S]*?)<\/script>/)
ok('données des tomes présentes', Boolean(jsonMatch))
const tomes = jsonMatch ? JSON.parse(jsonMatch[1]) : []
ok('tomes non vides', tomes.length > 0, `${tomes.length}`)
let lessons = 0
let tomeWords = 0
for (const tome of tomes) {
  ok('tome avec titre', Boolean(tome.t), JSON.stringify(tome.n))
  ok('tome avec leçons', Array.isArray(tome.l) && tome.l.length > 0, String(tome.n))
  for (const lesson of tome.l || []) {
    lessons++
    ok('leçon avec titre', Boolean(lesson.t && lesson.t.trim()), `${tome.n}/${lesson.t}`)
    if (lesson.r) ok('règles sous forme de texte', lesson.r.every(r => typeof r === 'string'), lesson.t)
    const seenInLesson = new Set()
    for (const entry of lesson.w || []) {
      tomeWords++
      ok('entrée de mot lisible', Array.isArray(entry) && entry.length >= 2, lesson.t)
      if (!Array.isArray(entry)) continue
      ok('mot de leçon renseigné', Boolean(String(entry[0] || '').trim()), lesson.t)
      ok('traduction de leçon renseignée', Boolean(String(entry[1] || '').trim()), String(entry[0]))
      const key = String(entry[0]).trim()
      if (seenInLesson.has(key)) warnings.push(`doublon dans « ${lesson.t} » : ${key}`)
      seenInLesson.add(key)
    }
  }
}

// Word groups: const D={"groups":[...]} in the application script.
const app = [...index.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).sort((a, b) => b.length - a.length)[0]
const start = app.indexOf('const D=')
const end = app.indexOf('const DATA=D.groups;')
ok('groupes de mots localisés', start >= 0 && end > start)
let words = 0
if (start >= 0 && end > start) {
  const literal = app.slice(start + 'const D='.length, end).trim().replace(/;$/, '')
  const data = JSON.parse(literal)
  const groups = data.groups || []
  ok('groupes non vides', groups.length > 0, `${groups.length}`)
  const seen = new Map()
  for (const group of groups) {
    ok(`groupe ${group.g} avec mots`, Array.isArray(group.words) && group.words.length > 0)
    for (const word of group.words || []) {
      words++
      ok('mot arabe renseigné', Boolean(word.ar && word.ar.trim()), JSON.stringify(word.fr))
      ok('traduction renseignée', Boolean(word.fr && word.fr.trim()), word.ar)
      const key = `${word.ar}|${word.fr}`
      if (seen.has(key)) warnings.push(`doublon : ${word.ar} — ${word.fr} (groupes ${seen.get(key)} et ${group.g})`)
      else seen.set(key, group.g)
    }
    for (const exercise of group.ex || []) {
      ok('phrase arabe renseignée', Boolean(exercise.ar && exercise.ar.trim()))
      ok('traduction de phrase renseignée', Boolean(exercise.fr && exercise.fr.trim()), exercise.ar)
    }
  }
}

console.log(`tomes : ${tomes.length}, leçons : ${lessons}, mots de leçon : ${tomeWords}, mots de révision : ${words}`)
if (warnings.length) console.log(`\nAvertissements (${warnings.length}) :\n` + warnings.slice(0, 20).map(w => ' - ' + w).join('\n'))
if (warnings.length > 20) console.log(` … ${warnings.length - 20} de plus`)
if (failures.length) {
  console.error(`\nÉCHEC (${failures.length}) :\n` + failures.slice(0, 30).map(f => ' - ' + f).join('\n'))
  process.exit(1)
}
console.log(`\nContenu valide : ${tomeWords} mots de leçon, ${words} mots de révision, ${lessons} leçons.`)
