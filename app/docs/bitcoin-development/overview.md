# Bitcoin Development

This section covers practical Bitcoin development tasks, the building blocks you'll use when creating Bitcoin applications. In [Bitcoin Fundamentals](/philosophy/fundamentals) you learned how Bitcoin works conceptually: the [UTXO model](/philosophy/fundamentals/utxos), the blockchain, the trust model, and incentives. Here we turn those ideas into implementation. Keys prove ownership, addresses encode spending conditions, transactions move UTXOs, and tools like PSBTs coordinate signing while monitoring keeps your app in sync with the chain. These guides focus on hands-on implementation: constructing transactions, managing keys, generating addresses, working with PSBTs, monitoring the blockchain, and more.

---

## Core Development Tasks

### [Key Management](/docs/bitcoin-development/keys)

Securely generate, store, and manage Bitcoin private keys. Learn about key derivation, encryption, and hardware wallet integration.

**Key topics:**
- Private key generation
- Key derivation (BIP32)
- Secure storage practices
- Hardware wallet protocols

### [Address Generation](/docs/bitcoin-development/addresses)

Generate and validate Bitcoin addresses for different address types (P2PKH, P2SH, P2WPKH, P2WSH, P2TR). Understand encoding, validation, and best practices.

**Key topics:**
- Address types and encoding
- Bech32 and Base58 encoding
- Address validation
- Derivation paths

### [Fee Estimation](/docs/bitcoin-development/fee-estimation)

Get a fee rate (sat/vB) from your node (e.g. `estimatesmartfee`) or from external APIs so you can set transaction fees appropriately. Integrates with Transaction Construction and Coin Selection (see below).

**Key topics:**
- Node RPC (estimatesmartfee)
- External fee APIs (e.g. mempool.space)
- Confirmation targets and units

### [Coin Selection](/docs/bitcoin-development/coin-selection)

Choose which UTXOs to spend so that total input value covers the payment plus fees. Implementation-focused: effective value, fee budget, and change handling. For algorithms and privacy strategies, see [Wallet Development](/docs/wallets).

**Key topics:**
- Effective value and input size
- Selecting inputs to cover amount + fee
- Change output and dust

### [Transaction Construction](/docs/bitcoin-development/transactions)

Build Bitcoin transactions from scratch, understanding inputs, outputs, fees, and signing. Learn the complete process from UTXO selection to broadcasting.

**Key topics:**
- Transaction structure and serialization
- Fee calculation strategies
- Coin selection algorithms
- Signing and validation

### [Signing & Sighash](/docs/bitcoin-development/signing)

Choose and use sighash types in code, multisig signing order, and how signing fits into PSBT workflows. For the protocol definition of sighash types, see [Sighash Types](/docs/bitcoin/sighash-types).

**Key topics:**
- Sighash types in practice (ALL, ANYONECANPAY)
- Multisig signing and PSBT flow
- Single-input signing and witness

### [PSBT](/docs/bitcoin-development/psbt)

Partially Signed Bitcoin Transactions (BIP-174) provide a standardized format for passing unsigned or partially signed transactions between different software and hardware. Essential for multi-party signing, hardware wallet integration, and air-gapped setups.

**Key topics:**
- PSBT structure and workflow
- Creating and combining PSBTs
- Hardware wallet integration
- Multi-signature coordination

### [Fee Bumping](/docs/bitcoin-development/fee-bumping)

When a transaction is stuck in the mempool, increase the effective fee using Replace-by-Fee (RBF) or Child Pays for Parent (CPFP). Developer-focused: when to use which, enabling RBF, and building replacement or child transactions in code.

**Key topics:**
- RBF vs CPFP and BIP 125 rules
- Enabling RBF and creating replacements
- Creating CPFP child transactions

---

## Monitoring & Integration

### [Payment Requests](/docs/bitcoin-development/payment-requests)

Request and receive Bitcoin payments: BIP 21 `bitcoin:` URIs, QR codes, verifying payment, and handling refunds. Use with Blockchain Monitoring to detect incoming payments and Price Tracking for fiat amounts on invoices.

**Key topics:**
- BIP 21 bitcoin: URI (generate and parse)
- QR codes and verification
- Refunds and confirmation handling

### [Blockchain Monitoring](/docs/bitcoin-development/blockchain-monitoring)

Monitor the Bitcoin blockchain programmatically, track transactions, watch addresses, and respond to network events in real-time.

**Key topics:**
- Block and transaction monitoring
- Address watching
- Mempool tracking
- WebSocket and API integration

### [Price Tracking](/docs/bitcoin-development/price-tracking)

Integrate Bitcoin price data into your applications using various APIs and services. Track prices, historical data, and market metrics.

**Key topics:**
- Price API integration
- Historical data retrieval
- Real-time price feeds
- Market data aggregation

---

## Advanced Topics

See [Advanced Topics](/docs/advanced) for covenants, sidechains, trampoline routing, and more. In this section:

### [Mining Pools](/docs/mining/pools)

Pool setup, monitoring, Stratum protocol, share validation, and pool architecture are covered in the Mining section.

### [Bitcoin Script Patterns](/docs/bitcoin-development/script-patterns)

Common Bitcoin script patterns and templates for building smart contracts and advanced spending conditions.

**Key topics:**
- Script templates
- Common patterns (multisig, timelocks, etc.)
- Script optimization
- Miniscript integration

### [Miniscript](/docs/bitcoin-development/miniscript)

Structured policy language that compiles to Bitcoin Script. Express spending conditions in high-level policies and get correct, analyzable scripts for multisig, timelocks, vaults, and Taproot.

**Key topics:**
- Policy vs. script
- Fragments and composition
- Correctness and safety
- Tapscript support

### [Output Descriptors](/docs/bitcoin-development/descriptors)

Standardized, human-readable strings (BIP 380/386) that describe which output scripts and addresses a wallet can derive. Essential for watch-only wallets, backup/restore, and interoperability with hardware wallets and PSBT. Complements Miniscript (policies compile to descriptors).

**Key topics:**
- Script and key expressions (wpkh, wsh, tr, xpub, paths)
- Parsing, validating, and deriving addresses
- Use cases: watch-only, backup, scanning

---

## Related Topics

- [Setup & Infrastructure](/docs/development) - Setup, testing, libraries, node architecture
- Wallet Development - HD wallets, coin selection, multisig
- [Bitcoin Protocol](/docs/bitcoin) - Script system, RPC, transaction structure
- [UTXO Model](/philosophy/fundamentals/utxos) - Understanding UTXOs for transaction building

---

## Resources

- [Bitcoin Developer Reference](https://developer.bitcoin.org/) - Official documentation
- [BIPs](https://github.com/bitcoin/bips) - Bitcoin Improvement Proposals
- [Bitcoin Optech](https://bitcoinops.org/) - Technical newsletter and guides
- [Bitcoin Stack Exchange](https://bitcoin.stackexchange.com/) - Q&A community
