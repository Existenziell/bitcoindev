# Ordinals and Inscriptions Controversy

Ordinals and inscriptions let users attach arbitrary data (images, text, JSON) to individual satoshis using witness data. Introduced in early 2023 by Casey Rodarmor, the Ordinals protocol and related tokens (e.g. BRC-20) sparked a heated debate: are they legitimate use of block space or spam that raises fees and distorts Bitcoin’s purpose?

## What Are Ordinals and Inscriptions?

- **Ordinals**: A numbering scheme that assigns a unique index to each satoshi and tracks how they move when UTXOs are spent. It does not change consensus; it is an indexing convention.
- **Inscriptions**: Data (images, text, JSON) embedded in SegWit witness scripts and stored on-chain. The content is in the blockchain but does not grow the UTXO set because it lives in prunable witness data.

For technical details, see [Ordinals & Inscriptions](/docs/advanced/ordinals-inscriptions).

---

## The Debate

### “Spam” / “Blockspace for Money Only”

**Arguments:**

- Bitcoin exists to be **sound money** and peer-to-peer cash. Storing images, JSON, or token metadata is not monetary use and **crowds out** normal transactions.
- Inscription-heavy activity has driven [mempool](/docs/mining/mempool) congestion and higher fee rates, especially in 2023–2024, making cheap on-chain payments harder.
- Full node and IBD costs (bandwidth, storage) increase for data many consider non‑monetary.
- BRC-20 and similar tokens depend on **off-chain indexers**; they are not enforced by consensus and add complexity and [trust](/docs/fundamentals/trust-model) outside the protocol.

**Proposals:**

- **Relay or miner policy**: Restrict or filter certain non‑standard scripts (e.g. common inscription patterns). Some node operators and projects (e.g. Bitcoin Knots, or ideas from Luke Dashjr) have explored or implemented filters.
- **Capping witness size** or tightening standardness for large witness payloads. This would be **policy**, not consensus; miners can still include what they accept.

### “Innovation” / “Permissionless Use of Blockspace”

**Arguments:**

- Bitcoin is **permissionless**. If someone pays [transaction fees](/docs/bitcoin/transaction-fees), they are bidding for block space; miners and the [fee market](/docs/bitcoin/transaction-fees) decide what gets included. No one gets to define “legitimate” use.
- [SegWit](/docs/bitcoin/segwit) intentionally made witness data cheaper (1 weight unit per byte) to enable Layer 2 and more efficient use. Inscriptions use the same rules; calling them “spam” is a value judgment, not a technical one.
- Ordinals, BRC-20, Runes, and similar experiments have drawn new users and capital to Bitcoin and highlighted demand for blockspace.
- Censoring or filtering by content is a **slippery slope**: who decides what is “money” vs “data”? It conflicts with censorship resistance and [neutrality](/docs/bitcoin/p2p-protocol) of the base layer.

---

## Relation to Other Disputes

- **[OP_RETURN debate](/docs/controversies/op-return)**: OP_RETURN stores data in the base [transaction](/docs/bitcoin/transaction-lifecycle) and has explicit policy limits (e.g. `-datacarriersize`). Inscriptions use **witness** data, which is discounted and prunable; the limits and levers are different, but the underlying question is the same: how much non‑monetary data should Bitcoin carry?
- **Blocksize wars**: Then, the fight was over **how much** capacity (bigger blocks vs Layer 2). With Ordinals, the fight is over **what** uses that capacity, only “money” or any fee‑paying use.

---

## Current State

- Ordinals and inscriptions are **valid** under current consensus rules. Changing that would require a soft fork or stricter relay/miner policy.
- Some node and miner software offers **optional** filters; there is no network-wide standard. Miners can choose what to include based on fee rate and their own policy.
- The controversy is ongoing: every fee spike or new token scheme (e.g. Runes) renews the “spam vs innovation” debate.

---

## For Beginners

Understanding Ordinals highlights two recurring themes in Bitcoin:

1. **Neutrality**: The base layer does not distinguish “good” vs “bad” use of block space; it enforces consensus and fee rules. Debates about inscriptions are largely about **policy** and **values**, not consensus.
2. **Scarcity and the fee market**: Block space is limited. When demand is high (from payments, Lightning channel opens, or inscriptions) [fees](/docs/bitcoin/transaction-fees) rise. That is by design; the argument is whether certain uses are desirable, not whether the fee market works.

---

## See Also

- Ordinals & Inscriptions – Technical overview
- [OP_RETURN Debate](/docs/controversies/op-return) – Data on Bitcoin and policy limits
- [Transaction Fees](/docs/bitcoin/transaction-fees) – Fee market and fee estimation
