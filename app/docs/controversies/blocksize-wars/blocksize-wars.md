# The Blocksize Wars

The Blocksize Wars (2015-2017) were a period of intense debate and conflict within the Bitcoin community over whether to increase Bitcoin's block size limit. This controversy ultimately led to the hard fork that created Bitcoin Cash and fundamentally shaped Bitcoin's development philosophy.

## The Core Issue

### The Problem

Bitcoin's block size was limited to **1 MB** (set by Satoshi Nakamoto in 2010). As Bitcoin adoption grew, this limit became a bottleneck:

- **Transaction Backlog**: Transactions waiting hours or days for confirmation
- **Rising Fees**: Fees increased as users competed for limited block space
- **Scalability Concerns**: Could Bitcoin handle global adoption with 1 MB blocks?

### The Question

**Should Bitcoin increase its block size limit?**

This seemingly simple question divided the community into two camps with fundamentally different visions for Bitcoin's future.

---

## The Two Sides

| Aspect | Big Blockers | Small Blockers |
|--------|---------------|----------------|
| **Core belief** | Scale on-chain; increase block size to handle more transactions | Scale off-chain; keep blocks small to preserve decentralization |
| **Approach** | More transactions per block, lower fees; keep all transactions on main chain | Layer 2 (e.g. Lightning), SegWit; maintain low node operation costs |
| **Proposals** | 2 MB, 8 MB, 32 MB, or no limit; let market decide | Keep 1 MB limit; SegWit; Lightning Network; optimize transaction efficiency |
| **Key advocates** | Bitcoin XT, Bitcoin Classic, Bitcoin Unlimited, Bitcoin Cash | Bitcoin Core developers, most node operators, decentralization-focused community |

**Key advocate projects (big blockers):** Bitcoin XT (2 MB), Bitcoin Classic (2 MB), Bitcoin Unlimited (removable limit), Bitcoin Cash (8 MB, later 32 MB).

---

## Timeline of Events

The following table summarizes the main events. The resolution was SegWit activation only; the planned 2 MB hard fork (SegWit2x) was abandoned.

| Year | Event | Summary |
|------|-------|---------|
| 2010 | 1 MB limit | Satoshi sets limit (spam protection; intended temporary). Blocks were mostly empty. |
| Aug 2015 | Bitcoin XT | 2 MB → 8 MB proposal, 75% miner support; rejected by community. |
| Dec 2015 | Hong Kong | "Scaling II" conference; miners and developers seek compromise. |
| Jan 2016 | Bitcoin Classic | 2 MB proposal; some miner support; eventually abandoned. |
| Mar 2016 | Bitcoin Unlimited | Removable limit, miner vote ("emergent consensus"); ~30–40% support. |
| May 2017 | New York Agreement (NYA) | ~50+ companies: SegWit first, then 2 MB hard fork (SegWit2x). Unlocked miner signalling. |
| Aug 1, 2017 | UASF / BIP 148 | User-activated soft fork; nodes reject non-SegWit blocks; shifted leverage to users/nodes. BIP 91 helped avoid chain split. |
| Aug 2017 | SegWit | Soft fork activates; ~2 MB effective capacity; fixed malleability; enabled Lightning. |
| Aug 1, 2017 | Bitcoin Cash | Hard fork; 8 MB blocks; permanent chain split. |
| Nov 2017 | SegWit2x | Planned 2 MB hard fork abandoned; many NYA signatories withdrew. |

---

## Key Arguments

### Arguments for Bigger Blocks

| Argument | Key points |
|----------|------------|
| **On-chain scaling** | More transactions per block = lower fees; simpler than Layer 2; users want on-chain transactions. |
| **User experience** | Faster confirmations, lower fees, better for everyday payments. |
| **Technical feasibility** | Storage is cheap; bandwidth has improved; modern hardware can handle larger blocks. |
| **Satoshi's vision** | Satoshi mentioned increasing block size; limit was meant to be temporary; should adapt to demand. |

### Arguments for Small Blocks

| Argument | Key points |
|----------|------------|
| **Decentralization** | Larger blocks = higher node costs; fewer full nodes; centralization risk. |
| **Network security** | Slower block propagation; more orphan blocks; weaker network security. |
| **Off-chain scaling** | Lightning can handle millions of transactions; on-chain for settlement, off-chain for payments. |
| **Economic security** | Higher fees = better security; miners need fees after halvings; fee market matters. |

---

## Technical Details

### Block Size Limits

| Chain | Limit | Notes |
|-------|-------|-------|
| **Bitcoin (BTC)** | 4,000,000 weight units (weight-based) | Original 1 MB byte cap superseded by SegWit; effective capacity up to ~3.4 MB. |
| **Bitcoin Cash (BCH)** | 8 MB (start), 32 MB (current) | Plans for larger blocks. |

### SegWit Solution

Segregated Witness (SegWit) was the compromise solution: **soft fork** (backward compatible); **witness data** moved outside base block; **effective capacity** typical ~1.6–2.25 MB, max ~3.4 MB; **transaction malleability** fixed; **Lightning Network** enabled.

### Network Metrics (2024)

| Metric | Bitcoin (BTC) | Bitcoin Cash (BCH) |
|--------|----------------|---------------------|
| **Block size** | ~1.6–2.25 MB avg (SegWit); max ~3.4 MB | ~100–500 KB avg |
| **Outputs / tx per block** | Up to ~32,000 outputs (4M WU limit; depends on output types) | ~500–2,000 tx/block |
| **Average fee** | Variable ($1–50+) | Very low (<$0.01) |
| **Full nodes** | ~25,000 listening; ~69,000 total ([node map](https://newhedge.io/bitcoin/node-map)). Non-listening nodes relay the same but don't bootstrap. | Smaller network |

---

## The Outcome

| Aspect | Bitcoin (BTC) | Bitcoin Cash (BCH) |
|--------|----------------|---------------------|
| **Scaling approach** | Weight-based limit (4M WU) via SegWit; no hard fork to larger byte cap; Lightning Network | On-chain; 8 MB → 32 MB blocks; separate chain |
| **Results** | SegWit implemented; LN developed; decentralization preserved | Separate blockchain; smaller network and ecosystem |
| **Current status** | ~80% SegWit; LN growing; variable but manageable fees; strong decentralization | Separate cryptocurrency; lower market cap; smaller community; markets low on-chain fees (Lightning often lower for users) |

---

## Lessons Learned

### 1. Hard Forks Are Risky
- Created permanent chain split
- Divided community and resources
- Both chains continue separately

### 2. Soft Forks Preferred
- SegWit was a soft fork (backward compatible)
- No chain split; no forced upgrade
- Whether larger blocks would have led to faster adoption is unsupported—larger blocks could instead have meant more low-value or spam usage

### 3. Decentralization Matters
- Small block supporters prioritized decentralization
- This has proven important for Bitcoin's security
- Node count remains high

### 4. Scaling Solutions Evolve
- Lightning Network emerged as solution
- Multiple approaches can coexist
- Innovation continues

---

## Impact on Bitcoin

| Type | Points |
|------|--------|
| **Positive** | Clarified vision: Bitcoin's focus on decentralization reinforced. SegWit activation enabled Lightning and other innovations. Core developers and community aligned. Layer 2 solutions developed. |
| **Negative** | Minority split (small group forked; majority stayed on Bitcoin). Brand confusion (many coins use Bitcoin-related names). Delayed scaling: took years to resolve. |

---

## Related Topics

- [OP_RETURN Debate](/philosophy/controversies/op-return) - Another major Bitcoin controversy
- [History: Forks](/philosophy/history/forks) - Complete fork history including Bitcoin Cash
- [Lightning Network](/docs/lightning) - The scaling solution that emerged
