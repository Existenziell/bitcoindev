#!/usr/bin/env node
/**
 * Read block-history from public/data/block-history.json and display the results.
 *
 * Usage:
 *   ./scripts/get-block-history.js
 *   node scripts/get-block-history.js
 */

const fs = require('fs')
const path = require('path')

const BLOCK_HISTORY_PATH = path.join(__dirname, '..', 'public', 'data', 'block-history.json')

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Usage: node scripts/get-block-history.js')
    console.log('  Reads block-history from public/data/block-history.json and prints the JSON.')
    return
  }

  let raw
  try {
    raw = await fs.promises.readFile(BLOCK_HISTORY_PATH, 'utf-8')
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('No block-history file at', BLOCK_HISTORY_PATH)
      console.log('Run: npx tsx scripts/update-block-history.ts')
      return
    }
    throw err
  }
  const data = JSON.parse(raw)
  const blocks = Array.isArray(data) ? data : data?.blocks ?? null
  if (!blocks || blocks.length === 0) {
    console.log('No block data.')
    return
  }
  console.log(`Block history: ${blocks.length} block(s)\n`)
  console.log(JSON.stringify(blocks, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
