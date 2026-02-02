# Ordinals and Inscriptions Controversy

[Ordinals](/docs/glossary#ordinals) and [inscriptions](/docs/glossary#inscriptions) let users attach arbitrary data—images, text, JSON—to individual [satoshis](/docs/glossary#sat-satoshi) using [witness](/docs/glossary#witness) data. Introduced in early 2023 by Casey Rodarmor, the Ordinals protocol and related tokens (e.g. [BRC-20](/docs/glossary#brc-20-tokens)) sparked a heated debate: are they legitimate use of [block space](/docs/glossary#block-size) or spam that raises [fees](/docs/glossary#fee-rate) and distorts Bitcoin’s purpose?

## What Are Ordinals and Inscriptions?

- **Ordinals**: A numbering scheme that assigns a unique index to each satoshi and tracks how they move when [UTXOs](/docs/glossary#utxo) are spent. It does not change [consensus](/docs/glossary#consensus); it is an indexing convention.
- **Inscriptions**: Data (images, text, JSON) embedded in [SegWit](/docs/glossary#segwit) witness scripts and stored on-chain. The content is in the [blockchain](/docs/glossary#blockchain) but does not grow the [UTXO set](/docs/glossary#utxo-set) because it lives in prunable witness data.

For technical details, see [Ordinals & Inscriptions](/docs/advanced/ordinals-inscriptions).

---

## The Debate

### “Spam” / “Blockspace for Money Only”

**Arguments:**

- Bitcoin exists to be **sound money** and [peer-to-peer](/docs/glossary#peer-to-peer-p2p) cash. Storing images, JSON, or token metadata is not monetary use and **crowds out** normal [transactions](/docs/glossary#transaction).
- Inscription-heavy activity has driven [mempool](/docs/mining/mempool) congestion and higher [fee rates](/docs/glossary#fee-rate), especially in 2023–2024, making cheap on-chain payments harder.
- [Full node](/docs/glossary#full-node) and [IBD](/docs/glossary#ibd-initial-block-download) costs (bandwidth, storage) increase for data many consider non‑monetary.
- BRC-20 and similar tokens depend on **off-chain indexers**; they are not enforced by consensus and add complexity and [trust](/docs/fundamentals/trust-model) outside the protocol.

**Proposals:**

- **Relay or miner policy**: Restrict or filter certain non‑standard scripts (e.g. common inscription patterns). Some node operators and projects (e.g. Bitcoin Knots, or ideas from Luke Dashjr) have explored or implemented filters.
- **Capping witness size** or tightening standardness for large witness payloads. This would be **policy**, not consensus; miners can still include what they accept.

### “Innovation” / “Permissionless Use of Blockspace”

**Arguments:**

- Bitcoin is **permissionless**. If someone pays [transaction fees](/docs/bitcoin/transaction-fees), they are bidding for block space; miners and the [fee market](/docs/bitcoin/transaction-fees) decide what gets included. No one gets to define “legitimate” use.
- [SegWit](/docs/bitcoin/segwit) intentionally made witness data cheaper (1 [weight unit](/docs/glossary#weight-units) per byte) to enable [Layer 2](/docs/glossary#layer-2) and more efficient use. Inscriptions use the same rules; calling them “spam” is a value judgment, not a technical one.
- Ordinals, BRC-20, [Runes](/docs/glossary#runes-protocol), and similar experiments have drawn new users and capital to Bitcoin and highlighted demand for blockspace.
- Censoring or filtering by content is a **slippery slope**: who decides what is “money” vs “data”? It conflicts with [censorship resistance](/docs/glossary#censorship-resistance) and [neutrality](/docs/bitcoin/p2p-protocol) of the base layer.

---

## Relation to Other Disputes

- **[OP_RETURN debate](/docs/controversies/op-return)**: OP_RETURN stores data in the base [transaction](/docs/bitcoin/transaction-lifecycle) and has explicit policy limits (e.g. `-datacarriersize`). Inscriptions use **witness** data, which is discounted and prunable; the limits and levers are different, but the underlying question is the same: how much non‑monetary data should Bitcoin carry?
- **Blocksize wars**: Then, the fight was over **how much** capacity (bigger blocks vs [Layer 2](/docs/glossary#layer-2)). With Ordinals, the fight is over **what** uses that capacity—only “money” or any fee‑paying use.

---

## Current State

- Ordinals and inscriptions are **valid** under current [consensus rules](/docs/glossary#consensus-rules). Changing that would require a [soft fork](/docs/glossary#soft-fork) or stricter relay/miner policy.
- Some node and miner software offers **optional** filters; there is no network-wide standard. Miners can choose what to include based on [fee rate](/docs/glossary#fee-rate) and their own policy.
- The controversy is ongoing: every fee spike or new token scheme (e.g. Runes) renews the “spam vs innovation” debate.

---

## For Beginners

Understanding Ordinals highlights two recurring themes in Bitcoin:

1. **Neutrality**: The base layer does not distinguish “good” vs “bad” use of block space; it enforces [consensus](/docs/glossary#consensus) and [fee](/docs/glossary#transaction-fee) rules. Debates about inscriptions are largely about **policy** and **values**, not consensus.
2. **Scarcity and the fee market**: Block space is limited. When demand is high—from payments, [Lightning](/docs/glossary#lightning-network) channel opens, or inscriptions—[fees](/docs/bitcoin/transaction-fees) rise. That is by design; the argument is whether certain uses are desirable, not whether the fee market works.

---

## See Also

- [Ordinals & Inscriptions](/docs/advanced/ordinals-inscriptions) – Technical overview
- [OP_RETURN Debate](/docs/controversies/op-return) – Data on Bitcoin and policy limits
- [Transaction Fees](/docs/bitcoin/transaction-fees) – Fee market and fee estimation
