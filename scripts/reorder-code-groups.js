#!/usr/bin/env node
/**
 * Reorder :::code-group blocks so languages appear in order: Rust, Python, C++, Go, JS.
 * Usage: node scripts/reorder-code-groups.js <file.md> [file2.md ...]
 */
const fs = require('fs')
const path = require('path')

const CANONICAL_ORDER = ['rust', 'python', 'cpp', 'c++', 'go', 'javascript', 'js']

function orderIndex(lang) {
  const L = (lang || '').toLowerCase()
  const normalized = L === 'c++' ? 'cpp' : L === 'js' ? 'javascript' : L
  const i = CANONICAL_ORDER.indexOf(normalized)
  return i >= 0 ? i : 999
}

function reorderCodeGroup(content) {
  return content.replace(/:::code-group\s*\n([\s\S]*?)\n:::/g, (match, groupContent) => {
    const blockRegex = /```(\w+)\s*\n([\s\S]*?)```/g
    const blocks = []
    let m
    while ((m = blockRegex.exec(groupContent)) !== null) {
      blocks.push({ lang: m[1], code: m[2].trimEnd() })
    }
    if (blocks.length === 0) return match
    blocks.sort((a, b) => orderIndex(a.lang) - orderIndex(b.lang))
    const newContent = blocks.map((b) => `\`\`\`${b.lang}\n${b.code}\n\`\`\``).join('\n\n')
    return `:::code-group\n${newContent}\n:::`
  })
}

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('Usage: node scripts/reorder-code-groups.js <file.md> [file2.md ...]')
  process.exit(1)
}

for (const file of files) {
  const filePath = path.resolve(file)
  const content = fs.readFileSync(filePath, 'utf8')
  const newContent = reorderCodeGroup(content)
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent)
    console.log('Reordered:', filePath)
  }
}
