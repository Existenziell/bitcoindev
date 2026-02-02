# Forks History

Bitcoin has undergone several protocol upgrades through both soft forks and hard forks. This document provides a table of all major forks in Bitcoin's history.

## Understanding Forks

The fundamental difference between soft forks and hard forks comes down to one thing: **are the [consensus rules](/docs/glossary#consensus-rules) being tightened or loosened?**

| | Soft Fork | Hard Fork |
|---|-----------|-----------|
| **Consensus rules** | Tightened (more restrictive) | Loosened (more permissive) |
| **Old nodes** | Accept new blocks (still valid under old rules) | Reject new blocks (invalid under old rules) |
| **Backward compatible** | Yes | No |
| **Chain split risk** | Possible if contentious | Guaranteed without full upgrade |

### Soft Fork
A **soft fork** **tightens** the consensus rules. Blocks valid under new rules are always valid under old rules, so old nodes continue to accept them.

**Example**: [SegWit](/docs/glossary#segwit) made certain transaction formats invalid that were previously valid. Old nodes still accept SegWit blocks because they don't violate the old (looser) rules.

**Can soft forks cause chain splits?** Yes, in certain scenarios:
- **UASF (User Activated Soft Fork)**: If nodes enforce rules that miners don't follow, the chain can split. The 2017 BIP 148 UASF threatened a split if miners didn't signal for SegWit.
- **Miner non-compliance**: If significant mining power produces blocks violating new soft fork rules, upgraded nodes reject those blocks, potentially causing a split.
- **Contentious activation**: When there's community disagreement about whether to activate.

### Hard Fork
A **hard fork** **loosens** the consensus rules (or changes them incompatibly). Blocks valid under new rules may be invalid under old rules, so old nodes reject them.

**Example**: Bitcoin Cash increased the [block size](/docs/glossary#block-size) limit from 1 MB to 8 MB. Old nodes reject these larger blocks as invalid, guaranteeing a chain split.

```mermaid
flowchart LR
  subgraph SoftFork [Soft fork]
    A1[Old block]
    A2[New block valid under both]
    A1 --> A2
  end
  subgraph HardFork [Hard fork]
    B1[Old chain]
    B2[Chain A]
    B3[Chain B]
    B1 --> B2
    B1 --> B3
  end
```

---

## Complete Fork History Table

| Date | Block Height | Type | Name | BIP(s) | Description | Status |
|------|--------------|------|------|--------|-------------|--------|
| **2009-01-03** | 0 | - | Genesis Block | - | Bitcoin network launch | Active |
| **2010-08-15** | 74,638 | Hard Fork | Value Overflow Incident | - | Fixed integer overflow bug | Resolved |
| **2012-04-01** | 173,805 | Soft Fork | P2SH (Pay-to-Script-Hash) | [BIP 16](https://github.com/bitcoin/bips/blob/master/bip-0016.mediawiki) | Enabled complex scripts via script hashes | Active |
| **2013-03-11** | 225,430 | Accidental | BerkeleyDB Fork | - | Database lock limit caused chain split | Resolved |
| **2013-03-12** | 225,430 | Soft Fork | Strict DER Encoding | [BIP 66](https://github.com/bitcoin/bips/blob/master/bip-0066.mediawiki) | Required strict DER signature encoding | Active |
| **2013-05-15** | 250,000 | Soft Fork | Strict Multisig | [BIP 65](https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki) | Required NULLDUMMY in multisig | Active |
| **2015-12-08** | 388,381 | Soft Fork | CLTV (CheckLockTimeVerify) | [BIP 65](https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki) | Enabled absolute time locks | Active |
| **2016-07-04** | 419,328 | Soft Fork | CSV (CheckSequenceVerify) | [BIP 112](https://github.com/bitcoin/bips/blob/master/bip-0112.mediawiki), [BIP 68](https://github.com/bitcoin/bips/blob/master/bip-0068.mediawiki), [BIP 113](https://github.com/bitcoin/bips/blob/master/bip-0113.mediawiki) | Enabled relative time locks | Active |
| **2017-08-01** | 478,558 | Hard Fork | Bitcoin Cash | - | Increased block size to 8 MB | Split Chain |
| **2017-08-24** | 481,824 | Soft Fork | Segregated Witness (SegWit) | [BIP 141](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki), [BIP 143](https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki), [BIP 144](https://github.com/bitcoin/bips/blob/master/bip-0144.mediawiki), [BIP 148](https://github.com/bitcoin/bips/blob/master/bip-0148.mediawiki) | Separated witness data, fixed malleability | Active |
| **2018-11-15** | 556,766 | Hard Fork | Bitcoin SV | - | Bitcoin Cash fork, increased to 128 MB blocks | Split Chain |
| **2021-11-14** | 709,632 | Soft Fork | Taproot | [BIP 341](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki), [BIP 342](https://github.com/bitcoin/bips/blob/master/bip-0342.mediawiki), [BIP 340](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki) | Schnorr signatures, improved privacy | Active |

---

## Activation Mechanisms

### Soft Fork Activation Methods

1. **BIP 9 (Version Bits)**
   - Used for: CSV, SegWit, Taproot
   - Requires: 95% of blocks signal support
   - Grace period: 2016 blocks (~2 weeks)
   - Example: Taproot activated via BIP 9

2. **IsSuperMajority (Legacy)**
   - Used for: P2SH, CLTV
   - Requires: 75% of last 1000 blocks
   - Example: P2SH activated via IsSuperMajority

3. **User-Activated Soft Fork (UASF)**
   - Used for: SegWit (BIP 148)
   - Community-driven activation
   - Example: SegWit UASF movement

### Hard Fork Activation

Hard forks typically require:
- All nodes to upgrade simultaneously
- Or acceptance of chain split
- Coordination among miners and nodes

---

## Fork Statistics

### Soft Fork Adoption

| Fork | Activation Date | Current Usage | Adoption Rate |
|------|----------------|--------------|---------------|
| P2SH | 2012-04-01 | Multisig, complex scripts | ~15-20% of transactions |
| CLTV | 2015-12-08 | Time locks, escrow | ~1-2% of transactions |
| CSV | 2016-07-04 | Lightning Network | Critical for LN |
| SegWit | 2017-08-24 | Most transactions | ~80% of transactions |
| Taproot | 2021-11-14 | Modern wallets | ~5-10% of transactions |

### Hard Fork Results

| Fork | Original Chain | New Chain | Current Status |
|------|----------------|-----------|----------------|
| Bitcoin Cash | Bitcoin (BTC) | Bitcoin Cash (BCH) | Both chains active |
| Bitcoin SV | Bitcoin Cash (BCH) | Bitcoin SV (BSV) | Both chains active |

---

## Timeline Visualization

```
2009 ──────────────────────────────────────────────────────────────
     │ Genesis Block
     │
2010 ──────────────────────────────────────────────────────────────
     │ Value Overflow Fix (Hard Fork)
     │
2012 ──────────────────────────────────────────────────────────────
     │ P2SH (Soft Fork)
     │
2013 ──────────────────────────────────────────────────────────────
     │ BerkeleyDB Fork (Accidental)
     │ Strict DER, Strict Multisig (Soft Forks)
     │
2015 ──────────────────────────────────────────────────────────────
     │ CLTV (Soft Fork)
     │
2016 ──────────────────────────────────────────────────────────────
     │ CSV (Soft Fork)
     │
2017 ──────────────────────────────────────────────────────────────
     │ Bitcoin Cash (Hard Fork) ──► BCH
     │ SegWit (Soft Fork)
     │
2018 ──────────────────────────────────────────────────────────────
     │ Bitcoin SV (Hard Fork) ──► BSV
     │
2021 ──────────────────────────────────────────────────────────────
     │ Taproot (Soft Fork)
     │
2024+ ──────────────────────────────────────────────────────────────
     │ Future upgrades...
```

---

## Key Takeaways

1. **Soft Forks are Preferred**: All major protocol upgrades since 2012 have been soft forks
2. **Backward Compatibility**: Soft forks maintain backward compatibility with old nodes
3. **Chain Splits**: Hard forks always create splits; soft forks can also split the chain if contentious (e.g., via UASF)
4. **Activation Methods**: Different activation mechanisms (BIP 9, IsSuperMajority, UASF) with varying risks
5. **Gradual Adoption**: New features take time to reach full adoption

---

## Potential Future Soft Forks

- **Covenants**: Restrict how coins can be spent
- **OP_CTV (CheckTemplateVerify)**: Transaction templates
- **SIGHASH_ANYPREVOUT**: More flexible signature types
- **Ephemeral Anchors**: Lightning Network improvements

For more details on script types and their evolution, see [Script System](/docs/bitcoin/script).

---

## References

- [Bitcoin BIPs Repository](https://github.com/bitcoin/bips)
- [Bitcoin Core Release Notes](https://bitcoincore.org/en/releases/)
- [Bitcoin Wiki - Forks](https://en.bitcoin.it/wiki/Forks)
- [UASF (User-Activated Soft Fork) History](https://en.bitcoin.it/wiki/UASF)
