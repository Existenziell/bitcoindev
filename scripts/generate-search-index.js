#!/usr/bin/env node
/**
 * Build script to generate a search index from md-content and docPages.
 * Run after generate-md-content in prebuild.
 *
 * Run with: ./scripts/generate-search-index.js or node scripts/generate-search-index.js
 */

const fs = require('fs')
const path = require('path')
const { parseDocPages } = require('./lib/parse-doc-pages')
const { excerpt, parsePeopleSections, stripMarkdown } = require('./lib/search-index-helpers')

const mdPath = path.join(__dirname, '../public/data/md-content.json')
const navPath = path.join(__dirname, '../app/utils/navigation.ts')
const outPath = path.join(__dirname, '../public/data/search-index.json')

const mdContent = JSON.parse(fs.readFileSync(mdPath, 'utf-8'))
const navContent = fs.readFileSync(navPath, 'utf-8')
const docPages = parseDocPages(navContent) // [{ path, mdFile, title, section }]

// Comprehensive term aliases map for common Bitcoin technical term variations
// Maps canonical terms to their common variations/abbreviations
const termAliases = {
  // Hash functions
  'sha-256': ['sha256', 'sha 256', 'sha_256'],
  'ripemd-160': ['ripemd160', 'ripemd 160', 'ripemd_160'],
  
  // Address types
  'p2pkh': ['p2pkh', 'pay-to-pubkey-hash', 'pay to pubkey hash'],
  'p2sh': ['p2sh', 'pay-to-script-hash', 'pay to script hash'],
  'p2wpkh': ['p2wpkh', 'pay-to-witness-pubkey-hash', 'pay to witness pubkey hash'],
  'p2wsh': ['p2wsh', 'pay-to-witness-script-hash', 'pay to witness script hash'],
  'p2tr': ['p2tr', 'pay-to-taproot', 'pay to taproot'],
  
  // Protocol upgrades
  'segwit': ['segwit', 'seg wit', 'segregated witness'],
  'taproot': ['taproot', 'tap root'],
  
  // Lightning Network
  'lightning network': ['lightning network', 'ln', 'lightning'],
  'htlc': ['htlc', 'hash time locked contract', 'hash-time-locked-contract'],
  'bolt': ['bolt', 'basis of lightning technology'],
  
  // Cryptography
  'ecdsa': ['ecdsa', 'elliptic curve digital signature algorithm'],
  'schnorr': ['schnorr', 'schnorr signature', 'schnorr signatures'],
  
  // Common abbreviations
  'bip': ['bip', 'bitcoin improvement proposal', 'bitcoin improvement proposals'],
  'spv': ['spv', 'simplified payment verification'],
  'utxo': ['utxo', 'unspent transaction output', 'unspent transaction outputs'],
  'hd wallet': ['hd wallet', 'hierarchical deterministic wallet', 'hd wallets'],
  'rpc': ['rpc', 'remote procedure call'],
  'psbt': ['psbt', 'partially signed bitcoin transaction', 'partially signed bitcoin transactions'],
  'mast': ['mast', 'merkle abstract syntax tree', 'merkle abstract syntax trees'],
  'musig': ['musig', 'multisig schnorr', 'multisignature schnorr'],
  
  // Encoding
  'bech32': ['bech32', 'bech32m'],
  'base58': ['base58', 'base58check'],
  
  // Other common terms
  'opcode': ['opcode', 'op code', 'op codes', 'opcodes'],
  'script': ['script', 'bitcoin script', 'locking script', 'unlocking script'],
  'mempool': ['mempool', 'memory pool', 'transaction pool'],
  'mainnet': ['mainnet', 'main net'],
  'testnet': ['testnet', 'test net'],
}

// Helper function to get aliases for a term
function getTermAliases(term) {
  const lowerTerm = term.toLowerCase()
  // Check direct match
  if (termAliases[lowerTerm]) {
    return termAliases[lowerTerm]
  }
  // Check if term contains any key
  for (const [key, aliases] of Object.entries(termAliases)) {
    if (lowerTerm.includes(key) || key.includes(lowerTerm)) {
      return aliases
    }
  }
  return []
}

// Optional keywords per page: alternative spellings, synonyms, and terms
// that may not appear in the body (e.g. "sha256" when the text uses "SHA-256").
const pathKeywords = {
  '/docs/bitcoin/cryptography': ['sha256', 'sha-256', 'ripemd-160', 'ripemd160', 'ecdsa', 'schnorr'],
  '/docs/bitcoin/segwit': ['segwit', 'seg wit', 'segregated witness'],
  '/docs/bitcoin/taproot': ['taproot', 'tap root', 'schnorr', 'mast', 'musig'],
  '/docs/bitcoin/script': ['script', 'bitcoin script', 'opcode', 'op codes', 'opcodes', 'locking script', 'unlocking script'],
  '/docs/bitcoin/op-codes': ['opcode', 'op codes', 'opcodes'],
  '/docs/bitcoin/rpc': ['rpc', 'remote procedure call', 'json-rpc', 'bitcoin core rpc'],
  '/docs/lightning': ['lightning network', 'ln', 'lightning'],
  '/docs/lightning/channels': ['lightning channel', 'payment channel', 'channel'],
  '/docs/lightning/routing/htlc': ['htlc', 'hash time locked contract', 'hash-time-locked-contract'],
  '/docs/lightning/invoices': ['invoice', 'bolt11', 'bolt 11', 'lightning invoice'],
  '/docs/lightning/bolt12-offers': ['bolt12', 'bolt 12', 'offers', 'lightning offers'],
  '/docs/lightning/onion': ['onion routing', 'onion', 'sphinx'],
  '/docs/wallets/address-types': ['p2pkh', 'p2sh', 'p2wpkh', 'p2wsh', 'p2tr', 'address type', 'address types'],
  '/docs/wallets/hd-wallets': ['hd wallet', 'hierarchical deterministic wallet', 'hd wallets', 'bip32', 'bip 32'],
  '/docs/fundamentals/utxos': ['utxo', 'utxos', 'unspent transaction output', 'unspent transaction outputs'],
  '/docs/mining/mempool': ['mempool', 'memory pool', 'transaction pool'],
  '/docs/bitcoin-development/psbt': ['psbt', 'partially signed bitcoin transaction', 'partially signed bitcoin transactions'],
  '/docs/history/bips': ['bip', 'bips', 'bitcoin improvement proposal', 'bitcoin improvement proposals'],
  '/docs/development/testnets': ['testnet', 'test net', 'testnet3', 'regtest', 'signet'],
  '/docs/fundamentals/denominations': ['calculator', 'denomination calculator', 'convert', 'sats', 'satoshis', 'btc', 'units', 'satoshi', 'denominations'],
}

function addEntry(entry) {
  const out = { path: entry.path, title: entry.title, section: entry.section, body: entry.body }
  if (entry.keywords?.length) out.keywords = entry.keywords
  return out
}

const index = []

// Static first so /whitepaper ranks before mentioning docs
const staticPages = [
  {
    path: '/whitepaper',
    title: 'Bitcoin Whitepaper',
    section: 'whitepaper',
    body:
      'Bitcoin Whitepaper. Satoshi Nakamoto announced the whitepaper on the cryptography mailing list on October 31, 2008. The Bitcoin network launched on January 3, 2009, when Satoshi mined the Genesis Block. Open the Bitcoin whitepaper PDF. Related: Problems Bitcoin Solved, The Blockchain, Proof of Work, Consensus, Satoshi Nakamoto, Cypherpunk Philosophy.',
    keywords: ['whitepaper'],
  },
  {
    path: '/terminal',
    title: 'CLI Terminal',
    section: 'terminal',
    body:
      'Bitcoin CLI Terminal. Run Bitcoin RPC commands in the browser. getblockchaininfo, getblockcount, getblock, getblockhash, getrawtransaction, getmempoolinfo, getnetworkinfo, help. Connected to a public Bitcoin node. No node setup required.',
    keywords: ['rpc', 'cli', 'terminal', 'bitcoin core', 'getblock', 'getblockchaininfo', 'getblockhash', 'getrawtransaction', 'bitcoin cli'],
  },
  {
    path: '/stack-lab',
    title: 'Stack Lab',
    section: 'stack-lab',
    body:
      'Stack Lab. Interactive Bitcoin Script playground. Build and execute locking and unlocking scripts. Drag and drop OP codes. Learn Bitcoin Script, P2PKH, multisig, hash locks. Script interpreter, stack visualization.',
    keywords: ['script', 'op codes', 'opcode', 'stack', 'script builder', 'interpreter', 'stacklab', 'stack lab', 'script lab', 'playground', 'bitcoin script'],
  },
  {
    path: '/block-visualizer',
    title: 'Block Visualizer',
    section: 'block-visualizer',
    body:
      'Block Visualizer. Live Bitcoin blockchain visualization showing the latest block with transaction treemap. Explore transactions, fee rates, and block data in real-time. Interactive transaction treemap. Each rectangle represents a transaction, sized by vBytes, value, or fee. Click on transactions to view inputs and outputs.',
    keywords: ['visualizer', 'visualiser', 'block visualizer', 'block visualiser', 'blockchain visualization', 'transaction treemap', 'block explorer', 'blockexplorer', 'block data', 'blocks'],
  },
  {
    path: '/tools/hash',
    title: 'Hash Tool',
    section: 'tools',
    body:
      'Hash Tool. Compute SHA-256, HASH256 (double SHA-256), and HASH160 in the browser. Used in Bitcoin for block hashes, TXIDs, addresses, and script. No installation required.',
    keywords: ['hash', 'sha256', 'sha-256', 'hash256', 'hash160', 'ripemd160', 'double sha256', 'txid', 'address', 'calculator', 'hash calculator', 'sha256 calculator', 'hash256 calculator', 'hash160 calculator'],
  },
  {
    path: '/author',
    title: 'About BitcoinDev',
    section: 'author',
    body:
      'About BitcoinDev. Existenziell. Developer and Bitcoin Enthusiast. Why BitcoinDev. Bitcoin education. Open source. Free. No ads. No paywalls. Support. Donate. Bitcoin address. Nostr.',
    keywords: ['about', 'existenziell', 'author', 'support', 'donate'],
  },
  {
    path: '/feedback',
    title: 'Feedback',
    section: 'feedback',
    body:
      'Feedback. Share your thoughts about BitcoinDev. What worked for you? What didn\'t? Help us improve Bitcoin education. Your feedback helps us make BitcoinDev better.',
    keywords: ['feedback', 'suggestions', 'improvements', 'contact', 'help'],
  },
]
for (const p of staticPages) {
  index.push(addEntry(p))
}

const peopleContent = mdContent['/docs/history/people']?.content
for (const { slug, title, body } of parsePeopleSections(peopleContent)) {
  index.push(addEntry({ path: `/docs/history/people#${slug}`, title, section: 'history', body }))
}

for (const page of docPages) {
  const raw = mdContent[page.path]?.content
  const body = raw ? excerpt(stripMarkdown(raw), 500) : ''
  index.push(
    addEntry({
      path: page.path,
      title: page.title,
      section: page.section,
      body: body || page.title,
      keywords: pathKeywords[page.path],
    })
  )
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(index, null, 2))

console.log(`✓ Generated search index with ${index.length} entries`)
console.log(`  Output: public/data/search-index.json`)
