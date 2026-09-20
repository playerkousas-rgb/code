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

  // Verify HTML tag nesting and balance
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'])
  const tagRegex = /<\/?([a-zA-Z0-9-]+)(?:\s[^>]*)?\/?>/g
  const stack = []
  let tagMatch
  while ((tagMatch = tagRegex.exec(html)) !== null) {
    const full = tagMatch[0]
    const tag = tagMatch[1].toLowerCase()
    if (voidTags.has(tag) || full.endsWith('/>')) continue
    if (full.startsWith('</')) {
      if (stack.length === 0) {
        console.error(`${file}: unexpected closing tag </${tag}>`)
        failures++
      } else {
        const top = stack.pop()
        if (top.tag !== tag) {
          console.error(`${file}: tag mismatch: expected </${top.tag}> from line ${top.line}, found </${tag}>`)
          failures++
        }
      }
    } else {
      const line = html.slice(0, tagMatch.index).split('\n').length
      stack.push({ tag, line })
    }
  }
  while (stack.length > 0) {
    const unclosed = stack.pop()
    console.error(`${file}: unclosed tag <${unclosed.tag}> from line ${unclosed.line}`)
    failures++
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
