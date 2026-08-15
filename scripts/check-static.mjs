import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const requiredIds = {
  'index.html': ['editorView', 'testPaperView', 'gameView', 'inputText', 'mobileMenuBtn'],
  'training/index.html': ['gameCanvas', 'screen-start', 'screen-cipher-select', 'training-path-grid', 'mobile-keyboard', 'choice-panel', 'lesson-feedback'],
}

let failures = 0
for (const [file, expectedIds] of Object.entries(requiredIds)) {
  const html = await readFile(file, 'utf8')
  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1])
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))]
  if (duplicates.length) {
    console.error(`${file}: duplicate ids: ${duplicates.join(', ')}`)
    failures++
  }
  for (const id of expectedIds) {
    if (!ids.includes(id)) {
      console.error(`${file}: missing #${id}`)
      failures++
    }
  }

  const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .filter((script) => script.trim())
  for (const [index, script] of inlineScripts.entries()) {
    try {
      new vm.Script(script, { filename: `${file}:inline-script-${index + 1}` })
    } catch (error) {
      console.error(error.message)
      failures++
    }
  }
}

for (const file of ['js/app.js']) {
  const script = await readFile(file, 'utf8')
  try {
    new vm.Script(script, { filename: file })
  } catch (error) {
    console.error(error.message)
    failures++
  }
}

if (failures) process.exit(1)
console.log('Static checks passed: unique IDs, required views, and valid JavaScript syntax.')
