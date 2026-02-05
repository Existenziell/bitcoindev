# Attacks on Bitcoin

Bitcoin has faced protocol bugs, exchange hacks, and constant pressure from attackers. This page lists significant **attack-related events**: incidents that targeted the protocol or services holding Bitcoin. The important distinction: the **Bitcoin protocol** has never been successfully broken: no inflation, no stolen coins via consensus failure. Attacks that have succeeded targeted **custody** (exchanges, hot wallets), not the network or its rules.

For the theory behind mining and network attacks, see [Mining Attacks](/docs/mining/attacks) and [Network Attacks & Security](/docs/mining/network-attacks).

---

## Protocol and Consensus

These events involved bugs or stress on the Bitcoin protocol itself. In each case the issue was identified, fixed, and no permanent inflation or consensus theft occurred on mainnet.

### Value Overflow Bug (August 15, 2010)

- **Block**: 74,638
- **What happened**: An integer overflow in output validation allowed a single transaction to create 184 billion BTC. The invalid transaction was mined and briefly accepted.
- **Response**: The network coordinated a [hard fork](/docs/history/forks) to tighten validation rules; the invalid transaction was removed from the chain. One of the most serious early protocol bugs; the response showed the community could coordinate a timely fix.

### BerkeleyDB Chain Split (March 11-12, 2013)

- **Block**: 225,430
- **What happened**: An accidental chain split occurred when older nodes (Bitcoin Core 0.7) hit a database lock limit and rejected blocks that newer nodes (0.8) accepted. Different parts of the network temporarily followed different chains.
- **Response**: Resolved within hours as nodes upgraded. No theft; consensus was restored. Documented in the [fork history](/docs/history/forks) as the "BerkeleyDB Fork."

### CVE-2018-17144 (Inflation Bug) (September 2018)

- **Affected**: Bitcoin Core 0.14.0 through 0.16.2
- **What happened**: A critical bug allowed creation of extra coins in a specific double-spend scenario (duplicate inputs in a transaction). A malicious miner could have exploited it to inflate the supply.
- **Response**: Fixed in Bitcoin Core 0.16.3. Disclosed responsibly; no known exploitation on mainnet. The incident demonstrated how serious protocol bugs are handled: fix, release, and upgrade.

---

## Exchange and Custody

These events were attacks on **services** holding Bitcoin (exchanges, hot wallets), not on the Bitcoin protocol. The network continued to operate; losses were due to custodial failure, reinforcing "not your keys, not your coins."

### Mt. Gox First Hack (2011)

- **What happened**: Approximately 25,000 BTC were stolen from Mt. Gox. The incident was not widely disclosed at the time.
- **Context**: This was an early warning sign before the [Mt. Gox collapse](/docs/controversies/mt-gox) in 2014.

### Mt. Gox Collapse (February 2014)

- **What happened**: Mt. Gox, then the world's largest Bitcoin exchange, suspended withdrawals and declared bankruptcy. Approximately 850,000 BTC were lost to theft and operational failures (customer funds and exchange reserves).
- **Impact**: The collapse entrenched "not your keys, not your coins" as a core lesson. See the full account: [Mt. Gox](/docs/controversies/mt-gox).

### Bitfinex Hack (August 2016)

- **What happened**: Approximately 119,756 BTC were stolen from Bitfinex hot wallets in a breach of the exchange's multi-sig setup. One of the largest exchange hacks by volume.
- **Aftermath**: The exchange introduced a recovery token (BFX) and over time partially compensated affected users. The Bitcoin network itself was never compromised.

---

## Resilience

The protocol has resisted attacks that could have broken consensus or stolen coins on-chain:

- **No successful 51% or double-spend on mainnet**: There is no documented case of a chain reorg used to steal funds on Bitcoin mainnet. Waiting for confirmations and the economic cost of attacking make such attacks irrational. See [Mining Attacks](/docs/mining/attacks) for the theory and probabilities.
- **No successful large-scale network attack**: Eclipse, Sybil, and other P2P attacks are understood and mitigated by design; see [Network Attacks & Security](/docs/mining/network-attacks) for how nodes defend against them.

Every major protocol bug has been fixed; every custody failure has underscored the importance of self-custody and sound security. Bitcoin's design (decentralized, open, and incentive-aligned) has so far kept the network secure.
