#!/usr/bin/env node
/**
 * Build script to generate a search index from navigation (docPages), static data, people, and events.
 * No markdown parsing for page body; doc pages use title + keywords only.
 *
 * Run with: ./scripts/generate-search-index.js or node scripts/generate-search-index.js
 */

const fs = require('fs')
const path = require('path')
const { parseDocPages } = require('./lib/parse-doc-pages')

const navPath = path.join(__dirname, '../app/utils/navigation.ts')
const outPath = path.join(__dirname, '../public/data/search-index.json')

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
    path: '/interactive-tools/terminal',
    title: 'CLI Terminal',
    section: 'tools',
    body:
      'Bitcoin CLI Terminal. Run Bitcoin RPC commands in the browser. getblockchaininfo, getblockcount, getblock, getblockhash, getrawtransaction, getmempoolinfo, getnetworkinfo, help. Connected to a public Bitcoin node. No node setup required.',
    keywords: ['rpc', 'cli', 'terminal', 'bitcoin core', 'getblock', 'getblockchaininfo', 'getblockhash', 'getrawtransaction', 'bitcoin cli'],
  },
  {
    path: '/interactive-tools/stack-lab',
    title: 'Stack Lab',
    section: 'tools',
    body:
      'Stack Lab. Interactive Bitcoin Script playground. Build and execute locking and unlocking scripts. Drag and drop OP codes. Learn Bitcoin Script, P2PKH, multisig, hash locks. Script interpreter, stack visualization.',
    keywords: ['script', 'op codes', 'opcode', 'stack', 'script builder', 'interpreter', 'stacklab', 'stack lab', 'script lab', 'playground', 'bitcoin script'],
  },
  {
    path: '/interactive-tools/block-visualizer',
    title: 'Block Visualizer',
    section: 'tools',
    body:
      'Block Visualizer. Live Bitcoin blockchain visualization showing the latest block with transaction treemap. Explore transactions, fee rates, and block data in real-time. Interactive transaction treemap. Each rectangle represents a transaction, sized by vBytes, value, or fee. Click on transactions to view inputs and outputs.',
    keywords: ['visualizer', 'visualiser', 'block visualizer', 'block visualiser', 'blockchain visualization', 'transaction treemap', 'block explorer', 'blockexplorer', 'block data', 'blocks'],
  },
  {
    path: '/interactive-tools/hash',
    title: 'Hash Tool',
    section: 'tools',
    body:
      'Hash Tool. Compute SHA-256, HASH256 (double SHA-256), and HASH160 in the browser. Used in Bitcoin for block hashes, TXIDs, addresses, and script. No installation required.',
    keywords: ['hash', 'sha256', 'sha-256', 'hash256', 'hash160', 'ripemd160', 'double sha256', 'txid', 'address', 'calculator', 'hash calculator', 'sha256 calculator', 'hash256 calculator', 'hash160 calculator'],
  },
  {
    path: '/interactive-tools/address-decoder',
    title: 'Address Decoder',
    section: 'tools',
    body:
      'Address Decoder. Decode and inspect Bitcoin addresses. See type (P2PKH, P2SH, P2WPKH, P2WSH, P2TR), network, version byte or witness version, hash, and checksum. Base58Check and Bech32/Bech32m.',
    keywords: ['address', 'decoder', 'address decoder', 'p2pkh', 'p2sh', 'p2wpkh', 'p2wsh', 'p2tr', 'base58', 'bech32', 'bech32m', 'decode address'],
  },
  {
    path: '/interactive-tools/transaction-decoder',
    title: 'Transaction Decoder',
    section: 'tools',
    body:
      'Transaction Decoder. Decode raw Bitcoin transaction hex. See version, inputs (outpoint, scriptSig, sequence), outputs (value, scriptPubKey), locktime. Supports SegWit.',
    keywords: ['transaction', 'decoder', 'transaction decoder', 'raw transaction', 'decode tx', 'hex', 'scriptSig', 'scriptPubKey', 'locktime'],
  },
  {
    path: '/interactive-tools/fee-estimator',
    title: 'Fee Estimator',
    section: 'tools',
    body:
      'Fee Estimator. Estimate Bitcoin transaction fee from size (vBytes) and current network rate. See fee in sats and USD for 1-block and 6-block targets.',
    keywords: ['fee', 'estimator', 'fee estimator', 'fee rate', 'sat/vB', 'vbytes', 'transaction fee', 'estimatesmartfee'],
  },
  {
    path: '/interactive-tools/denominations-calculator',
    title: 'Denomination Calculator',
    section: 'tools',
    body:
      'Denomination Calculator. Convert between Bitcoin units: satoshis (sats), BTC, bits (µBTC), millibits (mBTC), and more. Interactive calculator with live conversion.',
    keywords: ['calculator', 'denomination calculator', 'convert', 'sats', 'satoshis', 'btc', 'units', 'satoshi', 'denominations', 'bits', 'millibit'],
  },
  {
    path: '/about',
    title: 'About BitcoinDev',
    section: 'about',
    body:
      'About BitcoinDev. Existenziell. Developer and Bitcoin Enthusiast. Why BitcoinDev. Bitcoin education. Open source. Free. No ads. No paywalls. Support. Donate. Nostr.',
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

// People: one entry per person (path = /docs/history/people#slug). Body = title + keywords.
const searchPeople = [
  { path: '/docs/history/people#david-chaum', title: 'David Chaum', section: 'history', keywords: ['ecash', 'digicash', 'blind signatures', 'digital cash'] },
  { path: '/docs/history/people#eric-hughes', title: 'Eric Hughes', section: 'history', keywords: ['cypherpunk manifesto', 'cypherpunk mailing list'] },
  { path: '/docs/history/people#timothy-c-may', title: 'Timothy C. May', section: 'history', keywords: ['crypto anarchist manifesto', 'cypherpunk'] },
  { path: '/docs/history/people#john-gilmore', title: 'John Gilmore', section: 'history', keywords: ['cypherpunk', 'eff', 'mailing list'] },
  { path: '/docs/history/people#adam-back', title: 'Adam Back', section: 'history', keywords: ['hashcash', 'proof of work', 'blockstream'] },
  { path: '/docs/history/people#nick-szabo', title: 'Nick Szabo', section: 'history', keywords: ['bit gold', 'smart contracts'] },
  { path: '/docs/history/people#wei-dai', title: 'Wei Dai', section: 'history', keywords: ['b-money', 'wei'] },
  { path: '/docs/history/people#ralph-merkle', title: 'Ralph Merkle', section: 'history', keywords: ['merkle tree', 'merkle root', 'hash tree'] },
  { path: '/docs/history/people#stuart-haber-and-scott-stornetta', title: 'Stuart Haber and Scott Stornetta', section: 'history', keywords: ['timestamp', 'digital document', 'blockchain precursor'] },
  { path: '/docs/history/people#satoshi-nakamoto', title: 'Satoshi Nakamoto', section: 'history', keywords: ['whitepaper', 'genesis block', 'creator', 'bitcoin'] },
  { path: '/docs/history/people#hal-finney', title: 'Hal Finney', section: 'history', keywords: ['rpow', 'first transaction', 'pgp'] },
  { path: '/docs/history/people#len-sassaman', title: 'Len Sassaman', section: 'history', keywords: ['mixmaster', 'remailer', 'cypherpunk'] },
  { path: '/docs/history/people#martti-malmi', title: 'Martti Malmi', section: 'history', keywords: ['sirius', 'bitcoin.org', 'early contributor'] },
  { path: '/docs/history/people#gavin-andresen', title: 'Gavin Andresen', section: 'history', keywords: ['lead developer', 'bitcoin foundation'] },
  { path: '/docs/history/people#laszlo-hanyecz', title: 'Laszlo Hanyecz', section: 'history', keywords: ['pizza', 'pizza day', '10000 btc', 'first commercial'] },
  { path: '/docs/history/people#wladimir-van-der-laan', title: 'Wladimir van der Laan', section: 'history', keywords: ['bitcoin core', 'lead maintainer', 'blocksize'] },
  { path: '/docs/history/people#pieter-wuille', title: 'Pieter Wuille', section: 'history', keywords: ['segwit', 'taproot', 'libsecp256k1', 'bip 141'] },
  { path: '/docs/history/people#gregory-maxwell', title: 'Gregory Maxwell', section: 'history', keywords: ['blockstream', 'coinjoin', 'confidential transactions'] },
  { path: '/docs/history/people#joseph-poon-and-thaddeus-dryja', title: 'Joseph Poon and Thaddeus Dryja', section: 'history', keywords: ['lightning network', 'lightning whitepaper', 'payment channels'] },
  { path: '/docs/history/people#andreas-m-antonopoulos', title: 'Andreas M. Antonopoulos', section: 'history', keywords: ['mastering bitcoin', 'educator', 'author'] },
  { path: '/docs/history/people#roger-ver', title: 'Roger Ver', section: 'history', keywords: ['bitcoin jesus', 'bitcoin cash', 'early investor'] },
]
for (const p of searchPeople) {
  const body = p.title + ' ' + (p.keywords || []).join(' ')
  index.push(addEntry({ path: p.path, title: p.title, section: p.section, body, keywords: p.keywords }))
}

// Events/milestones: path points to doc that describes the event. Body = title + keywords.
const searchEvents = [
  { path: '/docs/history', title: 'Bitcoin Whitepaper Published', section: 'history', keywords: ['whitepaper', '2008', 'satoshi', 'october 31'] },
  { path: '/docs/history', title: 'Genesis Block', section: 'history', keywords: ['launch', '2009', 'block 0', 'january 3'] },
  { path: '/docs/history', title: 'First Bitcoin Transaction', section: 'history', keywords: ['hal finney', '10 btc', 'january 12 2009'] },
  { path: '/docs/history', title: 'Pizza Day', section: 'history', keywords: ['first commercial', '2010', '10000 btc', 'laszlo hanyecz', 'may 22'] },
  { path: '/docs/history', title: 'First Exchange Rate', section: 'history', keywords: ['2009', 'exchange rate'] },
  { path: '/docs/history', title: 'Satoshi\'s Handover', section: 'history', keywords: ['gavin andresen', '2010', 'disappearance'] },
  { path: '/docs/history', title: 'Mt. Gox Launches', section: 'history', keywords: ['exchange', '2010'] },
  { path: '/docs/history', title: 'Value Overflow Bug', section: 'history', keywords: ['184 billion', 'consensus bug', '2010'] },
  { path: '/docs/history', title: 'Dollar Parity', section: 'history', keywords: ['2011', '1 dollar', 'price'] },
  { path: '/docs/history/halvings', title: 'Halving 1', section: 'history', keywords: ['210000', '25 btc', '2012', 'november 28'] },
  { path: '/docs/history/halvings', title: 'Halving 2', section: 'history', keywords: ['420000', '12.5 btc', '2016', 'july 9'] },
  { path: '/docs/history/halvings', title: 'Halving 3', section: 'history', keywords: ['630000', '6.25 btc', '2020', 'may 11'] },
  { path: '/docs/history/halvings', title: 'Halving 4', section: 'history', keywords: ['840000', '3.125 btc', '2024', 'april 20'] },
  { path: '/docs/history', title: 'SegWit Activation', section: 'history', keywords: ['segwit', 'bip 141', '2017', 'uasf'] },
  { path: '/docs/history', title: 'Taproot Activation', section: 'history', keywords: ['taproot', 'schnorr', '2021', 'bip 340'] },
]
for (const e of searchEvents) {
  const body = e.title + ' ' + (e.keywords || []).join(' ')
  index.push(addEntry({ path: e.path, title: e.title, section: e.section, body, keywords: e.keywords }))
}

for (const page of docPages) {
  if (page.path === '/docs/glossary') continue // Glossary not shown in search results
  const body = page.title + ' ' + (pathKeywords[page.path] || []).join(' ')
  index.push(
    addEntry({
      path: page.path,
      title: page.title,
      section: page.section,
      body: body.trim(),
      keywords: pathKeywords[page.path],
    })
  )
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(index, null, 2))

console.log(`✓ Generated search index with ${index.length} entries`)
console.log(`  Output: public/data/search-index.json`)
