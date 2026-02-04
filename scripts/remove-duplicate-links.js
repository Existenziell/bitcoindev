#!/usr/bin/env node
/**
 * Remove duplicate internal links from doc pages. For each identical link
 * ([text](/path)) that appears more than once on the same page, keeps the
 * first occurrence and replaces the rest with plain link text.
 *
 * Run: node scripts/remove-duplicate-links.js [--dry-run] [--yes]
 *   --dry-run  Print what would be changed, do not edit files.
 *   --yes      Skip confirmation prompt (use with care).
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { parseDocPages } = require('./lib/parse-doc-pages')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const skipConfirm = args.includes('--yes')

const projectRoot = path.join(__dirname, '..')

// Same regex as check-links.js: [text](/path) or [text](/path#anchor)
const internalLinkRe = /\[([^\]]*)\]\((\/(?!\/)[^#\s)]*)(?:#[^\s)]+)?\)/g

function normalizePath(p) {
  return p.replace(/\/+$/, '') || '/'
}

function findMdFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
      findMdFiles(p, files)
    } else if (e.isFile() && e.name.endsWith('.md')) {
      files.push(p)
    }
  }
  return files
}

/** Extract link text from fullLink, e.g. [Blocks](/path) -> Blocks */
function linkTextFromFullLink(fullLink) {
  const m = fullLink.match(/^\[([^\]]*)\]/)
  return m ? m[1] : fullLink
}

/**
 * Build bySourceFile: normalized file path -> [ { targetPath, targetNormalized, lineNum, fullLink, index } ]
 * index = order of occurrence in the file (for stable sort).
 */
function buildBySourceFile(mdFiles) {
  const bySourceFile = new Map()
  for (const file of mdFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')
    const sourceLinks = []
    let index = 0
    for (let i = 0; i < lines.length; i++) {
      internalLinkRe.lastIndex = 0
      let m
      while ((m = internalLinkRe.exec(lines[i])) !== null) {
        const linkPath = m[2]
        sourceLinks.push({
          targetPath: linkPath,
          targetNormalized: normalizePath(linkPath),
          lineNum: i + 1,
          fullLink: m[0],
          index: index++,
        })
      }
    }
    if (sourceLinks.length > 0) {
      bySourceFile.set(path.normalize(file), sourceLinks)
    }
  }
  return bySourceFile
}

/**
 * Returns duplicate occurrences to replace: one entry per occurrence we will
 * replace. Each entry has { file, lineNum, fullLink, linkText, occurrenceIndexOnLine }.
 * occurrenceIndexOnLine is 1-based: replace the Nth occurrence of fullLink on that line.
 */
function getDuplicateOccurrencesToReplace(docPages, bySourceFile) {
  const toReplace = []
  for (const page of docPages) {
    const absPath = path.normalize(path.join(projectRoot, page.mdFile))
    const links = bySourceFile.get(absPath) || []
    const fullLinkCounts = new Map()
    for (const link of links) {
      fullLinkCounts.set(link.fullLink, (fullLinkCounts.get(link.fullLink) || 0) + 1)
    }
    for (const [fullLink, count] of fullLinkCounts) {
      if (count <= 1) continue
      const occurrences = links
        .filter((l) => l.fullLink === fullLink)
        .sort((a, b) => a.lineNum !== b.lineNum ? a.lineNum - b.lineNum : a.index - b.index)
      const keepFirst = occurrences[0]
      for (let i = 1; i < occurrences.length; i++) {
        const occ = occurrences[i]
        toReplace.push({
          file: absPath,
          lineNum: occ.lineNum,
          fullLink,
          linkText: linkTextFromFullLink(fullLink),
        })
      }
    }
  }
  // Assign occurrenceIndexOnLine: for each (file, lineNum, fullLink) group, number 1, 2, 3...
  const byKey = new Map()
  for (const r of toReplace) {
    const key = `${r.file}:${r.lineNum}:${r.fullLink}`
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key).push(r)
  }
  for (const list of byKey.values()) {
    list.forEach((r, i) => {
      r.occurrenceIndexOnLine = i + 1
    })
  }
  return toReplace
}

/**
 * Apply replacements to a single line. replacements is array of
 * { fullLink, linkText, occurrenceIndexOnLine }. Replace the Nth occurrence
 * of each fullLink with linkText. Do replacements from end to start so indices don't shift.
 */
function replaceOnLine(line, replacements) {
  if (replacements.length === 0) return line
  const replacers = []
  for (const { fullLink, linkText, occurrenceIndexOnLine } of replacements) {
    const re = new RegExp(escapeRe(fullLink), 'g')
    let matchCount = 0
    let match
    while ((match = re.exec(line)) !== null) {
      matchCount++
      if (matchCount === occurrenceIndexOnLine) {
        replacers.push({ start: match.index, end: match.index + fullLink.length, text: linkText })
        break
      }
    }
  }
  replacers.sort((a, b) => b.start - a.start)
  let result = line
  for (const { start, end, text } of replacers) {
    result = result.slice(0, start) + text + result.slice(end)
  }
  return result
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function main() {
  const navigationPath = path.join(projectRoot, 'app/utils/navigation.ts')
  const navigationContent = fs.readFileSync(navigationPath, 'utf-8')
  const docPages = parseDocPages(navigationContent)
  const mdFiles = findMdFiles(path.join(projectRoot, 'app'))
  const bySourceFile = buildBySourceFile(mdFiles)

  const toReplace = getDuplicateOccurrencesToReplace(docPages, bySourceFile)

  if (toReplace.length === 0) {
    console.log('No duplicate links found.')
    process.exit(0)
  }

  const byFile = new Map()
  for (const r of toReplace) {
    if (!byFile.has(r.file)) byFile.set(r.file, new Map())
    const byLine = byFile.get(r.file)
    if (!byLine.has(r.lineNum)) byLine.set(r.lineNum, [])
    byLine.get(r.lineNum).push(r)
  }

  if (dryRun) {
    console.log(`Would replace ${toReplace.length} duplicate link(s) in ${byFile.size} file(s):\n`)
    for (const [file, byLine] of byFile) {
      console.log(path.relative(process.cwd(), file))
      for (const [lineNum, list] of [...byLine.entries()].sort((a, b) => a[0] - b[0])) {
        for (const r of list) {
          console.log(`  ${lineNum}: "${r.fullLink}" -> "${r.linkText}" (occurrence ${r.occurrenceIndexOnLine} on line)`)
        }
      }
      console.log('')
    }
    process.exit(0)
  }

  const totalReplaces = toReplace.length
  const fileCount = byFile.size
  if (!skipConfirm) {
    const answer = await prompt(
      `Found ${totalReplaces} duplicate link(s) in ${fileCount} file(s). Replace duplicates with plain text? [y/N] `
    )
    if (!/^y(es)?$/i.test(answer?.trim())) {
      console.log('Aborted.')
      process.exit(0)
    }
  }

  for (const [file, byLine] of byFile) {
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')
    const lineNumbers = [...byLine.keys()].sort((a, b) => a - b)
    for (const lineNum of lineNumbers) {
      const idx = lineNum - 1
      lines[idx] = replaceOnLine(lines[idx], byLine.get(lineNum))
    }
    fs.writeFileSync(file, lines.join('\n'), 'utf-8')
    console.log('Updated:', path.relative(process.cwd(), file))
  }
  console.log(`Done. Replaced ${totalReplaces} duplicate link(s) in ${fileCount} file(s).`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
