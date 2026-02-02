# The Blocksize Wars

The Blocksize Wars (2015-2017) were a period of intense debate and conflict within the Bitcoin community over whether to increase Bitcoin's [block size](/docs/glossary#block-size) limit. This controversy ultimately led to the [hard fork](/docs/glossary#hard-fork) that created Bitcoin Cash and fundamentally shaped Bitcoin's development philosophy.

## The Core Issue

### The Problem

Bitcoin's block size was limited to **1 MB** (set by Satoshi Nakamoto in 2010). As Bitcoin adoption grew, this limit became a bottleneck:

- **Transaction Backlog**: Transactions waiting hours or days for [confirmation](/docs/glossary#confirmation)
- **Rising Fees**: [Fees](/docs/glossary#transaction-fee) increased as users competed for limited block space
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
- Implement [Segregated Witness (SegWit)](/docs/glossary#segwit)
- Build [Lightning Network](/docs/glossary#lightning-network) for scaling
- Optimize transaction efficiency

**Key Advocates:**
- Bitcoin Core developers
- Most node operators
- [Decentralization](/docs/glossary#decentralization)-focused community

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
- Segregated Witness [soft fork](/docs/glossary#soft-fork) activated
- Increased effective block capacity to ~2 MB
- Fixed [transaction malleability](/docs/glossary#transaction-malleability)
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
   - Fewer people can run [full nodes](/docs/glossary#full-node)
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
   - Miners need fees after [halvings](/docs/glossary#halving)
   - Fee market is important

---

## Technical Details

### Block Size Limits

**Bitcoin (BTC):**
- Base block size: 1 MB
- With SegWit: ~2-4 MB effective capacity
- Weight limit: 4,000,000 [weight units](/docs/glossary#weight-units)

**Bitcoin Cash (BCH):**
- Started: 8 MB
- Current: 32 MB
- Plans for even larger blocks

### SegWit Solution

Segregated Witness (SegWit) was the compromise solution:

- **Soft Fork**: Backward compatible
- **Witness Data**: Moved outside base block
- **Effective Capacity**: ~2 MB (up to 4 MB with witness)
- **Transaction Malleability**: Fixed
- **Lightning Network**: Enabled

### Network Metrics

**Bitcoin (BTC) - 2024:**
- Average block size: ~1.5-2 MB (with SegWit)
- Transactions per block: ~2,000-3,000
- Average fee: Variable ($1-50+)
- Full node count: ~15,000-20,000

**Bitcoin Cash (BCH) - 2024:**
- Average block size: ~100-500 KB
- Transactions per block: ~500-2,000
- Average fee: Very low (<$0.01)
- Full node count: ~1,000-2,000

---

## The Outcome

### Bitcoin (BTC) Won

**Results:**
- Maintained 1 MB base block size
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
- Lower fees but less decentralization
- Smaller network and ecosystem

**Current Status:**
- Separate cryptocurrency
- Lower market cap than Bitcoin
- Different development path
- Still active but smaller community

---

## Lessons Learned

### 1. Hard Forks Are Risky
- Created permanent chain split
- Divided community and resources
- Both chains continue separately

### 2. Soft Forks Preferred
- SegWit was a soft fork (backward compatible)
- No chain split
- Gradual adoption

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

1. **Community Division**: Deep split that still exists
2. **Resources Split**: Development resources divided
3. **Confusion**: Users confused about different Bitcoin versions
4. **Delayed Scaling**: Took years to resolve

---

## Current Status

### Bitcoin (BTC)
- **Block Size**: 1 MB base, ~2-4 MB with SegWit
- **Scaling**: Lightning Network + SegWit
- **Philosophy**: Decentralization first
- **Status**: Dominant Bitcoin implementation

### Bitcoin Cash (BCH)
- **Block Size**: 32 MB
- **Scaling**: On-chain only
- **Philosophy**: Big blocks, low fees
- **Status**: Separate cryptocurrency

---

## Related Topics

- [OP_RETURN Debate](/docs/controversies/op-return) - Another major Bitcoin controversy
- [History: Forks](/docs/history/forks) - Complete fork history including Bitcoin Cash
- [Lightning Network](/docs/lightning) - The scaling solution that emerged
