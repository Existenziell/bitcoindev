# Transaction Structure

A Bitcoin transaction is a serialized structure with a version, a list of inputs, a list of outputs, a locktime, and (for SegWit/Taproot) witness data. This page summarizes the main fields so you can read raw transactions or build them correctly.

## Input fields

Each input references one UTXO and provides data to satisfy its spending conditions.

| Field | Description |
|-------|-------------|
| **Previous output (outpoint)** | The transaction ID (txid) of the transaction that created the UTXO, plus the **vout** (output index) in that transaction. Together (txid, vout) is the outpoint that uniquely identifies the UTXO. |
| **ScriptSig** | For legacy (pre-SegWit) inputs, the unlocking script (e.g. signature and public key). For SegWit/Taproot inputs, this is usually empty; unlocking data is in the witness. |
| **Sequence** | A 32-bit value used for relative locktime (OP_CSV) and RBF signaling. Often `0xFFFFFFFF` (final). |

## Output fields

Each output creates a new UTXO: an amount and a scriptPubKey (locking script) that defines who can spend it.

| Field | Description |
|-------|-------------|
| **Value** | Amount in satoshis. |
| **ScriptPubKey** | The locking script (e.g. P2PKH, P2WPKH, P2TR). Defines the conditions that must be met to spend this output. |

## Serialization notes

- Numeric fields (version, locktime, sequence, value) are little-endian.
- Variable-length data (script length, script content) use compact size encoding.
- SegWit transactions have a marker and flag in the input list, then witness data after the outputs. See [Data Encoding](/docs/bitcoin/data-encoding) for hex, bytes, and compact size.

## Related

- [Transaction Lifecycle](/docs/bitcoin/transaction-lifecycle) for states from creation to confirmation
- [Transaction Construction](/docs/bitcoin-development/transactions) for building transactions in code
- [Script](/docs/bitcoin/script) for scriptPubKey and ScriptSig formats
- [Data Encoding](/docs/bitcoin/data-encoding) for serialization details
