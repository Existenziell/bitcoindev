# Ordinals & Inscriptions

Ordinals and inscriptions are a method for attaching arbitrary data to individual satoshis on the Bitcoin blockchain. Introduced in early 2023 by Casey Rodarmor, the Ordinals protocol assigns unique identifiers to satoshis and allows "inscribing" content (images, text, JSON, or other files) into witness data that gets stored on-chain.

The **Ordinals protocol** assigns a unique, sequential number to each satoshi based on the order it was mined. This creates a way to identify and track individual sats through transactions and UTXOs. Key concepts: **Ordinal number** (a satoshi's position in the total supply, 0 to 2.1 quadrillion minus 1), **Ordinal theory** (tracks which ordinal numbers are in which UTXOs when inputs are spent, first-in-first-out by default), **Rare sats** (certain ordinals considered "rare," e.g., first sat of a [halving](/philosophy/history/halvings) or block subsidy). When Bitcoin is spent, inputs are consumed in the order they appear and their ordinal numbers transfer to outputs in order (default: FIFO). Ordinals do not require a soft fork or consensus change; they are an agreed-upon numbering and tracking scheme that full nodes do not need to implement, only indexers and wallets that support Ordinals do.

---

## Inscriptions

**Inscriptions** use the Ordinals protocol to attach content to a specific satoshi. The content is stored in the witness (SegWit) portion of a transaction, often in an `OP_IF`/`OP_ENDIF` or similar pattern that is pruned from the UTXO set but remains in the blockchain.

### Inscription Structure

```text
1. Envelope: Wrapped in script that is never executed (e.g., OP_FALSE OP_IF ... OP_ENDIF)
2. Content type: MIME type (e.g., image/png, text/plain, application/json)
3. Content: Raw bytes of the inscribed data
```

### Why Witness Data?

- [SegWit](/docs/bitcoin/segwit) witness data is **discounted** in block weight (1 WU per byte vs 4 for non-witness)
- Inscription data does not expand the UTXO set
- Same consensus rules as other valid SegWit [scripts](/docs/bitcoin/script)

---

## BRC-20 and Other Token Standards

**BRC-20** is an experimental, fungible token standard on Bitcoin that uses JSON inscriptions to define "transfer" and "mint" operations. Similar in concept to [ERC-20](https://ethereum.org) on Ethereum, BRC-20 tokens do not use [Bitcoin Script](/docs/bitcoin/script) for logic; they rely on external indexers to parse inscription content and track balances.

### Characteristics

- **Inefficient**: Each "transfer" or "mint" typically requires a separate on-chain inscription and [transaction fees](/docs/bitcoin/transaction-fees)
- **Indexer-dependent**: Balances and transfers are not enforced by consensus; they require off-chain indexing
- **Blockspace**: During 2023–2024, BRC-20 and Ordinals activity contributed to [mempool](/docs/mining/mempool) congestion and higher fee rates

### Runes

**Runes** (by Casey Rodarmor, 2024) is an alternative fungible token protocol on Bitcoin designed to be more efficient than BRC-20 by using the OP_RETURN-style output and a more compact on-chain representation. Like BRC-20, it requires indexers to interpret protocol messages.

---

## Impact on Bitcoin

### Blockspace and Fees

- Inscriptions and BRC-20 can generate many [transactions](/docs/bitcoin/transaction-lifecycle) competing for [block](/docs/bitcoin/blocks) space
- During peaks, [fee rates](/docs/bitcoin/transaction-fees) increased, affecting users making ordinary on-chain payments

### Consensus and Policy

- Ordinals and inscriptions use existing SegWit and [Taproot](/docs/bitcoin/taproot) rules; they are **valid** under current consensus rules
- Limits on data size (e.g., `-datacarriersize` for [OP_RETURN](/philosophy/controversies/op-return)) are **relay policy**, not consensus; witness-based inscriptions are subject to node policy (e.g., non-standard or size limits) in some configurations

### Debate

Views in the Bitcoin community vary:

- **Supporters**: Ordinals demonstrate programmability, bring new use cases and users, and show that blockspace is a scarce resource with a [fee market](/docs/bitcoin/transaction-fees).
- **Critics**: They argue inscriptions and token protocols consume blockspace for non-monetary data, raise fees for [peer-to-peer](/docs/bitcoin/p2p-protocol) cash use, and rely on extra-protocol indexing.

---

## Technical Summary

| Aspect | Ordinals | Inscriptions |
|--------|----------|---------------|
| **Purpose** | Number and track satoshis | Attach data to a satoshi |
| **Storage** | No extra data; ordering only | Witness (SegWit) data |
| **Consensus** | Not enforced by nodes | Must be valid SegWit script |
| **Indexing** | Required for tracking | Required for content retrieval |

---

## Related Topics

- [OP_RETURN Debate](/philosophy/controversies/op-return) – Data on Bitcoin and blockspace use
- SegWit – Witness discount and structure
- [Transaction Fees](/docs/bitcoin/transaction-fees) – Fee market and fee estimation
- [Mempool](/docs/mining/mempool) – How transactions are queued

---

## Resources

- [Ordinals Handbook](https://docs.ordinals.com/) – Official Ordinals documentation
- [BRC-20 Spec](https://domo-2.gitbook.io/brc-20-experiment/) – BRC-20 experiment description
- [Runes](https://docs.ordinals.com/runes.html) – Runes protocol overview
