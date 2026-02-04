import glossaryData from '@/public/data/glossary.json'

/**
 * Single source of truth for all navigation and link data.
 * 
 * Used by:
 * - Home page (ctaLinks)
 * - DocsNavigation (docsNavLinksTop, docsNavLinksBottom, navItems)
 * - HorizontalNav (horizontalNavLinksBottom, navItems)
 * - Footer (footerLinksExternal, footerLinksExplore)
 * - Breadcrumbs (routeLabels)
 * - DownloadMarkdownButton (via downloadablePaths in useDocNavigation)
 * - generate-md-content and generate-search-index scripts (parse docPages via parse-doc-pages)
 * 
 * Note: /api/download-md and docs/[...slug] both use md-content.json (keyed by path), not pathToMdFile.
 */

export interface DocPage {
  path: string
  mdFile: string
  title: string
  section: string
}

export interface NavSection {
  title: string
  href: string
  children?: { title: string; href: string }[]
}

export const docPages: DocPage[] = [
  { path: '/docs/fundamentals', mdFile: 'app/docs/fundamentals/overview.md', title: 'Bitcoin Fundamentals', section: 'fundamentals' },
  { path: '/docs/fundamentals/problems', mdFile: 'app/docs/fundamentals/problems/problems.md', title: 'Problems Bitcoin Solved', section: 'fundamentals' },
  { path: '/docs/fundamentals/cypherpunk-philosophy', mdFile: 'app/docs/fundamentals/cypherpunk-philosophy/cypherpunk-philosophy.md', title: 'Cypherpunk Philosophy', section: 'fundamentals' },
  { path: '/docs/fundamentals/blockchain', mdFile: 'app/docs/fundamentals/blockchain/blockchain.md', title: 'The Blockchain', section: 'fundamentals' },
  { path: '/docs/fundamentals/timechain', mdFile: 'app/docs/fundamentals/timechain/timechain.md', title: 'Bitcoin as Timechain', section: 'fundamentals' },
  { path: '/docs/fundamentals/utxos', mdFile: 'app/docs/fundamentals/utxos/utxos.md', title: 'UTXO Model', section: 'fundamentals' },
  { path: '/docs/fundamentals/decentralization', mdFile: 'app/docs/fundamentals/decentralization/decentralization.md', title: 'Decentralization', section: 'fundamentals' },
  { path: '/docs/fundamentals/trust-model', mdFile: 'app/docs/fundamentals/trust-model/trust-model.md', title: 'Trust Model', section: 'fundamentals' },
  { path: '/docs/fundamentals/monetary-properties', mdFile: 'app/docs/fundamentals/monetary-properties/monetary-properties.md', title: 'Monetary Properties', section: 'fundamentals' },
  { path: '/docs/fundamentals/denominations', mdFile: 'app/docs/fundamentals/denominations/denominations.md', title: 'Denominations', section: 'fundamentals' },
  { path: '/docs/fundamentals/incentives', mdFile: 'app/docs/fundamentals/incentives/incentives.md', title: 'Incentive Structure', section: 'fundamentals' },
  { path: '/docs/fundamentals/game-theory', mdFile: 'app/docs/fundamentals/game-theory/game-theory.md', title: 'Game Theory', section: 'fundamentals' },
  { path: '/docs/fundamentals/governance', mdFile: 'app/docs/fundamentals/governance/governance.md', title: 'Governance & Evolution', section: 'fundamentals' },
  { path: '/docs/fundamentals/bitcoin-meme', mdFile: 'app/docs/fundamentals/bitcoin-meme/bitcoin-meme.md', title: 'Bitcoin, the Meme', section: 'fundamentals' },

  { path: '/docs/history', mdFile: 'app/docs/history/overview.md', title: 'Bitcoin History', section: 'history' },
  { path: '/docs/history/people', mdFile: 'app/docs/history/people/people.md', title: 'People', section: 'history' },
  { path: '/docs/history/halvings', mdFile: 'app/docs/history/halvings.md', title: 'Halvings', section: 'history' },
  { path: '/docs/history/forks', mdFile: 'app/docs/history/forks.md', title: 'Forks', section: 'history' },
  { path: '/docs/history/bips', mdFile: 'app/docs/history/bips.md', title: 'BIPs', section: 'history' },

  { path: '/docs/bitcoin', mdFile: 'app/docs/bitcoin/overview.md', title: 'The Bitcoin Protocol', section: 'bitcoin' },
  { path: '/docs/bitcoin/cryptography', mdFile: 'app/docs/bitcoin/cryptography/cryptography.md', title: 'Cryptography', section: 'bitcoin' },
  { path: '/docs/bitcoin/consensus', mdFile: 'app/docs/bitcoin/consensus/consensus.md', title: 'Consensus Mechanism', section: 'bitcoin' },
  { path: '/docs/bitcoin/transaction-structure', mdFile: 'app/docs/bitcoin/transaction-structure/transaction-structure.md', title: 'Transaction Structure', section: 'bitcoin' },
  { path: '/docs/bitcoin/transaction-lifecycle', mdFile: 'app/docs/bitcoin/transaction-lifecycle/transaction-lifecycle.md', title: 'Transaction Lifecycle', section: 'bitcoin' },
  { path: '/docs/bitcoin/script', mdFile: 'app/docs/bitcoin/script/script.md', title: 'Bitcoin Script', section: 'bitcoin' },
  { path: '/docs/bitcoin/op-codes', mdFile: 'app/docs/bitcoin/op-codes/op-codes.md', title: 'OP Codes', section: 'bitcoin' },
  { path: '/docs/bitcoin/timelocks', mdFile: 'app/docs/bitcoin/timelocks/timelocks.md', title: 'Timelocks', section: 'bitcoin' },
  { path: '/docs/bitcoin/sighash-types', mdFile: 'app/docs/bitcoin/sighash-types/sighash-types.md', title: 'Sighash Types', section: 'bitcoin' },
  { path: '/docs/bitcoin/merkle-trees', mdFile: 'app/docs/bitcoin/merkle-trees/merkle-trees.md', title: 'Merkle Trees', section: 'bitcoin' },
  { path: '/docs/bitcoin/blocks', mdFile: 'app/docs/bitcoin/blocks/blocks.md', title: 'Block Propagation', section: 'bitcoin' },
  { path: '/docs/bitcoin/coinbase-transaction', mdFile: 'app/docs/bitcoin/coinbase-transaction/coinbase-transaction.md', title: 'Coinbase Transaction', section: 'bitcoin' },
  { path: '/docs/bitcoin/subsidy', mdFile: 'app/docs/bitcoin/subsidy/subsidy.md', title: 'Block Subsidy', section: 'bitcoin' },
  { path: '/docs/bitcoin/transaction-fees', mdFile: 'app/docs/bitcoin/transaction-fees/transaction-fees.md', title: 'Transaction Fees', section: 'bitcoin' },
  { path: '/docs/bitcoin/transaction-malleability', mdFile: 'app/docs/bitcoin/transaction-malleability/transaction-malleability.md', title: 'Transaction Malleability', section: 'bitcoin' },
  { path: '/docs/bitcoin/segwit', mdFile: 'app/docs/bitcoin/segwit/segwit.md', title: 'SegWit', section: 'bitcoin' },
  { path: '/docs/bitcoin/witness', mdFile: 'app/docs/bitcoin/witness/witness.md', title: 'Witness', section: 'bitcoin' },
  { path: '/docs/bitcoin/taproot', mdFile: 'app/docs/bitcoin/taproot/taproot.md', title: 'Taproot', section: 'bitcoin' },
  { path: '/docs/bitcoin/p2p-protocol', mdFile: 'app/docs/bitcoin/p2p-protocol/p2p-protocol.md', title: 'P2P Network Protocol', section: 'bitcoin' },
  { path: '/docs/bitcoin/data-encoding', mdFile: 'app/docs/bitcoin/data-encoding/data-encoding.md', title: 'Data Encoding', section: 'bitcoin' },
  { path: '/docs/bitcoin/rpc', mdFile: 'app/docs/bitcoin/rpc/rpc.md', title: 'RPC Commands', section: 'bitcoin' },

  { path: '/docs/mining', mdFile: 'app/docs/mining/overview.md', title: 'Mining', section: 'mining' },
  { path: '/docs/mining/proof-of-work', mdFile: 'app/docs/mining/proof-of-work/proof-of-work.md', title: 'Proof-of-Work', section: 'mining' },
  { path: '/docs/mining/difficulty', mdFile: 'app/docs/mining/difficulty/difficulty.md', title: 'Difficulty Adjustment', section: 'mining' },
  { path: '/docs/mining/mempool', mdFile: 'app/docs/mining/mempool/mempool.md', title: 'Mempool', section: 'mining' },
  { path: '/docs/mining/block-construction', mdFile: 'app/docs/mining/block-construction/block-construction.md', title: 'Block Construction', section: 'mining' },
  { path: '/docs/mining/economics', mdFile: 'app/docs/mining/economics/economics.md', title: 'Economics', section: 'mining' },
  { path: '/docs/mining/pools', mdFile: 'app/docs/mining/pools/pools.md', title: 'Mining Pools', section: 'mining' },
  { path: '/docs/mining/hardware', mdFile: 'app/docs/mining/hardware/hardware.md', title: 'Hardware Evolution', section: 'mining' },
  { path: '/docs/mining/attacks', mdFile: 'app/docs/mining/attacks/attacks.md', title: 'Mining Attacks', section: 'mining' },
  { path: '/docs/mining/network-attacks', mdFile: 'app/docs/mining/network-attacks/network-attacks.md', title: 'Network Attacks & Security', section: 'mining' },

  { path: '/docs/wallets', mdFile: 'app/docs/wallets/overview.md', title: 'Wallet Development', section: 'wallets' },
  { path: '/docs/wallets/hd-wallets', mdFile: 'app/docs/wallets/hd-wallets/hd-wallets.md', title: 'HD Wallets', section: 'wallets' },
  { path: '/docs/wallets/address-types', mdFile: 'app/docs/wallets/address-types/address-types.md', title: 'Address Types', section: 'wallets' },
  { path: '/docs/wallets/transactions', mdFile: 'app/docs/wallets/transactions/transactions.md', title: 'Transaction Creation', section: 'wallets' },
  { path: '/docs/wallets/privacy', mdFile: 'app/docs/wallets/privacy/privacy.md', title: 'Privacy Techniques', section: 'wallets' },
  { path: '/docs/wallets/multisig', mdFile: 'app/docs/wallets/multisig/multisig.md', title: 'Multisig', section: 'wallets' },
  { path: '/docs/wallets/smart-contracts', mdFile: 'app/docs/wallets/smart-contracts/smart-contracts.md', title: 'Smart Contracts & Advanced Scripting', section: 'wallets' },

  { path: '/docs/lightning', mdFile: 'app/docs/lightning/overview.md', title: 'Lightning Network', section: 'lightning' },
  { path: '/docs/lightning/channels', mdFile: 'app/docs/lightning/channels/channels.md', title: 'Channels', section: 'lightning' },
  { path: '/docs/lightning/routing/htlc', mdFile: 'app/docs/lightning/routing/htlc.md', title: 'HTLCs', section: 'lightning' },
  { path: '/docs/lightning/routing-fees', mdFile: 'app/docs/lightning/routing-fees/routing-fees.md', title: 'Routing Fees', section: 'lightning' },
  { path: '/docs/lightning/routing/mpp', mdFile: 'app/docs/lightning/routing/mpp.md', title: 'Multi-Part Payments', section: 'lightning' },
  { path: '/docs/lightning/invoices', mdFile: 'app/docs/lightning/invoices/invoices.md', title: 'Invoices (BOLT11)', section: 'lightning' },
  { path: '/docs/lightning/bolt12-offers', mdFile: 'app/docs/lightning/bolt12-offers/bolt12-offers.md', title: 'Offers (BOLT12)', section: 'lightning' },
  { path: '/docs/lightning/onion', mdFile: 'app/docs/lightning/onion/onion.md', title: 'Onion Routing', section: 'lightning' },
  { path: '/docs/lightning/watchtowers', mdFile: 'app/docs/lightning/watchtowers/watchtowers.md', title: 'Watchtowers', section: 'lightning' },
  { path: '/docs/lightning/anchor-outputs', mdFile: 'app/docs/lightning/anchor-outputs/anchor-outputs.md', title: 'Anchor Outputs', section: 'lightning' },
  { path: '/docs/lightning/resources', mdFile: 'app/docs/lightning/resources/resources.md', title: 'Lightning Resources', section: 'lightning' },

  { path: '/docs/development', mdFile: 'app/docs/development/overview.md', title: 'Setup & Infrastructure', section: 'development' },
  { path: '/docs/development/install-bitcoin', mdFile: 'app/docs/development/install-bitcoin/install-bitcoin.md', title: 'Installing Bitcoin', section: 'development' },
  { path: '/docs/development/testing', mdFile: 'app/docs/development/testing/testing.md', title: 'Testing & Debugging', section: 'development' },
  { path: '/docs/development/testnets', mdFile: 'app/docs/development/testnets/testnets.md', title: 'Test Networks', section: 'development' },
  { path: '/docs/development/libraries', mdFile: 'app/docs/development/libraries/libraries.md', title: 'Libraries & SDKs', section: 'development' },
  { path: '/docs/development/node-types', mdFile: 'app/docs/development/node-types/node-types.md', title: 'Node Types', section: 'development' },
  { path: '/docs/development/bitcoin-core-internals', mdFile: 'app/docs/development/bitcoin-core-internals/bitcoin-core-internals.md', title: 'Bitcoin Core Internals', section: 'development' },
  { path: '/docs/development/resources', mdFile: 'app/docs/development/resources/resources.md', title: 'Developer Resources', section: 'development' },

  { path: '/docs/bitcoin-development', mdFile: 'app/docs/bitcoin-development/overview.md', title: 'Bitcoin Development', section: 'bitcoin-development' },
  { path: '/docs/bitcoin-development/keys', mdFile: 'app/docs/bitcoin-development/keys/keys.md', title: 'Key Management', section: 'bitcoin-development' },
  { path: '/docs/bitcoin-development/addresses', mdFile: 'app/docs/bitcoin-development/addresses/addresses.md', title: 'Address Generation', section: 'bitcoin-development' },
  { path: '/docs/bitcoin-development/fee-estimation', mdFile: 'app/docs/bitcoin-development/fee-estimation/fee-estimation.md', title: 'Fee Estimation', section: 'bitcoin-development' },
  { path: '/docs/bitcoin-development/coin-selection', mdFile: 'app/docs/bitcoin-development/coin-selection/coin-selection.md', title: 'Coin Selection', section: 'bitcoin-development' },
  { path: '/docs/bitcoin-development/transactions', mdFile: 'app/docs/bitcoin-development/transactions/transactions.md', title: 'Transaction Construction', section: 'bitcoin-development' },
  { path: '/docs/bitcoin-development/signing', mdFile: 'app/docs/bitcoin-development/signing/signing.md', title: 'Signing & Sighash', section: 'bitcoin-development' },
  { path: '/docs/bitcoin-development/psbt', mdFile: 'app/docs/bitcoin-development/psbt/psbt.md', title: 'PSBT', section: 'bitcoin-development' },
  { path: '/docs/bitcoin-development/fee-bumping', mdFile: 'app/docs/bitcoin-development/fee-bumping/fee-bumping.md', title: 'Fee Bumping', section: 'bitcoin-development' },
  { path: '/docs/bitcoin-development/payment-requests', mdFile: 'app/docs/bitcoin-development/payment-requests/payment-requests.md', title: 'Payment Requests', section: 'bitcoin-development' },
  { path: '/docs/bitcoin-development/blockchain-monitoring', mdFile: 'app/docs/bitcoin-development/blockchain-monitoring/blockchain-monitoring.md', title: 'Blockchain Monitoring', section: 'bitcoin-development' },
  { path: '/docs/bitcoin-development/price-tracking', mdFile: 'app/docs/bitcoin-development/price-tracking/price-tracking.md', title: 'Price Tracking', section: 'bitcoin-development' },
  { path: '/docs/bitcoin-development/script-patterns', mdFile: 'app/docs/bitcoin-development/script-patterns/script-patterns.md', title: 'Bitcoin Script Patterns', section: 'bitcoin-development' },
  { path: '/docs/bitcoin-development/miniscript', mdFile: 'app/docs/bitcoin-development/miniscript/miniscript.md', title: 'Miniscript', section: 'bitcoin-development' },
  { path: '/docs/bitcoin-development/descriptors', mdFile: 'app/docs/bitcoin-development/descriptors/descriptors.md', title: 'Output Descriptors', section: 'bitcoin-development' },

  { path: '/docs/controversies', mdFile: 'app/docs/controversies/overview.md', title: 'Controversies', section: 'controversies' },
  { path: '/docs/controversies/blocksize-wars', mdFile: 'app/docs/controversies/blocksize-wars/blocksize-wars.md', title: 'Blocksize Wars', section: 'controversies' },
  { path: '/docs/controversies/op-return', mdFile: 'app/docs/controversies/op-return/debate.md', title: 'OP_RETURN Debate', section: 'controversies' },
  { path: '/docs/controversies/ordinals', mdFile: 'app/docs/controversies/ordinals/ordinals.md', title: 'Ordinals and Inscriptions', section: 'controversies' },
  { path: '/docs/controversies/energy-consumption', mdFile: 'app/docs/controversies/energy-consumption/energy-consumption.md', title: 'Energy Consumption', section: 'controversies' },
  { path: '/docs/controversies/criminal-use', mdFile: 'app/docs/controversies/criminal-use/criminal-use.md', title: 'Bitcoin and Criminal Use', section: 'controversies' },
  { path: '/docs/controversies/etf-rejections', mdFile: 'app/docs/controversies/etf-rejections/etf-rejections.md', title: 'ETF Rejections', section: 'controversies' },
  { path: '/docs/controversies/mt-gox', mdFile: 'app/docs/controversies/mt-gox/mt-gox.md', title: 'Mt. Gox Collapse', section: 'controversies' },
  { path: '/docs/controversies/craig-wright', mdFile: 'app/docs/controversies/craig-wright/craig-wright.md', title: 'Craig Wright', section: 'controversies' },

  { path: '/docs/advanced', mdFile: 'app/docs/advanced/overview.md', title: 'Advanced Topics', section: 'advanced' },
  { path: '/docs/advanced/sidechains', mdFile: 'app/docs/advanced/sidechains/sidechains.md', title: 'Sidechains & Layer 2', section: 'advanced' },
  { path: '/docs/advanced/atomic-swaps', mdFile: 'app/docs/advanced/atomic-swaps/atomic-swaps.md', title: 'Atomic Swaps', section: 'advanced' },
  { path: '/docs/advanced/dlcs', mdFile: 'app/docs/advanced/dlcs/dlcs.md', title: 'Discreet Log Contracts', section: 'advanced' },
  { path: '/docs/advanced/statechains', mdFile: 'app/docs/advanced/statechains/statechains.md', title: 'Statechains', section: 'advanced' },
  { path: '/docs/advanced/ordinals-inscriptions', mdFile: 'app/docs/advanced/ordinals-inscriptions/ordinals-inscriptions.md', title: 'Ordinals & Inscriptions', section: 'advanced' },
  { path: '/docs/advanced/bloom-filters', mdFile: 'app/docs/advanced/bloom-filters/bloom-filters.md', title: 'Bloom Filters', section: 'advanced' },
  { path: '/docs/advanced/zero-conf-channels', mdFile: 'app/docs/advanced/zero-conf-channels/zero-conf-channels.md', title: 'Zero-Conf Channels', section: 'advanced' },
  { path: '/docs/advanced/trampoline-routing', mdFile: 'app/docs/advanced/trampoline-routing/trampoline-routing.md', title: 'Trampoline Routing', section: 'advanced' },
  { path: '/docs/advanced/covenants', mdFile: 'app/docs/advanced/covenants/covenants.md', title: 'Covenants', section: 'advanced' },

  { path: '/docs/investment', mdFile: 'app/docs/investment/overview.md', title: 'Bitcoin as Investment', section: 'investment' },
  { path: '/docs/investment/risk-management', mdFile: 'app/docs/investment/risk-management/risk-management.md', title: 'Risk Management', section: 'investment' },
  { path: '/docs/investment/investment-strategy', mdFile: 'app/docs/investment/investment-strategy/overview.md', title: 'Investment Strategy', section: 'investment' },
  { path: '/docs/investment/tools', mdFile: 'app/docs/investment/tools/tools.md', title: 'Interactive Tools', section: 'investment' },
  { path: '/docs/investment/wallet-security', mdFile: 'app/docs/investment/wallet-security/wallet-security.md', title: 'Wallet Security & Self-Custody', section: 'investment' },
  { path: '/docs/investment/privacy', mdFile: 'app/docs/investment/privacy/privacy.md', title: 'Privacy', section: 'investment' },
  { path: '/docs/investment/market-cycles', mdFile: 'app/docs/investment/market-cycles/market-cycles.md', title: 'Understanding Market Cycles', section: 'investment' },

  { path: '/docs/adoption', mdFile: 'app/docs/adoption/overview.md', title: 'Bitcoin Adoption', section: 'adoption' },
  { path: '/docs/adoption/stranded-energy', mdFile: 'app/docs/adoption/stranded-energy/stranded-energy.md', title: 'Stranded Energy and Flared Gas', section: 'adoption' },
  { path: '/docs/adoption/rural-communities', mdFile: 'app/docs/adoption/rural-communities/rural-communities.md', title: 'Rural Communities and Financial Inclusion', section: 'adoption' },
  { path: '/docs/adoption/use-cases', mdFile: 'app/docs/adoption/use-cases/use-cases.md', title: 'Bitcoin Use Cases', section: 'adoption' },

  { path: '/docs/glossary', mdFile: 'app/docs/glossary/terms.md', title: 'Glossary', section: 'glossary' },
]

// Section metadata for index pages
export const sections: Record<string, { title: string; description: string }> = {
  fundamentals: {
    title: 'Bitcoin Fundamentals',
    description: 'High-level concepts explaining what Bitcoin is, why it matters, and the problems it solves.',
  },
  history: {
    title: 'Bitcoin History',
    description: "Explore Bitcoin's history from the Genesis Block to future halvings, including key milestones, events, forks, and the complete halving and supply schedule.",
  },
  bitcoin: {
    title: 'Bitcoin Protocol',
    description: 'Deep technical documentation of the Bitcoin protocol, including cryptography, consensus, script system, protocol upgrades (SegWit, Taproot), and RPC interfaces.',
  },
  mining: {
    title: 'Mining',
    description: 'Learn about proof-of-work, block construction, pool mining, network security, and the economic incentives that secure the Bitcoin network.',
  },
  wallets: {
    title: 'Wallet Development',
    description: 'Build Bitcoin wallets with proper coin selection, multisig support, privacy techniques, smart contracts, and transaction construction.',
  },
  lightning: {
    title: 'Lightning Network',
    description: 'Understand the Lightning Network protocol, including channel management, routing, HTLCs, and onion routing.',
  },
  development: {
    title: 'Setup & Infrastructure',
    description: 'Setup and infrastructure for Bitcoin development, including installation, testing, test networks, libraries, node architecture, and Bitcoin Core internals.',
  },
  'bitcoin-development': {
    title: 'Bitcoin Development',
    description: 'Practical Bitcoin development tasks including PSBT, transaction construction, address generation, key management, blockchain monitoring, and script patterns.',
  },
  controversies: {
    title: 'Controversies',
    description: "Major debates and controversies that have shaped Bitcoin's development.",
  },
  advanced: {
    title: 'Advanced Topics',
    description: 'Advanced Bitcoin topics including atomic swaps, DLCs, sidechains, statechains, governance mechanisms, and experimental features.',
  },
  investment: {
    title: 'Bitcoin as Investment',
    description: 'Investment strategies, security practices, risk management, and long-term holding strategies for Bitcoin investors.',
  },
  adoption: {
    title: 'Bitcoin Adoption',
    description: 'Real-world examples of Bitcoin adoption, from stranded energy mining to financial inclusion in rural communities, plus an outlook on the future of Bitcoin.',
  },
  glossary: {
    title: 'Bitcoin Glossary',
    description: 'A glossary of Bitcoin development terms, from ASIC to ZMQ.',
  },
  whitepaper: {
    title: 'Whitepaper',
    description: 'The Bitcoin whitepaper by Satoshi Nakamoto.',
  },
  terminal: {
    title: 'CLI Terminal',
    description: 'Run Bitcoin RPC commands in the browser. No node setup required.',
  },
  'stack-lab': {
    title: 'Stack Lab',
    description: 'Interactive Bitcoin Script playground.',
  },
  about: {
    title: 'About BitcoinDev',
    description: 'About the BitcoinDev project and its creator.',
  },
  feedback: {
    title: 'Feedback',
    description: 'Leave feedback for BitcoinDev. Help us improve.',
  },
}

// Home page CTA links
export const ctaLinks: { href: string; title: string }[] = [
  { href: '/docs/fundamentals', title: 'Start Learning' },
  { href: '/interactive-tools', title: 'Interactive Tools' },
]

// Docs sidebar - top section
export const docsNavLinksTop: { href: string; title: string }[] = [
  { href: '/whitepaper', title: 'Whitepaper' },
]

// Docs sidebar - Interactive Tools as expandable section (used by DocsNavigation only)
export const interactiveToolsNavItem: NavSection = {
  title: 'Interactive Tools',
  href: '/interactive-tools',
  children: [
    { href: '/interactive-tools/terminal', title: 'CLI Terminal' },
    { href: '/interactive-tools/stack-lab', title: 'Stack Lab' },
    { href: '/interactive-tools/block-visualizer', title: 'Block Visualizer' },
    { href: '/interactive-tools/hash', title: 'Hash Tool' },
    { href: '/interactive-tools/address-decoder', title: 'Address Decoder' },
    { href: '/interactive-tools/transaction-decoder', title: 'Transaction Decoder' },
    { href: '/interactive-tools/fee-estimator', title: 'Fee Estimator' },
    { href: '/interactive-tools/denominations-calculator', title: 'Denomination Calculator' },
  ],
}

// Docs sidebar - bottom section (site utilities)
export const docsNavLinksBottom: { href: string; title: string }[] = [
  { href: '/about', title: 'About' },
  { href: '/feedback', title: 'Feedback' },
]

// Horizontal nav - quick links at bottom
export const horizontalNavLinksBottom: { href: string; title: string }[] = [
  { href: '/interactive-tools/terminal', title: 'CLI Terminal' },
  { href: '/interactive-tools/stack-lab', title: 'Stack Lab' },
  { href: '/interactive-tools/block-visualizer', title: 'Block Visualizer' },
  { href: '/whitepaper', title: 'Whitepaper' },
  { href: '/about', title: 'About' },
]

// Footer - External resources (left side)
export const footerLinksExternal: { name: string; url: string }[] = [
  { name: 'Bitcoin Devs', url: 'https://bitcoindevs.xyz' },
  { name: 'Bitcoin.org', url: 'https://bitcoin.org' },
  { name: 'Learn Me A Bitcoin', url: 'https://learnmeabitcoin.com' },
  { name: 'ClarkMoody', url: 'https://bitcoin.clarkmoody.com/dashboard/' },
  { name: 'Mempool.space', url: 'https://mempool.space' },
  { name: 'Blockstream', url: 'https://blockstream.info' },
  { name: 'Bitcoin Optech', url: 'https://bitcoinops.org' },
  { name: 'Bitcoin Visuals', url: 'https://bitcoinvisuals.com' },
]

// Footer - Explore BitcoinDev section (right side)
export const footerLinksExplore: { href: string; title: string }[] = [
  { href: '/docs', title: 'Search Docs' },
  { href: '/interactive-tools', title: 'Interactive Tools' },
  { href: '/whitepaper', title: 'Whitepaper' },
  { href: '/interactive-tools/terminal', title: 'CLI Terminal' },
  { href: '/interactive-tools/stack-lab', title: 'Stack Lab' },
  { href: '/interactive-tools/block-visualizer', title: 'Block Visualizer' },
  { href: '/docs/glossary', title: 'Glossary' },
  { href: '/about', title: 'About' },
  { href: '/feedback', title: 'Feedback' },
]

export const navItems: NavSection[] = [
  {
    title: 'Fundamentals',
    href: '/docs/fundamentals',
    children: docPages.filter(p => p.section === 'fundamentals' && p.path !== '/docs/fundamentals').map(p => ({ title: p.title, href: p.path })),
  },
  {
    title: 'History',
    href: '/docs/history',
    children: docPages.filter(p => p.section === 'history' && p.path !== '/docs/history').map(p => ({ title: p.title, href: p.path })),
  },
  {
    title: 'Setup & Infrastructure',
    href: '/docs/development',
    children: docPages.filter(p => p.section === 'development' && p.path !== '/docs/development').map(p => ({ title: p.title, href: p.path })),
  },
  {
    title: 'Bitcoin Protocol',
    href: '/docs/bitcoin',
    children: docPages.filter(p => p.section === 'bitcoin' && p.path !== '/docs/bitcoin').map(p => ({ title: p.title, href: p.path })),
  },
  {
    title: 'Bitcoin Development',
    href: '/docs/bitcoin-development',
    children: docPages.filter(p => p.section === 'bitcoin-development' && p.path !== '/docs/bitcoin-development').map(p => ({ title: p.title, href: p.path })),
  },
  {
    title: 'Wallets',
    href: '/docs/wallets',
    children: docPages.filter(p => p.section === 'wallets' && p.path !== '/docs/wallets').map(p => ({ title: p.title, href: p.path })),
  },
  {
    title: 'Mining',
    href: '/docs/mining',
    children: docPages.filter(p => p.section === 'mining' && p.path !== '/docs/mining').map(p => ({ title: p.title, href: p.path })),
  },
  {
    title: 'Lightning Network',
    href: '/docs/lightning',
    children: docPages.filter(p => p.section === 'lightning' && p.path !== '/docs/lightning').map(p => ({ title: p.title, href: p.path })),
  },
  {
    title: 'Advanced Topics',
    href: '/docs/advanced',
    children: docPages.filter(p => p.section === 'advanced' && p.path !== '/docs/advanced').map(p => ({ title: p.title, href: p.path })),
  },
  {
    title: 'Controversies',
    href: '/docs/controversies',
    children: docPages.filter(p => p.section === 'controversies' && p.path !== '/docs/controversies').map(p => ({ title: p.title, href: p.path })),
  },
  {
    title: 'Investment',
    href: '/docs/investment',
    children: docPages.filter(p => p.section === 'investment' && p.path !== '/docs/investment').map(p => ({ title: p.title, href: p.path })),
  },
  {
    title: 'Adoption',
    href: '/docs/adoption',
    children: docPages.filter(p => p.section === 'adoption' && p.path !== '/docs/adoption').map(p => ({ title: p.title, href: p.path })),
  },
  {
    title: 'Glossary',
    href: '/docs/glossary',
    children: glossaryData.map((section) => ({
      title: section.letter === '0-9' ? '#' : section.letter,
      href: `/docs/glossary#${section.slug}`,
    })),
  },
]

export const downloadablePaths: Set<string> = new Set(docPages.map(p => p.path))

// Breadcrumb labels: non-doc segments + doc pages derived from docPages (last path segment -> title)
const docRouteLabels = Object.fromEntries(
  docPages.map((p) => {
    const seg = p.path.split('/').filter(Boolean).pop()!
    return [seg, p.title]
  })
)
export const routeLabels: Record<string, string> = {
  tools: 'Interactive Tools',
  'interactive-tools': 'Interactive Tools',
  hash: 'Hash Tool',
  terminal: 'CLI Terminal',
  'stack-lab': 'Stack Lab',
  'block-visualizer': 'Block Visualizer',
  'address-decoder': 'Address Decoder',
  'transaction-decoder': 'Transaction Decoder',
  'fee-estimator': 'Fee Estimator',
  'denominations-calculator': 'Denomination Calculator',
  whitepaper: 'Whitepaper',
  about: 'About BitcoinDev',
  feedback: 'Feedback',
  docs: 'Documentation',
  ...docRouteLabels,
}

/** Build breadcrumb items for a path (for JSON-LD and server use). */
export function getBreadcrumbsForPath(pathname: string): { label: string; href: string }[] {
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs: { label: string; href: string }[] = [{ label: 'Home', href: '/' }]
  let currentPath = ''
  for (const segment of pathSegments) {
    currentPath += `/${segment}`
    const label =
      routeLabels[segment] ??
      segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    breadcrumbs.push({ label, href: currentPath })
  }
  return breadcrumbs
}
