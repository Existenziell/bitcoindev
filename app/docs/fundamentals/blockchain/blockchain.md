# The Blockchain

The blockchain is Bitcoin's foundational data structure: a cryptographically linked chain of blocks that creates an immutable, verifiable record of all transactions. Each block contains a hash of the previous block's header, creating an unbreakable chain where altering any block invalidates all subsequent blocks. This structure enables trustless verification, prevents tampering, and forms the backbone of Bitcoin's security model. A blockchain is a sequence of blocks, where each block is cryptographically linked to the previous one through a hash reference. This creates a chain structure where:

- **Each block references the previous block** via its hash
- **The chain is immutable**: changing any block breaks the chain
- **The entire history is verifiable**: nodes can verify the chain's integrity
- **No central authority is needed**: the structure itself provides security

Unlike a traditional database where records can be modified or deleted, the blockchain creates a permanent, append-only ledger. Once a block is added to the chain, it becomes part of an unalterable historical record.

---

## Block Structure and Hash Linking

Each block in Bitcoin contains a header with several fields, including a critical reference to the previous block:

```text
[Block Header Structure]
├── Version (4 bytes)
├── Previous Block Hash (32 bytes) - links to previous block
├── Merkle Root (32 bytes)
├── Timestamp (4 bytes)
├── Difficulty Target (4 bytes)
└── Nonce (4 bytes)
```

The **Previous Block Hash** field is what creates the chain. Each block contains the hash of the previous block's header, creating an unbreakable link:

```text
[Block 0 Genesis] -- hash: 000000000019d6... --> [Block 1] -- hash: 00000000839a8e... --> [Block 2] -- hash: 000000006a625f... --> [Block 3] --> [...]
```

### How Hash Linking Works

When a miner creates a new block:

1. **Takes the hash of the previous block's header** (80 bytes)
2. **Places this hash in the new block's "Previous Block Hash" field**
3. **Mines the new block** by finding a valid proof-of-work
4. **The new block's hash** becomes the reference for the next block

This creates a one-way chain: you can verify that Block N+1 follows Block N by checking that Block N+1's "Previous Block Hash" matches Block N's actual hash. But you cannot go backwards: the hash function is one-way.

### Cryptographic Security

The security of the blockchain comes from cryptographic hash functions (specifically SHA-256 in Bitcoin):

| Property | Why It Matters |
|----------|----------------|
| **One-way function** | Cannot reverse-engineer the input from the hash |
| **Deterministic** | Same input always produces same hash |
| **Avalanche effect** | Tiny change in input completely changes hash |
| **Collision-resistant** | Practically impossible to find two inputs with same hash |

If an attacker tries to change a transaction in Block N:
1. The block's hash changes (avalanche effect)
2. Block N+1's "Previous Block Hash" no longer matches
3. Block N+1 becomes invalid
4. Block N+2 becomes invalid (it references invalid Block N+1)
5. The entire chain from Block N onward breaks

---

## Immutability Through Chain Structure

The blockchain's immutability comes from the combination of hash linking and proof-of-work:

### Why Changing History Is Prohibitively Expensive

To change a block in the chain, an attacker must:

1. **Modify the target block** (change a transaction, for example)
2. **Recalculate that block's hash** (easy, but...)
3. **Find new proof-of-work for that block** (requires significant computational work)
4. **Recalculate Block N+1's hash** (because its "Previous Block Hash" changed)
5. **Find new proof-of-work for Block N+1** (more work)
6. **Repeat for every subsequent block** (exponentially more work)
7. **Outpace the honest network** (must mine faster than all honest miners combined)

As more blocks are added after the target block, the work required grows exponentially. Changing a block from 100 blocks ago requires redoing 100 blocks of proof-of-work. Changing a block from 1000 blocks ago requires redoing 1000 blocks of proof-of-work.

### The Longest Chain Rule

Bitcoin nodes follow the **longest valid chain rule**: they accept the chain with the most cumulative proof-of-work. This means:

- An attacker's modified chain must have more work than the honest chain
- With each new honest block, the attacker falls further behind
- The honest chain grows faster, making the attack increasingly impossible

```
Honest Chain:     Block 100 → Block 101 → Block 102 → Block 103
                                    ↓
Attacker's Chain: Block 100 → Block 101' (modified)
                                    ↓
                            Must mine faster than entire network
                            to catch up and overtake
```

---

## Chain Verification

Nodes verify the blockchain's integrity by checking:

### Header Chain Verification

1. **Previous hash links**: Each block's "Previous Block Hash" matches the actual hash of the previous block
2. **Proof-of-work validity**: Each block's hash meets the difficulty target
3. **Chain continuity**: No gaps or breaks in the sequence
4. **Genesis block**: The chain starts with the known genesis block

### Full Block Verification

Beyond the header chain, nodes also verify:

1. **Transaction validity**: All transactions follow consensus rules
2. **Merkle root**: The Merkle root in the header matches the transactions
3. **UTXO references**: All transaction inputs reference valid, unspent UTXOs
4. **No double-spends**: No UTXO is spent twice in the chain

### Efficient Verification

The chain structure enables efficient verification:

- **Headers-first sync**: Nodes can download and verify all block headers (~60 MB) before downloading full blocks
- **Incremental verification**: Nodes only need to verify new blocks, not re-verify the entire chain
- **Checkpoint verification**: Nodes can trust known good blocks (checkpoints) and verify from there

---

## Relationship to Other Bitcoin Concepts

The blockchain structure is fundamental to many other Bitcoin concepts:

### Consensus

The blockchain enables consensus without a central authority:
- All nodes independently verify the same chain structure
- The longest valid chain naturally emerges as the consensus chain
- No voting or coordination needed: the structure itself creates agreement

### Security

The chain structure provides security through:
- **Immutability**: History cannot be rewritten without enormous cost
- **Verifiability**: Anyone can verify the chain's integrity
- **Decentralization**: No single point of failure or control

### Timechain

The blockchain structure enables Bitcoin's [timechain](/docs/fundamentals/timechain) property:
- Blocks form an ordered sequence (temporal ordering)
- The chain structure ensures this ordering is immutable
- Block height provides a reliable time reference

### Proof-of-Work

Proof-of-work secures the blockchain:
- Each block requires computational work to create
- The chain with the most work is the valid chain
- Changing history requires redoing all subsequent work

---

## Practical Implications

Understanding the blockchain structure explains several important aspects of Bitcoin:

### Why Confirmations Matter

Each block added after your transaction makes it more secure:
- Block 1: Your transaction is in the chain
- Block 2: One confirmation: attacker must redo 1 block of work
- Block 6: Six confirmations: attacker must redo 6 blocks of work
- Block 100: One hundred confirmations: attacker must redo 100 blocks of work

More confirmations = more blocks built on top = more work required to reverse = more security.

### Why Reorganizations Are Rare

A chain reorganization (reorg) occurs when the network switches to a different chain. This is rare because:
- The honest chain typically has the most work
- Reorgs only happen when two blocks are found nearly simultaneously
- The network quickly converges on the longest chain
- Deep reorgs (many blocks) are extremely rare and require massive hash rate

### Why Full Nodes Are Important

Full nodes verify the entire blockchain:
- They independently verify every block and transaction
- They reject invalid blocks, protecting the network
- They don't trust other nodes; they verify the chain structure themselves
- More full nodes = more decentralized verification = stronger security

### Why Blockchain Size Matters

The blockchain grows continuously:
- Each block adds ~1-2 MB of data (with SegWit, up to ~4 MB)
- The full blockchain is ~500+ GB and growing
- This creates a trade-off: larger blocks = more transactions but larger blockchain
- Bitcoin's block size limit balances throughput with node requirements

---

## Comparison to Traditional Systems

| Aspect | Traditional Database | Bitcoin Blockchain |
|--------|---------------------|-------------------|
| **Modification** | Records can be updated or deleted | Append-only: history cannot be changed |
| **Verification** | Trust the database administrator | Anyone can verify the entire chain |
| **Authority** | Central authority controls the database | No central authority: structure provides security |
| **Tampering** | Administrator can modify records | Changing history requires redoing all subsequent work |
| **Backup** | Need to trust backup integrity | Every node has a complete, verifiable copy |
| **Audit** | Requires trusting audit logs | The chain itself is the audit trail |

---

## The Elegance of the Solution

The blockchain structure is elegant because it:

1. **Solves multiple problems simultaneously**: Immutability, verification, consensus, and security
2. **Requires no trust**: The structure itself provides security through cryptography
3. **Is self-verifying**: Anyone can verify the chain's integrity independently
4. **Creates natural convergence**: The longest chain rule causes the network to naturally agree
5. **Scales verification**: Efficient to verify incrementally as new blocks arrive
6. **Prevents tampering**: The cost of changing history grows exponentially

The blockchain isn't just a data structure: it's a mechanism that creates trust through mathematics rather than authority.

---

## Common Misconceptions

### "Blockchain is just a database"

While the blockchain stores data, it's fundamentally different from a traditional database:
- **Immutable**: Cannot modify or delete records
- **Decentralized**: No central administrator
- **Cryptographically secured**: Hash linking prevents tampering
- **Verifiable**: Anyone can verify the entire chain

### "You can change the blockchain if you have enough computing power"

While a 51% attack could theoretically create an alternative chain, it cannot:
- Change blocks that are already deeply confirmed (too much work required)
- Modify transactions that are already spent (UTXOs already consumed)
- Break the cryptographic links (hash function security is mathematical)
- Succeed long-term (honest network will eventually outpace attacker)

### "The blockchain is stored in one place"

The blockchain is distributed:
- Every full node stores a complete copy
- Thousands of nodes worldwide maintain the chain
- No single point of failure
- Network redundancy ensures availability

---

## Conclusion

The blockchain is Bitcoin's foundational innovation: a cryptographically linked chain of blocks that creates an immutable, verifiable record. By linking each block to the previous one through cryptographic hashes, Bitcoin creates a structure where:

- **History cannot be rewritten** without redoing all subsequent proof-of-work
- **Anyone can verify** the chain's integrity independently
- **No central authority** is needed: the structure itself provides security
- **Consensus emerges naturally** through the longest chain rule

This elegant structure enables Bitcoin's core properties: decentralization, immutability, and trustlessness. The blockchain isn't just how Bitcoin stores data: it's the mechanism that makes Bitcoin possible.
