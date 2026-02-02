# Merkle Trees

Merkle trees are a fundamental data structure in Bitcoin that enable efficient verification of transaction inclusion in blocks. They provide cryptographic proof that specific transactions are part of a block without downloading the entire block. The structure is named after [Ralph Merkle](/docs/history/people#ralph-merkle), who invented it in 1979; Satoshi cited the concept in the Bitcoin whitepaper.

<img src="/images/docs/merkle-tree.png" alt="Merkle Tree Structure" class="doc-img-big" />
<p class="doc-img-legend">Merkle Tree Structure</p>

A **Merkle tree** (also called a hash tree) is a binary tree where:

- **Leaves**: Hash of individual transactions
- **Internal nodes**: Hash of child nodes
- **Root**: Single hash representing all transactions

The Merkle root is stored in the block header, providing a compact commitment to all transactions in the block.

---

## How It Works

### Construction

1. **Hash each transaction**: Create leaf nodes
2. **Pair and hash**: Combine pairs, hash result
3. **Repeat**: Continue until single root hash
4. **Store root**: Root hash goes in block header

```text
[Hash each transaction] --> [Pair and hash] --> [Repeat until one hash] --> [Merkle root in block header]
```

### Verification

To prove transaction inclusion:

1. **Request Merkle path**: Get hashes needed to reconstruct path
2. **Reconstruct path**: Hash from transaction to root
3. **Compare roots**: Match against block header root

---

## Code Examples

### Building a Merkle Tree

:::code-group
```rust
use sha2::{Sha256, Digest};

fn merkle_root(transactions: &[Vec<u8>]) -> [u8; 32] {
    if transactions.is_empty() {
        return [0; 32];
    }
    
    let mut hashes: Vec<[u8; 32]> = transactions
        .iter()
        .map(|tx| {
            let mut hasher = Sha256::new();
            hasher.update(tx);
            let first = hasher.finalize();
            let mut hasher = Sha256::new();
            hasher.update(first);
            hasher.finalize().into()
        })
        .collect();
    
    while hashes.len() > 1 {
        let mut next_level = Vec::new();
        for i in (0..hashes.len()).step_by(2) {
            if i + 1 < hashes.len() {
                let combined = [hashes[i].as_ref(), hashes[i + 1].as_ref()].concat();
                let mut hasher = Sha256::new();
                hasher.update(&combined);
                let first = hasher.finalize();
                let mut hasher = Sha256::new();
                hasher.update(first);
                next_level.push(hasher.finalize().into());
            } else {
                next_level.push(hashes[i]);
            }
        }
        hashes = next_level;
    }
    
    hashes[0]
}
```

```python
import hashlib

def sha256d(data):
    """Double SHA-256 hash."""
    return hashlib.sha256(hashlib.sha256(data).digest()).digest()

def merkle_root(transactions):
    """Calculate Merkle root from transactions."""
    if not transactions:
        return b'\x00' * 32
    
    # Hash each transaction
    hashes = [sha256d(tx) for tx in transactions]
    
    # Build tree
    while len(hashes) > 1:
        next_level = []
        for i in range(0, len(hashes), 2):
            if i + 1 < len(hashes):
                combined = hashes[i] + hashes[i + 1]
                next_level.append(sha256d(combined))
            else:
                next_level.append(hashes[i])
        hashes = next_level
    
    return hashes[0]
```

```cpp
#include <vector>
#include <openssl/sha.h>

void sha256d(const unsigned char* data, size_t len, unsigned char* out) {
    unsigned char first[SHA256_DIGEST_LENGTH];
    SHA256(data, len, first);
    SHA256(first, SHA256_DIGEST_LENGTH, out);
}

void merkle_root(
    const std::vector<std::vector<unsigned char>>& transactions,
    unsigned char* root
) {
    if (transactions.empty()) {
        memset(root, 0, 32);
        return;
    }
    
    std::vector<unsigned char> hashes;
    for (const auto& tx : transactions) {
        unsigned char hash[32];
        sha256d(tx.data(), tx.size(), hash);
        hashes.insert(hashes.end(), hash, hash + 32);
    }
    
    while (hashes.size() > 32) {
        std::vector<unsigned char> next_level;
        for (size_t i = 0; i < hashes.size(); i += 64) {
            if (i + 32 < hashes.size()) {
                unsigned char combined[64];
                memcpy(combined, &hashes[i], 32);
                memcpy(combined + 32, &hashes[i + 32], 32);
                unsigned char hash[32];
                sha256d(combined, 64, hash);
                next_level.insert(next_level.end(), hash, hash + 32);
            } else {
                next_level.insert(next_level.end(), 
                    hashes.begin() + i, hashes.end());
            }
        }
        hashes = next_level;
    }
    
    memcpy(root, hashes.data(), 32);
}
```

```go
package main

import (
	"crypto/sha256"
)

func sha256d(data []byte) []byte {
	first := sha256.Sum256(data)
	second := sha256.Sum256(first[:])
	return second[:]
}

func merkleRoot(transactions [][]byte) []byte {
	if len(transactions) == 0 {
		return make([]byte, 32)
	}
	
	hashes := make([][]byte, len(transactions))
	for i, tx := range transactions {
		hashes[i] = sha256d(tx)
	}
	
	for len(hashes) > 1 {
		var nextLevel [][]byte
		for i := 0; i < len(hashes); i += 2 {
			if i+1 < len(hashes) {
				combined := append(hashes[i], hashes[i+1]...)
				nextLevel = append(nextLevel, sha256d(combined))
			} else {
				nextLevel = append(nextLevel, hashes[i])
			}
		}
		hashes = nextLevel
	}
	
	return hashes[0]
}
```

```javascript
const crypto = require('crypto');

function sha256d(data) {
    const first = crypto.createHash('sha256').update(data).digest();
    return crypto.createHash('sha256').update(first).digest();
}

function merkleRoot(transactions) {
    if (transactions.length === 0) {
        return Buffer.alloc(32, 0);
    }
    
    let hashes = transactions.map(tx => sha256d(tx));
    
    while (hashes.length > 1) {
        const nextLevel = [];
        for (let i = 0; i < hashes.length; i += 2) {
            if (i + 1 < hashes.length) {
                const combined = Buffer.concat([hashes[i], hashes[i + 1]]);
                nextLevel.push(sha256d(combined));
            } else {
                nextLevel.push(hashes[i]);
            }
        }
        hashes = nextLevel;
    }
    
    return hashes[0];
}
```
:::

---

## SPV (Simplified Payment Verification)

Merkle trees enable SPV clients:

```text
SPV Client:
1. Downloads block headers only (~80 bytes each)
2. Requests Merkle proof for specific transaction
3. Verifies proof without full block
4. Confirms transaction inclusion
```

### Merkle Proof

```text
[Hash of Tx2 leaf] --> [Hash of Tx1 sibling] --> [Hash CD parent sibling] --> [Root hash from block header]
```

Verification:
1. Hash(Tx2) = leaf hash
2. Hash(Hash(Tx1) + Hash(Tx2)) = Hash AB
3. Hash(Hash AB + Hash CD) = Root
4. Root matches block header ✓

---

## Block Header

Merkle root is stored in block header:

```text
[Block Header 80 bytes]
├── Version (4 bytes)
├── Previous Block Hash (32 bytes)
├── Merkle Root (32 bytes) - Merkle tree root
├── Timestamp (4 bytes)
├── Difficulty Target (4 bytes)
└── Nonce (4 bytes)
```

---

## Benefits

### Efficiency

- **Compact proofs**: Small Merkle paths vs. full blocks
- **Fast verification**: Logarithmic complexity
- **Bandwidth savings**: SPV clients need minimal data

### Security

- **Cryptographic integrity**: Any change breaks root hash
- **Tamper detection**: Modified transactions invalidate root
- **Trustless verification**: No need to trust third parties

---

## Related Topics

- [Block Structure](/docs/bitcoin/blocks) - How blocks are organized
- SPV - Simplified payment verification
- [Cryptography](/docs/bitcoin/cryptography) - Hash functions

---

## Resources

- [Merkle Tree Wikipedia](https://en.wikipedia.org/wiki/Merkle_tree)
- [Bitcoin Merkle Trees](https://en.bitcoin.it/wiki/Protocol_documentation#Merkle_Trees)
