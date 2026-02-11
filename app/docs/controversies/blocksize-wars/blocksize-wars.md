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

### Big Blockers

**Core Belief:**
- Bitcoin should scale on-chain
- Increase block size to handle more transactions
- Keep all transactions on the main chain
- Lower fees through increased capacity

**Proposed Solutions:**
- Increase to 2 MB, 8 MB, or even 32 MB blocks
- Remove block size limit entirely
- Let the market decide optimal block size

**Key Advocates:**
- Bitcoin XT (2 MB proposal)
- Bitcoin Classic (2 MB proposal)
- Bitcoin Unlimited (removable limit)
- Bitcoin Cash (8 MB, later increased)

### Small Blockers

**Core Belief:**
- Bitcoin should scale off-chain
- Keep blocks small to preserve decentralization
- Use Layer 2 solutions (Lightning Network)
- Maintain low node operation costs

**Proposed Solutions:**
- Keep 1 MB limit
- Implement Segregated Witness (SegWit)
- Build Lightning Network for scaling
- Optimize transaction efficiency

**Key Advocates:**
- Bitcoin Core developers
- Most node operators
- Decentralization-focused community

---

## Timeline of Events

### 2010: The 1 MB Limit

- **Satoshi Nakamoto** sets 1 MB block size limit
- Initially a spam protection measure
- Blocks were mostly empty at the time
- Limit was meant to be temporary

### 2015: Early Proposals

**Bitcoin XT (August 2015)**
- Proposed increasing to 2 MB, then 8 MB
- Required 75% miner support
- Controversial hard fork proposal
- Rejected by community

**Bitcoin Classic (January 2016)**
- Proposed 2 MB block size increase
- Simpler proposal than XT
- Gained some miner support
- Eventually abandoned

### 2016: Bitcoin Unlimited

**Bitcoin Unlimited (March 2016)**
- Proposed removing block size limit entirely
- Let miners vote on block size
- "Emergent consensus" mechanism
- Gained significant miner support (~30-40%)

### 2017: The Resolution

**SegWit Activation (August 2017)**
- Segregated Witness soft fork activated
- Increased effective block capacity to ~2 MB
- Fixed transaction malleability
- Enabled Lightning Network

**Bitcoin Cash Hard Fork (August 1, 2017)**
- Big blockers created Bitcoin Cash (BCH)
- 8 MB block size limit
- Separate blockchain from Bitcoin
- Permanent chain split

---

## Key Arguments

### Arguments for Bigger Blocks

1. **On-Chain Scaling**
   - More transactions per block = lower fees
   - Simpler solution (no complex Layer 2)
   - Users want on-chain transactions

2. **User Experience**
   - Faster confirmations
   - Lower fees
   - Better for everyday payments

3. **Technical Feasibility**
   - Storage is cheap
   - Bandwidth has improved
   - Modern hardware can handle larger blocks

4. **Satoshi's Vision**
   - Satoshi mentioned increasing block size
   - Was meant to be temporary limit
   - Should adapt to demand

### Arguments for Small Blocks

1. **Decentralization**
   - Larger blocks = higher node operation costs
   - Fewer people can run full nodes
   - Centralization risk

2. **Network Security**
   - Slower block propagation with larger blocks
   - More orphan blocks
   - Weaker network security

3. **Off-Chain Scaling**
   - Lightning Network can handle millions of transactions
   - On-chain for settlement, off-chain for payments
   - Better long-term solution

4. **Economic Security**
   - Higher fees = better security
   - Miners need fees after halvings
   - Fee market is important

---

## Technical Details

### Block Size Limits

**Bitcoin (BTC):**
- Block limit is weight-based (4,000,000 weight units), not a byte cap. The original 1 MB limit was superseded by SegWit; effective capacity up to ~3.4 MB.

**Bitcoin Cash (BCH):**
- Started: 8 MB
- Current: 32 MB
- Plans for even larger blocks

### SegWit Solution

Segregated Witness (SegWit) was the compromise solution:

- **Soft Fork**: Backward compatible
- **Witness Data**: Moved outside base block
- **Effective Capacity**: typical blocks ~1.6-2.25 MB; max up to ~3.4 MB (4M weight units)
- **Transaction Malleability**: Fixed
- **Lightning Network**: Enabled

### Network Metrics

**Bitcoin (BTC) - 2024:**
- Average block size: ~1.6-2.25 MB (with SegWit); max block size up to ~3.4 MB
- Outputs per block: more meaningful than transaction count (batching varies); on-chain limit up to ~32,000 outputs per block (4M weight unit limit; exact number depends on output types)
- Average fee: Variable ($1-50+)
- Full node count: ~25,000 listening (reachable) nodes; ~69,000 total full nodes globally ([node map](https://newhedge.io/bitcoin/node-map)). Public crawls (e.g. Bitnodes) only count listening nodes; non-listening nodes relay blocks and transactions the same but cannot be used to bootstrap new nodes.

**Bitcoin Cash (BCH) - 2024:**
- Average block size: ~100-500 KB
- Transactions per block: ~500-2,000
- Average fee: Very low (<$0.01)

---

## The Outcome

### Bitcoin (BTC) Won

**Results:**
- Replaced the fixed 1 MB byte limit with a weight-based limit (4M WU) via SegWit; no hard fork to a larger byte cap
- Implemented SegWit for scaling
- Lightning Network developed
- Focus on decentralization preserved

**Current Status:**
- ~80% of transactions use SegWit
- Lightning Network growing
- Fees remain variable but manageable
- Strong decentralization

### Bitcoin Cash (BCH) Split

**Results:**
- Created separate blockchain
- 8 MB blocks (later increased to 32 MB)
- Smaller network and ecosystem

**Current Status:**
- Separate cryptocurrency
- Lower market cap than Bitcoin
- Different development path
- Still active but smaller community
- Markets itself on low on-chain fees; in practice, fees in Bitcoin payment channels (e.g. Lightning) are often lower for users

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

### Positive Outcomes

1. **Clarified Vision**: Bitcoin's focus on decentralization was reinforced
2. **SegWit Activation**: Enabled Lightning Network and other innovations
3. **Community Cohesion**: Core developers and community aligned
4. **Innovation**: Led to development of Layer 2 solutions

### Negative Outcomes

1. **Minority split**: A small group forked off; the overwhelming majority of users and developers stayed on Bitcoin.
3. **Brand confusion**: Many coins use Bitcoin-related names (not only BCH); the fork added to existing naming confusion.
4. **Delayed Scaling**: Took years to resolve

---

## Current Status

### Bitcoin (BTC)
- **Block Size**: Weight-based limit (4M WU); typical ~1.6-2.25 MB, max ~3.4 MB
- **Scaling**: Lightning Network + SegWit
- **Philosophy**: Decentralization first
- **Status**: Dominant Bitcoin implementation

### Bitcoin Cash (BCH)
- **Block Size**: 32 MB
- **Scaling**: On-chain only
- **Philosophy**: Big blocks, low on-chain fees (Lightning on Bitcoin often yields lower fees)
- **Status**: Separate cryptocurrency

---

## Related Topics

- [OP_RETURN Debate](/philosophy/controversies/op-return) - Another major Bitcoin controversy
- [History: Forks](/philosophy/history/forks) - Complete fork history including Bitcoin Cash
- [Lightning Network](/docs/lightning) - The scaling solution that emerged
