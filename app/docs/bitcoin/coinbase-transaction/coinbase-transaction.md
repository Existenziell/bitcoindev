# Coinbase Transaction

The coinbase transaction is the first transaction in every block. It has no inputs and creates new bitcoin as the block reward (subsidy plus fees). Miners construct it to pay themselves; it is the only transaction type that can create new coins.

## Structure

**Inputs:**

- No previous outpoint. Normal inputs reference a (txid, vout); the coinbase input has no such reference.
- **Coinbase data:** Arbitrary data, up to 100 bytes. [BIP 34](https://github.com/bitcoin/bips/blob/master/bip-0034.mediawiki) requires that block height be encoded here. Miners often add a pool identifier, extra nonce for more search space, or a short message.

**Outputs:**

- One or more outputs paying the miner (and optionally the pool). The total typically equals the block subsidy plus the sum of [transaction fees](/docs/bitcoin/transaction-fees) from all transactions in the block.

## Uniqueness

Each coinbase transaction is unique because the coinbase data (and thus the input) differs per block. That gives miners a large search space: they can change the coinbase when exhausting the nonce in the block header without invalidating the block.

## Maturity

Coinbase outputs cannot be spent until 100 blocks have passed. This prevents problems if the block is later orphaned; the network would reject a spend from an output that no longer exists in the best chain.

## Related

- [Block Subsidy](/docs/bitcoin/subsidy) for the subsidy formula and halving schedule
- [Block Construction](/docs/mining/block-construction) for how miners build blocks and the coinbase
- [Blocks](/docs/bitcoin/blocks) for block propagation and structure
