# Witness

The witness is the part of a Bitcoin transaction that contains unlocking data (signatures, public keys, and other data) that proves authorization to spend inputs. [SegWit](/docs/bitcoin/segwit) (2017) moved witness data out of the base transaction into a separate structure, so it is no longer part of the data hashed for the TXID. That fixed [transaction malleability](/docs/bitcoin/transaction-malleability) and enabled the witness discount for fee calculation.

## Where witness lives

In a SegWit or [Taproot](/docs/bitcoin/taproot) transaction, each input can have witness data. The witness is serialized after the base transaction (version, inputs without witness, outputs, locktime). For each input, the witness is a list of byte vectors (e.g. signature, public key). The witness is committed to in the coinbase transaction via a witness root; it does not affect the main Merkle tree of transaction IDs.

## Why it matters

- **Malleability fix:** The TXID hashes only the base transaction, so changing the witness does not change the TXID. That makes it safe to build transactions that depend on unconfirmed outputs (e.g. [Lightning](/docs/lightning) channels).
- **Fee discount:** Witness data is charged at 1 weight unit per byte instead of 4, so SegWit and Taproot spends are cheaper.
- **Future upgrades:** Separating witness allows new signature schemes (e.g. Schnorr) and script features without changing the base transaction format.

## Related

- [SegWit](/docs/bitcoin/segwit) for the upgrade and structure
- [Taproot](/docs/bitcoin/taproot) for Taproot witness and script paths
- [Transaction Malleability](/docs/bitcoin/transaction-malleability) for why witness was separated
- [Transaction Structure](/docs/bitcoin/transaction-structure) for input and output field layout
