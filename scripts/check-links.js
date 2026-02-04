#!/usr/bin/env node
/**
 * Check markdown files: validate internal links, run internal link analysis, optionally check external URLs.
 *
 * - Internal link analysis: check for broken links, report self-links, duplicate targets per page, pages with too many links, no links, orphans (informational; does not fail).
 * - External links: only checked when --external is passed.
 *
 * Run: node scripts/check-links.js [--external] [--json] [--concurrency=N]
 *   --external  Check that external URLs are accessible.
 *   --json            Output analysis as JSON and exit (no human-readable report).
 *   --concurrency=N   Max concurrent external URL checks (default: 8).
 */

const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const { URL } = require('url')
const { parseDocPages } = require('./lib/parse-doc-pages')

// Parse command line arguments
const args = process.argv.slice(2)
const checkExternal = args.includes('--external')
const outputJson = args.includes('--json')
const concurrencyArg = args.find((a) => a.startsWith('--concurrency='))
const externalConcurrency = concurrencyArg
  ? Math.max(1, parseInt(concurrencyArg.replace('--concurrency=', ''), 10) || 8)
  : 8
const maxLinks = 25

const projectRoot = path.join(__dirname, '..')

// Load valid doc pages from navigation.ts
const navigationPath = path.join(projectRoot, 'app/utils/navigation.ts')
const navigationContent = fs.readFileSync(navigationPath, 'utf-8')
const docPages = parseDocPages(navigationContent)
const validDocPaths = new Set(docPages.map(p => p.path))

// Also check md-content.json if it exists (for build-time validation)
let mdContentPaths = new Set()
try {
  const mdContentPath = path.join(projectRoot, 'public/data/md-content.json')
  if (fs.existsSync(mdContentPath)) {
    const mdContent = JSON.parse(fs.readFileSync(mdContentPath, 'utf-8'))
    mdContentPaths = new Set(Object.keys(mdContent))
  }
} catch (err) {
  // md-content.json might not exist, that's okay
}

// Static routes (must match app/sitemap.ts staticPaths)
const staticPaths = [
  '/',
  '/docs',
  '/docs/glossary',
  '/interactive-tools',
  '/interactive-tools/terminal',
  '/interactive-tools/stack-lab',
  '/interactive-tools/block-visualizer',
  '/interactive-tools/hash',
  '/interactive-tools/address-decoder',
  '/interactive-tools/transaction-decoder',
  '/interactive-tools/fee-estimator',
  '/interactive-tools/denominations-calculator',
  '/whitepaper',
  '/about',
  '/feedback',
]

// Combine valid paths: static routes + doc pages (navigation.ts) + md-content as fallback
const allValidPaths = new Set([...staticPaths, ...validDocPaths, ...mdContentPaths])

// Normalize path for validation (strip trailing slash; paths in nav/sitemap have no trailing slash)
function normalizePath(p) {
  return p.replace(/\/+$/, '') || '/'
}

// file (absolute, normalized) -> { path, title, section } for doc pages only
const fileToPage = new Map()
for (const page of docPages) {
  const absPath = path.normalize(path.join(projectRoot, page.mdFile))
  fileToPage.set(absPath, { path: page.path, title: page.title, section: page.section })
}

// Find all .md files in app/
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

const mdFiles = findMdFiles(path.join(projectRoot, 'app'))

// Check internal links: [text](/path) or [text](/path#anchor). Full match = full link for duplicate detection; group 2 = path.
const internalLinkRe = /\[([^\]]*)\]\((\/(?!\/)[^#\s)]*)(?:#[^\s)]+)?\)/g
const internalLinks = new Map() // path -> [ { file, lineNum, line, fullLink } ]
const bySourceFile = new Map() // normalized file path -> [ { targetPath, targetNormalized, lineNum, fullLink } ]

// Check external links (http/https)
const externalLinkRe = /\]\((https?:\/\/[^\s)]+)\)/g
const externalLinks = new Map() // url -> [ { file, lineNum, line, fullLink } ]

// Hosts to skip in external check (assumed to work; often block or throttle bots)
const externalCheckExcludedHosts = new Set([
  'www.coinbase.com',
  'coinbase.com',
  'www.kraken.com',
  'kraken.com'
])
function isExcludedFromExternalCheck(url) {
  try {
    return externalCheckExcludedHosts.has(new URL(url).hostname)
  } catch {
    return false
  }
}

for (const file of mdFiles) {
  const content = fs.readFileSync(file, 'utf-8')
  const lines = content.split('\n')
  const sourceLinks = []
  for (let i = 0; i < lines.length; i++) {
    let m
    internalLinkRe.lastIndex = 0
    while ((m = internalLinkRe.exec(lines[i])) !== null) {
      const linkPath = m[2]
      if (!internalLinks.has(linkPath)) internalLinks.set(linkPath, [])
      internalLinks.get(linkPath).push({
        file,
        lineNum: i + 1,
        line: lines[i].trim(),
        fullLink: m[0]
      })
      sourceLinks.push({
        targetPath: linkPath,
        targetNormalized: normalizePath(linkPath),
        lineNum: i + 1,
        fullLink: m[0],
      })
    }

    // Check external links
    externalLinkRe.lastIndex = 0
    while ((m = externalLinkRe.exec(lines[i])) !== null) {
      const url = m[1]
      if (!externalLinks.has(url)) externalLinks.set(url, [])
      externalLinks.get(url).push({
        file,
        lineNum: i + 1,
        line: lines[i].trim(),
        fullLink: m[0]
      })
    }
  }
  if (sourceLinks.length > 0) {
    bySourceFile.set(path.normalize(file), sourceLinks)
  }
}

// Function to check if an external URL is accessible
async function checkExternalUrl(url, timeout = 5000, maxRedirects = 5) {
  return new Promise((resolve) => {
    let redirectCount = 0
    let triedHead = false
    const checkUrl = (currentUrl, useGet = false) => {
      try {
        const parsed = new URL(currentUrl)
        const isHttps = parsed.protocol === 'https:'
        const client = isHttps ? https : http
        
        const options = {
          hostname: parsed.hostname,
          port: parsed.port || (isHttps ? 443 : 80),
          path: parsed.pathname + parsed.search,
          method: useGet ? 'GET' : 'HEAD', // Try HEAD first, fallback to GET
          timeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)'
          }
        }

        const req = client.request(options, (res) => {
          // Follow redirects
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectCount < maxRedirects) {
            redirectCount++
            const redirectUrl = res.headers.location.startsWith('http')
              ? res.headers.location
              : `${parsed.protocol}//${parsed.host}${res.headers.location}`
            req.destroy()
            checkUrl(redirectUrl, useGet)
            return
          }

          // If HEAD returns 404, try GET as fallback (some sites don't support HEAD)
          if (!useGet && !triedHead && res.statusCode === 404) {
            triedHead = true
            req.destroy()
            checkUrl(currentUrl, true)
            return
          }

          // Consider 2xx and 3xx as success
          const isSuccess = res.statusCode >= 200 && res.statusCode < 400
          if (useGet) {
            // For GET requests, just check status and abort immediately
            res.destroy()
          } else {
            req.destroy()
          }
          resolve({ success: isSuccess, statusCode: res.statusCode, url: currentUrl })
        })

        req.on('error', (err) => {
          // If HEAD failed and we haven't tried GET yet, try GET
          if (!useGet && !triedHead) {
            triedHead = true
            checkUrl(currentUrl, true)
            return
          }
          resolve({ success: false, error: err.message, url: currentUrl })
        })

        req.on('timeout', () => {
          req.destroy()
          // If HEAD timed out and we haven't tried GET yet, try GET
          if (!useGet && !triedHead) {
            triedHead = true
            checkUrl(currentUrl, true)
            return
          }
          resolve({ success: false, error: 'Timeout', url: currentUrl })
        })

        req.end()
      } catch (err) {
        resolve({ success: false, error: err.message, url: currentUrl })
      }
    }

    checkUrl(url)
  })
}

/**
 * Run async tasks with at most `concurrency` in flight. Returns results in original order.
 * @param {Array<T>} items
 * @param {number} concurrency
 * @param {(item: T) => Promise<R>} fn
 * @returns {Promise<R[]>}
 */
async function runWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length)
  let index = 0
  async function worker() {
    while (index < items.length) {
      const i = index++
      results[i] = await fn(items[i])
    }
  }
  const workerCount = Math.min(concurrency, items.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}

function relFile(filePath) {
  return path.relative(process.cwd(), filePath)
}

/**
 * Run internal link analysis (doc pages only). Returns report object matching analyze-internal-links shape.
 */
function runInternalAnalysis(maxLinksThreshold) {
  const outboundByPath = new Map()
  const inboundCount = new Map()

  for (const page of docPages) {
    const absPath = path.normalize(path.join(projectRoot, page.mdFile))
    const links = bySourceFile.get(absPath) || []
    outboundByPath.set(page.path, links)
    const seenTargets = new Set()
    for (const { targetNormalized } of links) {
      if (!seenTargets.has(targetNormalized)) {
        seenTargets.add(targetNormalized)
        inboundCount.set(targetNormalized, (inboundCount.get(targetNormalized) || 0) + 1)
      }
    }
  }

  const broken = []
  const selfLinks = []
  const duplicateByPage = new Map()

  for (const page of docPages) {
    const absPath = path.normalize(path.join(projectRoot, page.mdFile))
    const links = outboundByPath.get(page.path) || []
    const file = absPath
    const targetCounts = new Map()
    const fullLinkCounts = new Map()
    for (const { targetPath, targetNormalized, lineNum, fullLink } of links) {
      if (!allValidPaths.has(targetNormalized)) {
        broken.push({ sourcePath: page.path, targetPath: targetNormalized, lineNum, file })
      }
      if (targetNormalized === page.path) {
        selfLinks.push({ sourcePath: page.path, targetPath: targetNormalized, lineNum, file })
      }
      targetCounts.set(targetNormalized, (targetCounts.get(targetNormalized) || 0) + 1)
      fullLinkCounts.set(fullLink, (fullLinkCounts.get(fullLink) || 0) + 1)
    }
    const dups = []
    for (const [fullLink, count] of fullLinkCounts) {
      if (count > 1) {
        const first = links.find((l) => l.fullLink === fullLink)
        dups.push({ fullLink, targetNormalized: first.targetNormalized, count })
      }
    }
    if (dups.length > 0) duplicateByPage.set(page.path, dups)
  }

  const tooManyLinks = []
  const noLinks = []
  for (const page of docPages) {
    const links = outboundByPath.get(page.path) || []
    if (links.length > maxLinksThreshold) {
      tooManyLinks.push({ path: page.path, title: page.title, count: links.length })
    }
    if (links.length === 0) {
      noLinks.push({ path: page.path, title: page.title })
    }
  }

  const orphans = docPages
    .filter((p) => {
      if (p.path === '/' || p.path === '/docs' || p.path === '/docs/glossary') return false
      return (inboundCount.get(p.path) || 0) === 0
    })
    .map((p) => ({ path: p.path, title: p.title }))

  return {
    maxLinksThreshold,
    linksPerPage: docPages.map((p) => ({
      path: p.path,
      title: p.title,
      section: p.section,
      outboundCount: (outboundByPath.get(p.path) || []).length,
      inboundCount: inboundCount.get(p.path) || 0,
    })),
    broken,
    selfLinks,
    duplicateByPage,
    tooManyLinks,
    noLinks,
    orphans,
  }
}

// Main function to run checks
async function runChecks() {
  const invalidInternalLinks = [...internalLinks.keys()].filter(
    (p) => !allValidPaths.has(normalizePath(p))
  )

  let hasErrors = false

  // Check external links if requested
  let brokenExternalLinks = []
  if (checkExternal && externalLinks.size > 0) {
    const uniqueUrls = [...externalLinks.keys()].filter((url) => !isExcludedFromExternalCheck(url))
    const total = uniqueUrls.length
    const excludedCount = externalLinks.size - total
    if (excludedCount > 0) {
      console.log(`Skipping ${excludedCount} excluded host(s). `)
    }
    console.log(`Checking ${total} external link(s) (concurrency: ${externalConcurrency})...\n`)

    const items = uniqueUrls.map((url) => ({ url, occurrences: externalLinks.get(url) }))
    const results = await runWithConcurrency(
      items,
      externalConcurrency,
      async ({ url }) => checkExternalUrl(url)
    )

    for (let i = 0; i < results.length; i++) {
      const { url, occurrences } = items[i]
      const result = results[i]
      const current = i + 1
      const source = occurrences[0]
      const sourceInfo = `${path.relative(process.cwd(), source.file)}:${source.lineNum}`

      process.stdout.write(`[${current}/${total}] ${url}\n  -> ${sourceInfo} ... `)
      if (result.success) {
        const statusInfo = result.statusCode != null ? `HTTP ${result.statusCode}` : 'OK'
        console.log(`\x1b[32m${statusInfo}\x1b[0m`)
      } else {
        const failInfo = result.statusCode != null
          ? `HTTP ${result.statusCode}`
          : (result.error || 'failed')
        console.log(`\x1b[31mFAIL: ${failInfo}\x1b[0m`)
        brokenExternalLinks.push({ url, result, occurrences })
      }
    }
    if (total > 0) {
      console.log('')
    }
  }

  // Report internal link errors
  if (invalidInternalLinks.length > 0) {
    hasErrors = true
    console.error('\x1b[31mERROR: Internal links that point to non-existent pages:\x1b[0m\n')
    for (const linkPath of invalidInternalLinks.sort()) {
      const occurrences = internalLinks.get(linkPath)
      for (const { file, lineNum, fullLink } of occurrences) {
        console.error(`  ${linkPath}`)
        console.error(`    -> ${path.relative(process.cwd(), file)}:${lineNum}`)
        console.error(`    Link: ${fullLink}`)
      }
      console.error('')
    }
  }

  // Report external link errors
  if (brokenExternalLinks.length > 0) {
    hasErrors = true
    console.error('ERROR: External links that are not accessible:\n')
    for (const { url, result, occurrences } of brokenExternalLinks.sort((a, b) => a.url.localeCompare(b.url))) {
      for (const { file, lineNum, fullLink } of occurrences) {
        console.error(`  ${url}`)
        console.error(`    -> ${path.relative(process.cwd(), file)}:${lineNum}`)
        console.error(`    Link: ${fullLink}`)
        if (result.statusCode) {
          console.error(`    Status: ${result.statusCode}`)
        } else if (result.error) {
          console.error(`    Error: ${result.error}`)
        }
      }
      console.error('')
    }
  }

  // Internal link analysis (informational; does not set hasErrors)
  const analysis = runInternalAnalysis(maxLinks)
  if (outputJson) {
    const report = {
      maxLinksThreshold: analysis.maxLinksThreshold,
      linksPerPage: analysis.linksPerPage,
      broken: analysis.broken.map((b) => ({
        sourcePath: b.sourcePath,
        targetPath: b.targetPath,
        lineNum: b.lineNum,
        file: relFile(b.file),
      })),
      selfLinks: analysis.selfLinks.map((s) => ({
        sourcePath: s.sourcePath,
        lineNum: s.lineNum,
        file: relFile(s.file),
      })),
      duplicateOnPage: [...analysis.duplicateByPage.entries()].map(([pagePath, dups]) => ({
        pagePath,
        duplicates: dups,
      })),
      tooManyLinks: analysis.tooManyLinks.map((t) => ({ path: t.path, title: t.title, count: t.count })),
      noLinks: analysis.noLinks.map((n) => ({ path: n.path, title: n.title })),
      orphans: analysis.orphans.map((o) => ({ path: o.path, title: o.title })),
    }
    console.log(JSON.stringify(report, null, 2))
    process.exit(hasErrors ? 1 : 0)
  }
  const duplicateExtraCount = [...analysis.duplicateByPage.values()].reduce(
    (sum, dups) => sum + dups.reduce((s, d) => s + (d.count - 1), 0),
    0
  )
  const duplicateLinkCount = [...analysis.duplicateByPage.values()].reduce(
    (sum, dups) => sum + dups.length,
    0
  )
  const notUsefulTotal =
    analysis.broken.length + analysis.selfLinks.length + duplicateExtraCount

  const green = '\x1b[32m'
  const red = '\x1b[31m'
  const reset = '\x1b[0m'
  const checkLine = (pass, label, count) => {
    const icon = pass ? '✓' : '✗'
    const color = pass ? green : red
    console.log(`  ${color}${icon}${reset} ${label}: ${count}`)
  }

  console.log('=== Internal links analysis ===\n')

  checkLine(analysis.broken.length === 0, 'Broken (target not a valid path)', analysis.broken.length)
  if (analysis.broken.length > 0) {
    analysis.broken.forEach((b) =>
      console.log(`    ${b.sourcePath} -> ${b.targetPath}  ${relFile(b.file)}:${b.lineNum}`)
    )
  }
  checkLine(analysis.selfLinks.length === 0, 'Self-links (page links to itself)', analysis.selfLinks.length)
  if (analysis.selfLinks.length > 0) {
    analysis.selfLinks.forEach((s) => console.log(`    ${s.sourcePath}  ${relFile(s.file)}:${s.lineNum}`))
  }
  checkLine(duplicateLinkCount === 0, 'Links that appear more than once on the same page', duplicateLinkCount)
  if (duplicateExtraCount > 0) {
    console.log(`  Extra occurrence(s): ${duplicateExtraCount}`)
  }
  if (analysis.duplicateByPage.size > 0) {
    for (const [pagePath, dups] of analysis.duplicateByPage) {
      dups.forEach((d) => {
        console.log(`    ${pagePath}  ${d.fullLink}  (${d.count}×)  -> ${d.targetNormalized}`)
      })
    }
  }
  checkLine(analysis.tooManyLinks.length === 0, 'Pages with too many links', analysis.tooManyLinks.length)
  if (analysis.tooManyLinks.length > 0) {
    analysis.tooManyLinks.forEach((t) =>
      console.log(`    ${t.count}  ${t.path}  (${t.title})`)
    )
  }
  checkLine(analysis.noLinks.length === 0, 'Pages with no links', analysis.noLinks.length)
  if (analysis.noLinks.length > 0) {
    analysis.noLinks.forEach((n) => console.log(`    ${n.path}  (${n.title})`))
  }
  checkLine(analysis.orphans.length === 0, 'Orphan pages (no other page links to them)', analysis.orphans.length)
  if (analysis.orphans.length > 0) {
    analysis.orphans.forEach((o) => console.log(`    ${o.path}  (${o.title})`))
  }

  checkLine(invalidInternalLinks.length === 0, 'Invalid internal links (non-existent target)', invalidInternalLinks.length)
  if (checkExternal) {
    checkLine(brokenExternalLinks.length === 0, 'Broken external links (not accessible)', brokenExternalLinks.length)
  }

  console.log('\n--- Summary ---')
  if (hasErrors) {
    console.log(`${red}Some checks failed.${reset}\n`)
    process.exit(1)
  }
  console.log(`${green}All checks passed.${reset}\n`)
  process.exit(0)
}

// Run the checks
runChecks().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
