# What Problems Did Bitcoin Solve?

Bitcoin addresses fundamental challenges in digital currency and distributed systems that had prevented previous attempts at decentralized money.

## The Core Challenges

Before Bitcoin, decentralized digital currency faced seemingly insurmountable problems:

- **No central authority:** Traditional systems rely on banks/servers to coordinate
- **Network unreliability:** Nodes fail, messages get lost, partitions occur
- **Byzantine failures:** Some participants may be malicious or send conflicting information
- **Timing:** No synchronized clocks or central time source to order events (see [Bitcoin as Timechain](/docs/fundamentals/timechain) for how this is solved)

| Problem | Traditional approach | Bitcoin |
|---------|----------------------|--------|
| Double-spend | Central authority (bank) verifies | Public blockchain; PoW; longest chain; first spend wins |
| Byzantine / agreement | Trusted coordinator | Nakamoto consensus; economic incentives |
| Timing / ordering | Central time source | Proof-of-work; block sequence as time |

```mermaid
flowchart LR
  Problem[Double-spend / Byzantine]
  BitcoinSol[Bitcoin solution]
  PoW[Proof-of-Work]
  Chain[Longest chain]
  Problem --> BitcoinSol --> PoW --> Chain
```

---

## The Double-Spending Problem

Double-spending occurs when the same digital currency unit is spent more than once. Unlike physical cash, digital information can be perfectly copied; without protection, the same coin could be sent to multiple recipients simultaneously, destroying the currency's value.

**Traditional solution:** A central authority (bank) maintains the ledger and verifies each transaction. Problem: requires trust in that authority.

**Bitcoin's solution:** A public blockchain where all transactions are visible, ordered into blocks, and secured by [proof-of-work](/docs/glossary#pow). Nodes independently verify that inputs haven't been spent. The longest chain determines valid transactions, so only the first spend succeeds.

```
Alice has 1 BTC, attempts to send it to both Bob and Charlie:
→ Network includes first transaction in block N
→ Second transaction rejected (input already spent)
→ Result: Only one transaction succeeds
```

:::video-group
[Video: How Satoshi Nakamoto Solved The Double Spending Problem](https://www.youtube.com/watch?v=yBwDGby1yZA)
[Video: Double-Spending Problem Explained by a Developer](https://www.youtube.com/watch?v=jtc3_Gw39Ps?t=39)
:::

---

## The Two Generals Problem

A classic distributed systems problem that demonstrates the impossibility of achieving perfect agreement over an unreliable communication channel.

### The Scenario

Two armies, led by two generals, are positioned on opposite sides of an enemy city. They must coordinate a simultaneous attack to succeed. The only way to communicate is by sending messengers through enemy territory, where they may be captured or killed.

**The dilemma:**
- General A sends a message: "Attack at dawn"
- General B receives it and sends back: "Acknowledged, attacking at dawn"
- General A receives the acknowledgment, but thinks: "How do I know General B received my acknowledgment of their acknowledgment?"
- This creates infinite regress: each confirmation requires its own confirmation

### Why It's Theoretically Unsolvable

In a system with unreliable communication, perfect certainty is mathematically impossible. No matter how many confirmations are exchanged, there's always a non-zero probability that the last message was lost, leaving one general uncertain about whether coordination was achieved.

### Bitcoin's Solution

Bitcoin sidesteps the impossibility by accepting **probabilistic finality** instead of perfect certainty:

1. **Proof-of-work creates objective ordering:** Blocks are ordered by computational work, not by message acknowledgments
2. **The longest chain rule:** The network naturally converges on a single history through economic incentives
3. **Increasing certainty over time:** Each block added makes the previous blocks exponentially harder to reverse
4. **Practical finality:** While theoretically reversible, 6 confirmations (about 1 hour) is considered effectively irreversible due to the enormous computational cost required

This is fundamentally different from trying to achieve perfect certainty through message acknowledgments; Bitcoin uses economic and cryptographic mechanisms to create convergence without requiring perfect communication.

### Two Generals vs. Byzantine Generals

These are often confused but address different problems:

| Aspect | Two Generals Problem | Byzantine Generals Problem |
|--------|---------------------|---------------------------|
| **Core Issue** | Unreliable communication (messages may be lost) | Malicious actors (messages may be corrupted or conflicting) |
| **Assumption** | All parties are honest but communication is unreliable | Some parties may be malicious and send false information |
| **Focus** | Achieving agreement despite message loss | Achieving agreement despite malicious behavior |
| **Bitcoin's Approach** | Probabilistic finality through proof-of-work | Economic security (assumes <50% malicious hash rate) |

**In summary:** The Two Generals Problem is about **unreliable channels**, while the Byzantine Generals Problem is about **unreliable participants**. Bitcoin addresses both: proof-of-work handles unreliable communication through probabilistic finality, while the longest-chain rule and economic incentives handle potentially malicious miners.

:::video-group
[Video: The Byzantine Generals problem, and why it matters for Bitcoin](https://www.youtube.com/watch?v=Bvj72wN0OVk)
[Video: The Byzantine Generals Problem](https://www.youtube.com/watch?v=fyf-MCz0Qoo)
:::

---

## Other Problems Solved

| Problem | Traditional Issue | Bitcoin's Solution |
|---------|------------------|-------------------|
| **Byzantine Generals** | Malicious nodes send conflicting information | Proof-of-work makes attacks expensive; assumes <50% malicious hash rate |
| **Trust in Third Parties** | Must trust banks, payment processors, governments | Cryptographic proof replaces institutional trust; no intermediaries |
| **Inflation** | Central banks can print unlimited money | Fixed 21M supply; predictable issuance; no authority can inflate |
| **Cross-Border Payments** | Slow (days), expensive, requires intermediaries | Minutes to hours, lower fees, works 24/7, same currency globally |
| **Financial Inclusion** | Billions unbanked, high barriers, geographic restrictions | Anyone with internet access can participate; no account required |

---

## The Innovation

Bitcoin didn't invent new primitives; it combined existing techniques in a novel way:

- **Cryptography:** Digital signatures, hash functions
- **Distributed systems:** Peer-to-peer network
- **Economics:** Incentive alignment
- **Game theory:** Nash equilibrium makes honest behavior profitable

Previous digital currency attempts required central authority and couldn't prevent double-spending. Bitcoin achieves decentralized consensus through this combination, proving that trustless digital money is possible.

---

## The Philosophical Foundation

The problems Bitcoin solved were precisely the problems that [cypherpunk philosophy](/docs/fundamentals/cypherpunk-philosophy) had been trying to address for decades. Cypherpunks believed that cryptography could enable individual freedom by eliminating the need to trust institutions. Bitcoin was the first system to successfully implement these cypherpunk ideals, creating a practical solution to problems that had been identified but not solved for over 20 years.
