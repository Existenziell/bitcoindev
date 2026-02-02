# Block Construction

Block construction is the process by which miners assemble a new block from pending transactions. This is where the [mempool](/docs/glossary#mempool) meets the blockchain. Miners must decide which transactions to include, how to order them, and how to structure the block for maximum profit while following [consensus rules](/docs/glossary#consensus-rules).

## Anatomy of a Block

A Bitcoin block consists of two main parts:

### Block Header (80 bytes)

```mermaid
flowchart TD
  BH[Block Header 80 bytes]
  BH --> V["Version (4 bytes)"]
  BH --> Prev["Previous Block Hash (32 bytes)"]
  BH --> MR["Merkle Root (32 bytes)"]
  BH --> TS["Timestamp (4 bytes)"]
  BH --> Diff["Difficulty Target (4 bytes)"]
  BH --> Nonce["Nonce (4 bytes)"]
```

All numeric fields (version, timestamp, [difficulty target](/docs/glossary#difficulty-target), [nonce](/docs/glossary#nonce)) are stored in [little endian](/docs/glossary#little-endian) byte order. The previous block hash and merkle root are stored as-is (32 bytes each).

### Block Body

- **Coinbase Transaction**: First transaction, creates new bitcoin
- **Regular Transactions**: Payments selected from the mempool

---

## The Coinbase Transaction

The coinbase transaction is special: it's the only transaction that creates new bitcoin.

### Structure

```
Inputs:
  - No previous output (creates coins from nothing)
  - Coinbase data: Arbitrary data (up to 100 bytes)
    - Must include block height (BIP34)
    - Often includes miner identifier, messages, extra nonce

Outputs:
  - Block reward: Currently 3.125 BTC (after April 2024 halving)
  - Transaction fees: Sum of all fees from included transactions
  - Can have multiple outputs (pool payouts, etc.)
```

### Famous Coinbase Messages

- **Genesis Block**: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks"
- **Block 629999** (pre-halving): "NYTimes 09/Apr/2020 With $2.3T Injection, Fed's Plan Far Exceeds 2008 Rescue"

### Coinbase Maturity

Coinbase outputs cannot be spent until 100 blocks have passed. This prevents issues if the block is [orphaned](/docs/glossary#orphan-block).

---

## Candidate Block

A **candidate block** is the block a miner is currently hashing. It is built from a [block template](/docs/glossary#block-template): the miner fills in the header (version, previous block hash, merkle root, timestamp, [difficulty target](/docs/glossary#difficulty-target), [nonce](/docs/glossary#nonce)), includes the [coinbase transaction](/docs/glossary#coinbase-transaction) and selected transactions, then repeatedly changes the nonce (and optionally coinbase data) and hashes the header until the hash is below the target. Each attempt is a candidate block; the first one that meets the [proof-of-work](/docs/glossary#pow) requirement is broadcast as the new block.

---

## Transaction Selection

Miners want to maximize revenue, which means selecting transactions that pay the highest fees per unit of block space.

### The Knapsack Problem

Block construction is a variant of the knapsack optimization problem:

- **Constraint**: Block weight limit (4 million [weight units](/docs/glossary#weight-units) ≈ 1 MB base + 3 MB witness)
- **Objective**: Maximize total fees
- **Complication**: Transaction dependencies (child transactions require parents)

### Fee Rate Priority

Transactions are generally sorted by **[fee rate](/docs/glossary#fee-rate)** (satoshis per virtual byte):

```
Priority Queue:
1. Tx A: 100 sat/vB, 250 vB → 25,000 sats fee
2. Tx B: 80 sat/vB, 500 vB → 40,000 sats fee
3. Tx C: 50 sat/vB, 200 vB → 10,000 sats fee
...
```

### Ancestor Fee Rate

When transactions have dependencies, miners calculate the **ancestor fee rate**:

```
Parent Tx: 10 sat/vB, 200 vB
Child Tx: 100 sat/vB, 150 vB

Ancestor fee rate of child = (10×200 + 100×150) / (200 + 150)
                           = 17,000 / 350 = 48.6 sat/vB
```

This is how [CPFP](/docs/glossary#cpfp-child-pays-for-parent) (Child Pays for Parent) works: the child's high fee pulls the parent along.

### Block Template Algorithm

Bitcoin Core's `getblocktemplate` uses this approach:

1. **Sort by ancestor fee rate**: Calculate effective fee rate for each transaction
2. **Add highest-fee transactions**: Fill the block greedily
3. **Handle dependencies**: Include all ancestors when adding a transaction
4. **Respect limits**: Stay within weight and sigop limits
5. **Update calculations**: Recalculate fee rates as transactions are added

---

## Block Weight and SegWit

Since [SegWit](/docs/glossary#segwit) (2017), blocks use **weight** instead of raw size:

```
Block Weight = (Base Size × 4) + Witness Size

Maximum Block Weight = 4,000,000 weight units (4 MWU)
```

### Practical Capacity

- **Non-SegWit transactions**: ~1 MB per block
- **All SegWit transactions**: Up to ~2.3 MB per block
- **Typical mixed blocks**: ~1.5-2 MB

### Why Weight Matters for Miners

SegWit transactions are "discounted" because their [witness](/docs/glossary#witness) data costs less weight. This means:

- SegWit transactions can pay lower absolute fees for the same priority
- Miners can fit more transactions in a block
- More fees collected overall

---

## Constructing the Merkle Root

All transactions in a block are hashed into a **[Merkle tree](/docs/glossary#merkle-tree)**:

```
                    Merkle Root
                   /           \
              Hash AB          Hash CD
             /      \         /      \
         Hash A    Hash B   Hash C   Hash D
           |         |        |        |
          Tx A      Tx B     Tx C     Tx D
```

### Why Merkle Trees?

- **Efficient verification**: Prove a transaction is in a block with O(log n) hashes
- **Compact proofs**: [SPV](/docs/glossary#spv) wallets only need the Merkle path, not the full block
- **Tamper detection**: Any change to any transaction changes the root

### Merkle Tree Construction

1. Hash each transaction (double SHA-256)
2. Pair hashes and hash together
3. If odd number, duplicate the last hash
4. Repeat until one hash remains (the root)

### Merkle Tree Implementation

:::code-group
```rust
// In Cargo.toml: hex = "0.4"
use hex;
use sha2::{Sha256, Digest};

/// Performs double SHA-256 (SHA256D) hash.
fn sha256d(data: &[u8]) -> [u8; 32] {
    let first = Sha256::digest(data);
    Sha256::digest(&first).into()
}

/// Computes the Merkle root from a list of transaction hashes.
/// 
/// # Arguments
/// * `tx_hashes` - Vector of 32-byte transaction hashes (txids)
/// 
/// # Returns
/// The 32-byte Merkle root
fn compute_merkle_root(tx_hashes: Vec<[u8; 32]>) -> [u8; 32] {
    if tx_hashes.is_empty() {
        return [0u8; 32];
    }
    
    let mut level = tx_hashes;
    
    while level.len() > 1 {
        let mut next_level = Vec::new();
        
        // Process pairs
        for chunk in level.chunks(2) {
            let left = chunk[0];
            // If odd number, duplicate the last hash
            let right = if chunk.len() == 2 { chunk[1] } else { chunk[0] };
            
            // Concatenate and hash
            let mut combined = [0u8; 64];
            combined[..32].copy_from_slice(&left);
            combined[32..].copy_from_slice(&right);
            
            next_level.push(sha256d(&combined));
        }
        
        level = next_level;
    }
    
    level[0]
}

/// Generates a Merkle proof for a transaction at a given index.
fn generate_merkle_proof(tx_hashes: &[[u8; 32]], tx_index: usize) -> Vec<([u8; 32], bool)> {
    let mut proof = Vec::new();
    let mut index = tx_index;
    let mut level: Vec<[u8; 32]> = tx_hashes.to_vec();
    
    while level.len() > 1 {
        // Determine sibling
        let sibling_index = if index % 2 == 0 { index + 1 } else { index - 1 };
        let sibling = if sibling_index < level.len() {
            level[sibling_index]
        } else {
            level[index] // Duplicate if odd
        };
        
        // true = sibling is on the right
        proof.push((sibling, index % 2 == 0));
        
        // Move to next level
        let mut next_level = Vec::new();
        for chunk in level.chunks(2) {
            let left = chunk[0];
            let right = if chunk.len() == 2 { chunk[1] } else { chunk[0] };
            let mut combined = [0u8; 64];
            combined[..32].copy_from_slice(&left);
            combined[32..].copy_from_slice(&right);
            next_level.push(sha256d(&combined));
        }
        
        level = next_level;
        index /= 2;
    }
    
    proof
}

fn main() {
    // Example: 4 transaction hashes
    let tx_hashes: Vec<[u8; 32]> = vec![
        sha256d(b"tx1"),
        sha256d(b"tx2"),
        sha256d(b"tx3"),
        sha256d(b"tx4"),
    ];
    
    let root = compute_merkle_root(tx_hashes.clone());
    println!("Merkle root: {}", hex::encode(root));
    
    // Generate proof for tx at index 2
    let proof = generate_merkle_proof(&tx_hashes, 2);
    println!("Proof has {} elements", proof.len());
}
```

```python
import hashlib

def sha256d(data: bytes) -> bytes:
    """Performs double SHA-256 (SHA256D) hash."""
    return hashlib.sha256(hashlib.sha256(data).digest()).digest()

def compute_merkle_root(tx_hashes: list[bytes]) -> bytes:
    """
    Computes the Merkle root from a list of transaction hashes.
    
    Args:
        tx_hashes: List of 32-byte transaction hashes (txids)
    
    Returns:
        32-byte Merkle root
    """
    if not tx_hashes:
        return bytes(32)
    
    level = list(tx_hashes)
    
    while len(level) > 1:
        next_level = []
        
        # Process pairs
        for i in range(0, len(level), 2):
            left = level[i]
            # If odd number, duplicate the last hash
            right = level[i + 1] if i + 1 < len(level) else level[i]
            
            # Concatenate and hash
            combined = left + right
            next_level.append(sha256d(combined))
        
        level = next_level
    
    return level[0]

def generate_merkle_proof(tx_hashes: list[bytes], tx_index: int) -> list[tuple[bytes, bool]]:
    """
    Generates a Merkle proof for a transaction at a given index.
    
    Args:
        tx_hashes: List of transaction hashes
        tx_index: Index of the transaction to prove
    
    Returns:
        List of (sibling_hash, is_right) tuples
    """
    proof = []
    index = tx_index
    level = list(tx_hashes)
    
    while len(level) > 1:
        # Determine sibling
        sibling_index = index + 1 if index % 2 == 0 else index - 1
        sibling = level[sibling_index] if sibling_index < len(level) else level[index]
        
        # True = sibling is on the right
        proof.append((sibling, index % 2 == 0))
        
        # Move to next level
        next_level = []
        for i in range(0, len(level), 2):
            left = level[i]
            right = level[i + 1] if i + 1 < len(level) else level[i]
            next_level.append(sha256d(left + right))
        
        level = next_level
        index //= 2
    
    return proof

def verify_merkle_proof(tx_hash: bytes, proof: list[tuple[bytes, bool]], root: bytes) -> bool:
    """Verifies a Merkle proof."""
    current = tx_hash
    
    for sibling, is_right in proof:
        if is_right:
            current = sha256d(current + sibling)
        else:
            current = sha256d(sibling + current)
    
    return current == root

# Example usage
tx_hashes = [sha256d(f"tx{i}".encode()) for i in range(1, 5)]

root = compute_merkle_root(tx_hashes)
print(f"Merkle root: {root.hex()}")

# Generate and verify proof for tx at index 2
proof = generate_merkle_proof(tx_hashes, 2)
print(f"Proof has {len(proof)} elements")

is_valid = verify_merkle_proof(tx_hashes[2], proof, root)
print(f"Proof valid: {is_valid}")
```

```cpp
#include <iostream>
#include <vector>
#include <array>
#include <iomanip>
#include <openssl/sha.h>

using Hash = std::array<unsigned char, 32>;

/** Performs double SHA-256 (SHA256D) hash. */
Hash sha256d(const unsigned char* data, size_t len) {
    Hash first, second;
    SHA256(data, len, first.data());
    SHA256(first.data(), 32, second.data());
    return second;
}

/** Computes the Merkle root from a list of transaction hashes. */
Hash computeMerkleRoot(std::vector<Hash> txHashes) {
    if (txHashes.empty()) {
        return Hash{};
    }
    
    std::vector<Hash> level = std::move(txHashes);
    
    while (level.size() > 1) {
        std::vector<Hash> nextLevel;
        
        for (size_t i = 0; i < level.size(); i += 2) {
            Hash left = level[i];
            // If odd number, duplicate the last hash
            Hash right = (i + 1 < level.size()) ? level[i + 1] : level[i];
            
            // Concatenate and hash
            unsigned char combined[64];
            std::copy(left.begin(), left.end(), combined);
            std::copy(right.begin(), right.end(), combined + 32);
            
            nextLevel.push_back(sha256d(combined, 64));
        }
        
        level = std::move(nextLevel);
    }
    
    return level[0];
}

/** Merkle proof element: hash and position indicator. */
struct ProofElement {
    Hash hash;
    bool isRight;  // true if sibling is on the right
};

/** Generates a Merkle proof for a transaction at a given index. */
std::vector<ProofElement> generateMerkleProof(
    const std::vector<Hash>& txHashes, size_t txIndex) {
    
    std::vector<ProofElement> proof;
    size_t index = txIndex;
    std::vector<Hash> level = txHashes;
    
    while (level.size() > 1) {
        // Determine sibling
        size_t siblingIndex = (index % 2 == 0) ? index + 1 : index - 1;
        Hash sibling = (siblingIndex < level.size()) 
            ? level[siblingIndex] : level[index];
        
        proof.push_back({sibling, index % 2 == 0});
        
        // Move to next level
        std::vector<Hash> nextLevel;
        for (size_t i = 0; i < level.size(); i += 2) {
            Hash left = level[i];
            Hash right = (i + 1 < level.size()) ? level[i + 1] : level[i];
            unsigned char combined[64];
            std::copy(left.begin(), left.end(), combined);
            std::copy(right.begin(), right.end(), combined + 32);
            nextLevel.push_back(sha256d(combined, 64));
        }
        
        level = std::move(nextLevel);
        index /= 2;
    }
    
    return proof;
}

void printHash(const Hash& hash) {
    for (unsigned char byte : hash) {
        std::cout << std::hex << std::setw(2) << std::setfill('0') << (int)byte;
    }
}

int main() {
    // Example: 4 transaction hashes
    std::vector<Hash> txHashes;
    for (int i = 1; i <= 4; ++i) {
        std::string tx = "tx" + std::to_string(i);
        txHashes.push_back(sha256d((unsigned char*)tx.c_str(), tx.size()));
    }
    
    Hash root = computeMerkleRoot(txHashes);
    std::cout << "Merkle root: ";
    printHash(root);
    std::cout << std::endl;
    
    // Generate proof for tx at index 2
    auto proof = generateMerkleProof(txHashes, 2);
    std::cout << "Proof has " << proof.size() << " elements" << std::endl;
    
    return 0;
}
```

```go
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

// SHA256D performs double SHA-256 hash
func SHA256D(data []byte) []byte {
	first := sha256.Sum256(data)
	second := sha256.Sum256(first[:])
	return second[:]
}

// ComputeMerkleRoot computes the Merkle root from a list of transaction hashes
func ComputeMerkleRoot(txHashes [][]byte) []byte {
	if len(txHashes) == 0 {
		return make([]byte, 32)
	}
	
	if len(txHashes) == 1 {
		return txHashes[0]
	}
	
	// Build next level
	var nextLevel [][]byte
	for i := 0; i < len(txHashes); i += 2 {
		if i+1 < len(txHashes) {
			// Pair of hashes
			combined := append(txHashes[i], txHashes[i+1]...)
			nextLevel = append(nextLevel, SHA256D(combined))
		} else {
			// Odd one out, hash with itself
			combined := append(txHashes[i], txHashes[i]...)
			nextLevel = append(nextLevel, SHA256D(combined))
		}
	}
	
	return ComputeMerkleRoot(nextLevel)
}

// GenerateMerkleProof generates a Merkle proof for a transaction at the given index
func GenerateMerkleProof(txHashes [][]byte, txIndex int) [][]byte {
	if txIndex < 0 || txIndex >= len(txHashes) {
		return nil
	}
	
	var proof [][]byte
	level := txHashes
	index := txIndex
	
	for len(level) > 1 {
		siblingIndex := index ^ 1 // XOR to get sibling
		if siblingIndex < len(level) {
			proof = append(proof, level[siblingIndex])
		}
		
		// Build next level
		var nextLevel [][]byte
		for i := 0; i < len(level); i += 2 {
			if i+1 < len(level) {
				combined := append(level[i], level[i+1]...)
				nextLevel = append(nextLevel, SHA256D(combined))
			} else {
				combined := append(level[i], level[i]...)
				nextLevel = append(nextLevel, SHA256D(combined))
			}
		}
		
		level = nextLevel
		index = index / 2
	}
	
	return proof
}

// VerifyMerkleProof verifies a Merkle proof
func VerifyMerkleProof(txHash []byte, proof [][]byte, root []byte) bool {
	current := txHash
	
	for _, sibling := range proof {
		combined := append(current, sibling...)
		current = SHA256D(combined)
	}
	
	return hex.EncodeToString(current) == hex.EncodeToString(root)
}

func main() {
	// Example usage
	txHashes := make([][]byte, 4)
	for i := 0; i < 4; i++ {
		txData := []byte(fmt.Sprintf("tx%d", i+1))
		txHashes[i] = SHA256D(txData)
	}
	
	root := ComputeMerkleRoot(txHashes)
	fmt.Printf("Merkle root: %s\n", hex.EncodeToString(root))
	
	// Generate and verify proof for tx at index 2
	proof := GenerateMerkleProof(txHashes, 2)
	fmt.Printf("Proof has %d elements\n", len(proof))
	
	isValid := VerifyMerkleProof(txHashes[2], proof, root)
	fmt.Printf("Proof valid: %v\n", isValid)
}
```

```javascript
const crypto = require('crypto');

/**
 * Performs double SHA-256 (SHA256D) hash.
 * @param {Buffer} data - Data to hash
 * @returns {Buffer} - 32-byte hash
 */
function sha256d(data) {
    const first = crypto.createHash('sha256').update(data).digest();
    return crypto.createHash('sha256').update(first).digest();
}

/**
 * Computes the Merkle root from a list of transaction hashes.
 * @param {Buffer[]} txHashes - Array of 32-byte transaction hashes
 * @returns {Buffer} - 32-byte Merkle root
 */
function computeMerkleRoot(txHashes) {
    if (txHashes.length === 0) {
        return Buffer.alloc(32);
    }
    
    let level = [...txHashes];
    
    while (level.length > 1) {
        const nextLevel = [];
        
        for (let i = 0; i < level.length; i += 2) {
            const left = level[i];
            // If odd number, duplicate the last hash
            const right = (i + 1 < level.length) ? level[i + 1] : level[i];
            
            // Concatenate and hash
            const combined = Buffer.concat([left, right]);
            nextLevel.push(sha256d(combined));
        }
        
        level = nextLevel;
    }
    
    return level[0];
}

/**
 * Generates a Merkle proof for a transaction at a given index.
 * @param {Buffer[]} txHashes - Array of transaction hashes
 * @param {number} txIndex - Index of the transaction to prove
 * @returns {Array<{hash: Buffer, isRight: boolean}>} - Proof elements
 */
function generateMerkleProof(txHashes, txIndex) {
    const proof = [];
    let index = txIndex;
    let level = [...txHashes];
    
    while (level.length > 1) {
        // Determine sibling
        const siblingIndex = (index % 2 === 0) ? index + 1 : index - 1;
        const sibling = (siblingIndex < level.length) 
            ? level[siblingIndex] : level[index];
        
        // true = sibling is on the right
        proof.push({ hash: sibling, isRight: index % 2 === 0 });
        
        // Move to next level
        const nextLevel = [];
        for (let i = 0; i < level.length; i += 2) {
            const left = level[i];
            const right = (i + 1 < level.length) ? level[i + 1] : level[i];
            nextLevel.push(sha256d(Buffer.concat([left, right])));
        }
        
        level = nextLevel;
        index = Math.floor(index / 2);
    }
    
    return proof;
}

/**
 * Verifies a Merkle proof.
 * @param {Buffer} txHash - Transaction hash to verify
 * @param {Array} proof - Merkle proof
 * @param {Buffer} root - Expected Merkle root
 * @returns {boolean} - True if proof is valid
 */
function verifyMerkleProof(txHash, proof, root) {
    let current = txHash;
    
    for (const { hash: sibling, isRight } of proof) {
        if (isRight) {
            current = sha256d(Buffer.concat([current, sibling]));
        } else {
            current = sha256d(Buffer.concat([sibling, current]));
        }
    }
    
    return current.equals(root);
}

// Example usage
const txHashes = [1, 2, 3, 4].map(i => sha256d(Buffer.from(`tx${i}`)));

const root = computeMerkleRoot(txHashes);
console.log(`Merkle root: ${root.toString('hex')}`);

// Generate and verify proof for tx at index 2
const proof = generateMerkleProof(txHashes, 2);
console.log(`Proof has ${proof.length} elements`);

const isValid = verifyMerkleProof(txHashes[2], proof, root);
console.log(`Proof valid: ${isValid}`);
```
:::

---

## The Block Template

When a miner requests work, they receive a **[block template](/docs/glossary#block-template)**:

```json
{
  "version": 536870912,
  "previousblockhash": "00000000000000000002a7c...",
  "transactions": [
    {
      "txid": "abc123...",
      "fee": 25000,
      "weight": 1000
    },
    ...
  ],
  "coinbasevalue": 312510000,
  "target": "00000000000000000004b3f...",
  "mintime": 1699999999,
  "mutable": ["time", "transactions", "coinbase"]
}
```

### Template Updates

Miners should update their template:

- **Every few seconds**: To include new high-fee transactions
- **When a new block arrives**: Previous block hash changes
- **When transactions confirm**: Remove now-invalid transactions

---

## Empty Blocks

Sometimes miners produce **empty blocks** (only coinbase transaction):

### Why Empty Blocks?

1. **Speed**: Immediately after finding a block, miners start on the next
2. **Validation lag**: New block's transactions aren't yet validated
3. **Profit**: [Block reward](/docs/glossary#block-reward) alone is still profitable

### SPV Mining

Some pools practice "SPV mining":

1. See new block header from competitor
2. Start mining on top immediately (without validating transactions)
3. If the previous block was invalid, their block is also invalid

This is risky but provides a head start.

---

## Extra Nonce

The 4-byte nonce in the header provides only 2³² possibilities, which is not enough for modern [ASICs](/docs/glossary#asic-application-specific-integrated-circuit).

### Expanding the Search Space

Miners use additional variables:

1. **Extra nonce in coinbase**: Arbitrary data that changes the Merkle root
2. **Timestamp**: Can be adjusted within limits
3. **Version bits**: Some bits can be rolled

```
Search space:
- Nonce: 4 bytes → 2³² combinations
- Extra nonce: 4-8 bytes → 2³²-2⁶⁴ combinations
- Combined: Effectively unlimited
```

---

## Block Propagation Incentives

Miners want their blocks to propagate quickly:

### Compact Blocks (BIP 152)

Instead of sending full blocks:

1. Send block header + short transaction IDs
2. Receiver reconstructs from mempool
3. Request only missing transactions

Reduces block propagation from megabytes to kilobytes.

### FIBRE Network

A private relay network for miners:

- Uses forward error correction
- Optimized routing
- Reduces orphan risk from slow propagation

---

## Practical Example

Building a block step by step:

```
1. Start with empty block
   - Weight used: 0 / 4,000,000
   - Fees collected: 0

2. Create coinbase transaction
   - Block reward: 3.125 BTC
   - Reserve space for coinbase: ~200 weight units

3. Select transactions from mempool
   - Tx1: 50 sat/vB, 500 vB, 25,000 sat fee ✓
   - Tx2: 45 sat/vB, 1000 vB, 45,000 sat fee ✓
   - Tx3: 40 sat/vB, 800 vB, 32,000 sat fee ✓
   ...continue until block is full...

4. Calculate Merkle root from all transactions

5. Assemble block header
   - Version: 0x20000000
   - Previous hash: [from chain tip]
   - Merkle root: [calculated]
   - Timestamp: [current time]
   - Bits: [current difficulty]
   - Nonce: [start searching]

6. Mine (search for valid nonce)
```

---

## Summary

Block construction is where mining meets economics:

- **Coinbase creates new bitcoin** plus collects all fees
- **Transaction selection** optimizes for fee revenue
- **Merkle trees** provide efficient verification
- **Weight limits** determine block capacity
- **Propagation speed** affects orphan risk

Miners balance:
- Including high-fee transactions (more profit)
- Keeping blocks small (faster propagation)
- Updating templates (fresh transactions)
- Starting quickly (after new block found)

---

## Related Topics

- [Mempool](/docs/mining/mempool) - Where transactions wait
- [Block Visualizer](/block-visualizer) - See transactions flowing into blocks
- [Proof-of-Work](/docs/mining/proof-of-work) - Finding valid blocks
- [Mining Economics](/docs/mining/economics) - Revenue and costs
- [Mining Pools](/docs/mining/pools) - Collaborative mining

---

## Resources

- [BIP 152: Compact Blocks](https://github.com/bitcoin/bips/blob/master/bip-0152.mediawiki)
- [Bitcoin Core getblocktemplate](https://developer.bitcoin.org/reference/rpc/getblocktemplate.html)
