# Decentralization

Decentralization is the distribution of control across many independent participants rather than a single central authority. It's the foundation of Bitcoin's [censorship resistance](/docs/glossary#censorship-resistance), resilience, and trustlessness.

## What Decentralization Means

No single entity controls Bitcoin. Control is distributed across thousands of nodes, multiple [mining pools](/docs/glossary#mining-pool), diverse developers, and a global user base. This means:

- **No central authority:** No government, company, or person controls Bitcoin
- **No single point of failure:** The network survives even if parts go offline
- **Open participation:** Anyone can run a node, mine, or contribute to development
- **Consensus-driven changes:** Protocol changes require broad agreement

---

## Why It Matters

Decentralization enables Bitcoin's core properties:

| Property | Centralized System | Decentralized (Bitcoin) |
|----------|-------------------|------------------------|
| **Censorship** | Authority can block transactions and freeze accounts | No one can block your transactions or freeze your funds |
| **Resilience** | Single point of failure; can be shut down | Global network with redundant infrastructure |
| **Trust** | Must trust the central authority | Trust the protocol and code, not people |
| **Control** | Authority controls your money | You control your private keys |

---

## How Bitcoin Achieves Decentralization

### Nodes

Bitcoin has ~15,000-20,000 reachable [full nodes](/docs/glossary#full-node) spread across 100+ countries. Each node independently validates every transaction and stores the complete blockchain. No single node is essential; if one goes offline, the network continues.

### Mining

[Hash rate](/docs/glossary#hash-rate) is distributed across multiple independent mining pools, with the largest typically controlling less than 20% of total hash power. Miners can switch pools freely, preventing any single pool from gaining too much control. Geographic distribution across many countries reduces regulatory risk.

### Development

Bitcoin has multiple implementations (Bitcoin Core, Bitcoin Knots, etc.) and an open development process. Changes go through the [BIP](/docs/glossary#bip-bitcoin-improvement-proposal) (Bitcoin Improvement Proposal) process and require community [consensus](/docs/glossary#consensus). No single developer or team controls the protocol.

---

## The Bitcoin Trilemma

The Bitcoin Trilemma describes the challenge of balancing three critical blockchain properties: **Scalability**, **Security**, and **Decentralization**. Optimizing one typically comes at the cost of another.

### The Three Pillars

| Property | Definition | Bitcoin's Approach |
|----------|------------|-------------------|
| **Scalability** | Ability to process many transactions quickly | ~7 TPS, 1 MB blocks (up to ~4 MB with [SegWit](/docs/glossary#segwit)), 10-min block time |
| **Security** | Resistance to attacks and manipulation | 700+ EH/s hash rate, [proof-of-work](/docs/glossary#pow), economic incentives |
| **Decentralization** | Distribution of control across participants | Thousands of global nodes, open participation, multiple mining pools |

### The Trade-offs

| Trade-off | What Happens | Example |
|-----------|--------------|---------|
| **Scalability ↔ Security** | Larger/faster blocks require more resources → fewer nodes can participate → weaker security | Bitcoin Cash's 32 MB blocks resulted in fewer nodes |
| **Scalability ↔ Decentralization** | Higher hardware requirements → only well-funded entities can run nodes | 100+ MB blocks would exclude most participants |
| **Security ↔ Decentralization** | Higher hash rate requires expensive ASICs → mining power concentrates | ASIC mining improved security but reduced miner diversity |

### Bitcoin's Solution

**Layer 1: Prioritize Security + Decentralization**

Bitcoin intentionally limits base-layer scalability to maintain security and decentralization. The philosophy: the settlement layer should be maximally secure and decentralized.

**Layer 2: Scale on Top**

Scalability is addressed through Layer 2 solutions that inherit base-layer security:

- **[Lightning Network](/docs/glossary#lightning-network):** Off-chain payment channels enabling millions of TPS with low fees
- **Sidechains:** Liquid, Rootstock for specific use cases
- **State/Payment channels:** Direct peer-to-peer transactions

### Historical Examples

| Change | Year | Scalability | Security | Decentralization |
|--------|------|-------------|----------|------------------|
| **Bitcoin Cash** (8→32 MB blocks) | 2017 | ✅ Higher TPS | ⚠️ Lower hash rate | ❌ Fewer nodes |
| **SegWit** (witness data separated) | 2017 | ✅ ~2x capacity | ✅ Maintained | ✅ Soft fork compatible |
| **Lightning Network** | 2018+ | ✅ Millions TPS | ✅ Base layer intact | ✅ Base layer intact |

Bitcoin optimizes for **Security** and **Decentralization**, accepting limited base-layer **Scalability**. This is intentional:

- **Base layer** = Settlement layer (high-value, infrequent transactions)
- **Layer 2** = Payment layer (low-value, frequent transactions)

This separation of concerns provides the benefits of all three properties across the stack.

---

## Threats to Decentralization

| Area | Risk | Mitigation |
|------|------|------------|
| **Mining** | Pool consolidation, geographic concentration, ASIC manufacturer influence | Miners can switch pools; competitive market; global distribution |
| **Nodes** | Growing blockchain size, higher hardware requirements | Pruning, light clients, ongoing optimization |
| **Development** | Single implementation dominance, few core developers | Multiple implementations, open BIP process, fork ability |

---

## Measuring Decentralization

**Quantitative:** Node count, hash rate distribution across pools, geographic spread, implementation diversity.

**Qualitative:** Can transactions be censored? Can the network survive targeted attacks? Can anyone participate without permission?
