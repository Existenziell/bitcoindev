# The Bitcoin Protocol

**How Bitcoin works.**

The Bitcoin protocol is an elegant system of interlocking mechanisms that together create the world's first truly decentralized digital currency. At its core, it solves the seemingly impossible problem of achieving consensus among untrusted parties without a central authority.

## Why the Protocol Matters

Every line of Bitcoin's protocol was carefully designed to create a system that is:

- **Trustless**: No single entity can manipulate the rules
- **Permissionless**: Anyone can participate without approval
- **Censorship-resistant**: No one can prevent valid transactions
- **Immutable**: History cannot be rewritten without enormous cost

The protocol transforms raw energy and mathematics into digital scarcity, creating something that has never existed before: a form of money that cannot be debased, confiscated, or counterfeited.

---

## Core Components

### Cryptography

The mathematical foundation of Bitcoin. [Elliptic curve cryptography](/docs/bitcoin/cryptography) (specifically secp256k1) enables the creation of unforgeable digital signatures, while SHA-256 hash functions provide the computational basis for mining and data integrity.

### Consensus

Bitcoin's [consensus mechanism](/docs/bitcoin/consensus) allows thousands of nodes worldwide to agree on a single transaction history without coordination. The combination of proof-of-work, the longest chain rule, and economic incentives creates a system where honesty is the most profitable strategy.

### Script

[Bitcoin Script](/docs/bitcoin/script) is a simple, stack-based programming language that defines spending conditions. While intentionally limited (no loops, no complex state), it enables powerful functionality like multi-signature wallets, time-locked transactions, and atomic swaps.

### OP Codes

The [instruction set](/docs/bitcoin/op-codes) that powers Bitcoin Script. Each opcode performs a specific operation on the stack, from simple arithmetic to complex cryptographic verification. Understanding opcodes is essential for working with Bitcoin's programmable money features.

### Block Structure

Blocks are the fundamental units of Bitcoin's ledger. [Block propagation](/docs/bitcoin/blocks) across the network ensures all participants eventually see the same history, while the Merkle tree structure enables efficient verification without downloading full blocks.

### Economic Rules

The [subsidy equation](/docs/bitcoin/subsidy) mathematically guarantees Bitcoin's fixed supply. Starting at 50 BTC per block and halving every 210,000 blocks, this creates a predictable, disinflationary monetary policy that will asymptotically approach 21 million coins.

---

## Network Participants

**Nodes:**
- Full nodes: Store complete blockchain, validate all transactions
- Light nodes: Store minimal data, rely on full nodes
- Mining nodes: Create new blocks, secure the network

**Miners:**
- Verify transactions
- Create new blocks
- Secure the network through proof-of-work
- Receive block rewards and fees

**Users:**
- Send and receive bitcoin
- Control their private keys
- Participate in the network

---

## Interacting with Bitcoin

### RPC Interface

The [RPC (Remote Procedure Call)](/docs/bitcoin/rpc) interface is how applications communicate with a Bitcoin node. It provides commands for querying blockchain state, constructing transactions, managing wallets, and monitoring network activity.

---

## The Elegance of Simplicity

What makes the Bitcoin protocol remarkable is not its complexity, but its simplicity. Each component does one thing well:

- **Hash functions** provide one-way data fingerprints
- **Digital signatures** prove ownership without revealing secrets
- **Proof-of-work** makes history expensive to rewrite
- **Merkle trees** enable compact proofs
- **Difficulty adjustment** maintains stable block times

Together, these simple building blocks create an unstoppable monetary network that has operated continuously since January 3, 2009.

---

## Explore the Protocol

Dive into the technical details:

- [Cryptography](/docs/bitcoin/cryptography) - Hash functions, elliptic curves, and digital signatures
- [Consensus](/docs/bitcoin/consensus) - How the network agrees on truth
- [Transaction Lifecycle](/docs/bitcoin/transaction-lifecycle) - Transaction states and confirmations
- [Script](/docs/bitcoin/script) - Bitcoin's programming language
- [OP Codes](/docs/bitcoin/op-codes) - The instruction set reference
- [Timelocks](/docs/bitcoin/timelocks) - Time-based spending conditions
- [Sighash Types](/docs/bitcoin/sighash-types) - What signatures commit to (SIGHASH_ALL, SINGLE, NONE, ANYONECANPAY)
- [Merkle Trees](/docs/bitcoin/merkle-trees) - Efficient transaction verification
- [Blocks](/docs/bitcoin/blocks) - Block structure and propagation
- [Subsidy](/docs/bitcoin/subsidy) - The mathematical supply schedule
- [Transaction Fees](/docs/bitcoin/transaction-fees) - Fee market and estimation
- [Transaction Malleability](/docs/bitcoin/transaction-malleability) - Historical issue and fix
- [SegWit](/docs/bitcoin/segwit) - Segregated Witness protocol upgrade
- [Taproot](/docs/bitcoin/taproot) - Schnorr signatures and MAST
- [P2P Network Protocol](/docs/bitcoin/p2p-protocol) - Peer-to-peer communication
- [RPC](/docs/bitcoin/rpc) - Node communication interface
