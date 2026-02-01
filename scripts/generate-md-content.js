#!/usr/bin/env node
/**
 * Build script to generate a JSON file containing all markdown content.
 * This is run at build time to bundle markdown files for the download API.
 *
 * Run with: ./scripts/generate-md-content.js or node scripts/generate-md-content.js
 */

const fs = require('fs')
const path = require('path')
const { parseDocPages } = require('./lib/parse-doc-pages')

const navigationPath = path.join(__dirname, '../app/utils/navigation.ts')
const navigationContent = fs.readFileSync(navigationPath, 'utf-8')
const docPages = parseDocPages(navigationContent)

if (docPages.length === 0) {
  console.error('Could not find docPages in navigation.ts')
  process.exit(1)
}

const mdContent = {}

for (const page of docPages) {
  const { path: urlPath, mdFile } = page
  const fullPath = path.join(__dirname, '..', mdFile)

  try {
    const content = fs.readFileSync(fullPath, 'utf-8')
    mdContent[urlPath] = {
      content,
      filename: path.basename(mdFile)
    }
    console.log(`✓ ${urlPath}`)
  } catch (err) {
    console.error(`✗ ${urlPath}: ${err.message}`)
  }
}

// Write to public directory so it's accessible at runtime
const dataDir = path.join(__dirname, '../public/data')
fs.mkdirSync(dataDir, { recursive: true })

const mdContentPath = path.join(dataDir, 'md-content.json')
fs.writeFileSync(mdContentPath, JSON.stringify(mdContent, null, 2))
console.log(`\nGenerated ${Object.keys(mdContent).length} entries to public/data/md-content.json`)
