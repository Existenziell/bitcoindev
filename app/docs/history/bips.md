# Bitcoin Improvement Proposals (BIPs)

Bitcoin Improvement Proposals are the formal mechanism for proposing changes to Bitcoin. They document design decisions, protocol upgrades, and best practices for the Bitcoin ecosystem. BIPs are modeled after Python Enhancement Proposals (PEPs) and were introduced by Amir Taaki in 2011.

## BIP Types

| Type | Description | Examples |
|------|-------------|----------|
| **Standards Track** | Changes to the network protocol, transaction validity, or interoperability | BIP 141 (SegWit), BIP 341 (Taproot) |
| **Informational** | Design issues, guidelines, or general information | BIP 2 (BIP Process) |
| **Process** | Changes to the BIP process itself | BIP 1, BIP 2 |

| Status | Meaning |
|--------|---------|
| **Draft** | Work in progress; not yet proposed for acceptance |
| **Proposed** | Under review; may be widely adopted before Final |
| **Final** | Accepted; included in consensus or widely deployed |
| **Active** | Process/document BIPs that are in use (e.g. BIP 1, BIP 2) |
| **Withdrawn / Replaced** | Superseded or abandoned |

Anyone can submit a BIP; see [BIP 2](https://github.com/bitcoin/bips/blob/master/bip-0002.mediawiki) for the process.

---

## Consensus & Protocol BIPs

These BIPs define changes to the Bitcoin consensus rules and protocol.

### BIP 9 - Version Bits with Timeout and Delay

- **Status**: Final
- **Activated**: 2016
- **Description**: Mechanism for deploying soft forks using version bits in block headers. Allows multiple soft forks to be deployed in parallel with defined activation thresholds and timeouts.
- **Key Concepts**: Miners signal readiness by setting bits in block version field. Activation requires 95% of blocks in a retarget period.

### BIP 16 - Pay to Script Hash (P2SH)

- **Status**: Final
- **Activated**: April 1, 2012 (Block 173,805)
- **Description**: Allows transactions to be sent to a script hash instead of a public key hash. The actual script is revealed only when spending.
- **Impact**: Enabled multisig wallets, complex scripts, and reduced transaction sizes for senders.

### BIP 34 - Block v2, Height in Coinbase

- **Status**: Final
- **Activated**: March 2013 (Block 227,931)
- **Description**: Requires block height to be included in coinbase transaction. Ensures all coinbase transactions are unique.
- **Impact**: Fixed duplicate transaction issue, enabled merged mining.

### BIP 65 - OP_CHECKLOCKTIMEVERIFY (CLTV)

- **Status**: Final
- **Activated**: December 2015 (Block 388,381)
- **Description**: Adds an opcode that allows a transaction output to be made unspendable until a specific block height or time.
- **Use Cases**: Payment channels, escrow, time-locked contracts, inheritance planning.

### BIP 66 - Strict DER Signatures

- **Status**: Final
- **Activated**: July 2015 (Block 363,724)
- **Description**: Requires all ECDSA signatures to use strict DER encoding. Fixed signature malleability issues.
- **Impact**: Security improvement, prerequisite for SegWit.

### BIP 68 - Relative Lock-Time Using Consensus-Enforced Sequence Numbers

- **Status**: Final
- **Activated**: July 2016 (Block 419,328)
- **Description**: Enables relative time locks based on the age of the referenced output. Uses the sequence field of transaction inputs.
- **Use Cases**: Lightning Network channels, bidirectional payment channels, revocable transactions.

### BIP 112 - OP_CHECKSEQUENCEVERIFY (CSV)

- **Status**: Final
- **Activated**: July 2016 (Block 419,328)
- **Description**: Companion to BIP 68. Adds an opcode to verify relative lock-times in scripts.
- **Use Cases**: Lightning Network, revocable sequences, hash time-locked contracts (HTLCs).

### BIP 113 - Median Time-Past as Endpoint for Lock-Time Calculations

- **Status**: Final
- **Activated**: July 2016 (Block 419,328)
- **Description**: Uses median time of past 11 blocks instead of block timestamp for time-based lock calculations. Prevents miners from manipulating timestamps.

### BIP 141 - Segregated Witness (SegWit)

- **Status**: Final
- **Activated**: August 24, 2017 (Block 481,824)
- **Description**: Major protocol upgrade that separates signature (witness) data from transaction data. Fixes transaction malleability, increases effective block capacity.
- **Impact**: ~4MB effective block size, enabled Lightning Network, reduced fees for SegWit transactions.

### BIP 143 - Transaction Signature Verification for Version 0 Witness Program

- **Status**: Final
- **Activated**: August 2017 (with SegWit)
- **Description**: Defines how signatures are computed for SegWit transactions. Fixes quadratic hashing problem.
- **Impact**: Improved performance for large transactions, security improvements.

### BIP 144 - Segregated Witness (Peer Services)

- **Status**: Final
- **Activated**: August 2017 (with SegWit)
- **Description**: Defines how SegWit transactions are transmitted over the network. New message types for witness data.

### BIP 340 - Schnorr Signatures for secp256k1

- **Status**: Final
- **Activated**: November 14, 2021 (Block 709,632, with Taproot)
- **Description**: Introduces Schnorr signatures to Bitcoin. More efficient and enables signature aggregation.
- **Benefits**: Smaller signatures, batch verification, key aggregation (MuSig), improved privacy.

### BIP 341 - Taproot: SegWit Version 1 Spending Rules

- **Status**: Final
- **Activated**: November 14, 2021 (Block 709,632)
- **Description**: Major upgrade introducing Taproot outputs. Combines Schnorr signatures with MAST (Merkle Abstract Syntax Trees).
- **Impact**: Better privacy (all transactions look similar), lower fees, more flexible smart contracts.

### BIP 342 - Validation of Taproot Scripts

- **Status**: Final
- **Activated**: November 2021 (with Taproot)
- **Description**: Defines script validation rules for Taproot. Introduces Tapscript with new opcodes and resource limits.

---

## Wallet & Key Management BIPs

These BIPs define standards for wallets, key derivation, and seed phrases.

### BIP 32 - Hierarchical Deterministic Wallets

- **Status**: Final
- **Year**: 2012
- **Description**: Defines HD wallets that generate a tree of keys from a single seed. Allows unlimited key generation and easy backup.
- **Impact**: Foundation for modern wallet architecture. One seed phrase backs up all keys.

### BIP 39 - Mnemonic Code for Generating Deterministic Keys

- **Status**: Proposed (widely adopted)
- **Year**: 2013
- **Description**: Defines the 12/24-word seed phrases used to backup wallets. Maps entropy to human-readable words.
- **Word Lists**: 2048 words in multiple languages. English word list is most common.
- **Security**: 12 words = 128 bits entropy, 24 words = 256 bits entropy.

### BIP 44 - Multi-Account Hierarchy for Deterministic Wallets

- **Status**: Proposed (widely adopted)
- **Year**: 2014
- **Description**: Defines the derivation path structure for HD wallets: `m/purpose'/coin_type'/account'/change/address_index`
- **Path**: `m/44'/0'/0'/0/0` for first Bitcoin address.

### BIP 49 - Derivation Scheme for P2WPKH-nested-in-P2SH Addresses

- **Status**: Final
- **Year**: 2016
- **Description**: Defines derivation paths for wrapped SegWit addresses (starting with `3`).
- **Path**: `m/49'/0'/account'/change/address_index`

### BIP 84 - Derivation Scheme for P2WPKH Based Accounts

- **Status**: Proposed
- **Year**: 2017
- **Description**: Defines derivation paths for native SegWit addresses (starting with `bc1q`).
- **Path**: `m/84'/0'/account'/change/address_index`

### BIP 86 - Key Derivation for Single Key P2TR Outputs

- **Status**: Proposed
- **Year**: 2021
- **Description**: Defines derivation paths for Taproot addresses (starting with `bc1p`).
- **Path**: `m/86'/0'/account'/change/address_index`

### BIP 174 - Partially Signed Bitcoin Transactions (PSBT)

- **Status**: Proposed
- **Year**: 2017
- **Description**: Standard format for unsigned/partially signed transactions. Enables signing across multiple devices/wallets.
- **Use Cases**: Hardware wallets, multisig coordination, air-gapped signing.

### BIP 370 - PSBT Version 2

- **Status**: Proposed
- **Year**: 2021
- **Description**: Improved PSBT format with better support for adding inputs/outputs during signing process.

---

## Address Format BIPs

These BIPs define Bitcoin address formats and encoding.

### BIP 13 - Address Format for pay-to-script-hash

- **Status**: Final
- **Year**: 2012
- **Description**: Defines P2SH address format. Addresses start with `3` on mainnet.

### BIP 173 - Base32 Address Format for Native v0-16 Witness Outputs (Bech32)

- **Status**: Final
- **Year**: 2017
- **Description**: Defines Bech32 encoding for SegWit addresses. Addresses start with `bc1q` on mainnet.
- **Benefits**: Error detection, all lowercase, more efficient QR codes.

### BIP 350 - Bech32m Format for v1+ Witness Addresses

- **Status**: Final
- **Year**: 2020
- **Description**: Modified Bech32 encoding for Taproot and future witness versions. Fixes a mutation weakness in Bech32.
- **Format**: Taproot addresses start with `bc1p`.

---

## Transaction & Script BIPs

### BIP 125 - Opt-in Full Replace-by-Fee Signaling

- **Status**: Proposed
- **Year**: 2015
- **Description**: Allows transactions to signal replaceability. Enables fee bumping by replacing unconfirmed transactions.
- **Signaling**: Set sequence number < 0xFFFFFFFE on any input.

### BIP 152 - Compact Block Relay

- **Status**: Final
- **Year**: 2016
- **Description**: Reduces bandwidth for block propagation. Nodes share short transaction IDs instead of full transactions.
- **Impact**: Faster block propagation, reduced bandwidth by ~90%.

---

## Lightning Network Related BIPs

### BIP 118 - SIGHASH_ANYPREVOUT for Tapscript

- **Status**: Draft
- **Description**: New sighash type that allows signatures to apply to any input with the same script. Enables Eltoo payment channels.
- **Impact**: Would simplify Lightning channel updates, enable channel factories.

---

## Informational BIPs

### BIP 1 - BIP Purpose and Guidelines

- **Status**: Active
- **Year**: 2011
- **Description**: Defines what BIPs are and the process for creating them.

### BIP 2 - BIP Process, Revised

- **Status**: Active
- **Year**: 2016
- **Description**: Updated BIP process with clearer status definitions and workflow.

---

## Complete BIP Categories Reference

| Category | Key BIPs | Purpose |
|----------|----------|---------|
| **Consensus** | 9, 16, 34, 65, 66, 68, 112, 113, 141, 340, 341, 342 | Protocol rules |
| **Wallet** | 32, 39, 44, 49, 84, 86, 174, 370 | Key management |
| **Address** | 13, 173, 350 | Address formats |
| **Transaction** | 125, 152 | Transaction handling |
| **Future** | 118, 119 | Proposed upgrades |

---

## Resources

- **[Official BIP Repository](https://github.com/bitcoin/bips)** - All BIPs on GitHub
- **[BIP 2 - BIP Process](https://github.com/bitcoin/bips/blob/master/bip-0002.mediawiki)** - How to create a BIP
- **[Bitcoin Wiki - BIPs](https://en.bitcoin.it/wiki/Bitcoin_Improvement_Proposals)** - Community documentation

---

## Related Topics

- [Forks](/docs/history/forks) - How BIPs become protocol changes
- [Script System](/docs/bitcoin/script) - Script-related BIPs in action
