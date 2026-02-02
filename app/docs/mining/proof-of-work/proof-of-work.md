# Proof-of-Work Mechanism

Bitcoin uses a **proof-of-work** consensus mechanism where miners compete to solve a cryptographic puzzle. This process secures the network and validates transactions.

## How It Works

1. **Block Construction**: Miners collect transactions from the mempool and create a candidate block
2. **Nonce Search**: Miners repeatedly hash the block header with different nonce values
3. **Difficulty Target**: The hash must be below a certain target (set by network difficulty)
4. **Success**: When a miner finds a valid hash, they broadcast the block to the network
5. **Reward**: The miner receives the block reward (currently 3.125 BTC) plus transaction fees

```text
           [Construct block]
                  |
                  |
          [Hash block header]
                  |
                  |
            [Below target?]
                 / \
               Yes  No
               /      \
              /        \
[Broadcast block]  [Change nonce or coinbase] --> (back to Hash)
```

---

## Mining Difficulty

- **Adjustment**: Every 2016 blocks (~2 weeks), the difficulty adjusts based on network hash rate
- **Target**: Maintains ~10 minute average block time
- **Current Network Hash Rate**: ~700 EH/s (exahashes per second)
- **See Also**: [Difficulty Adjustment](/docs/mining/difficulty) for detailed explanation

---

## Technical Details

### Block Headers
- **Size**: 80 bytes of block metadata
- **Components**: Version, previous block hash, merkle root, timestamp, difficulty target, nonce
- **Hash Function**: SHA256D (double SHA-256)

### Nonce Space
- **Range**: 0 to 4,294,967,295 (2^32 - 1)
- **Exhaustion**: If all nonces fail, miners change the coinbase transaction or timestamp
- **Search Space**: Effectively unlimited through coinbase modifications

### Target Difficulty
- **Network-Wide**: All miners compete against the same target
- **Dynamic**: Adjusts every 2016 blocks based on actual vs. target block time
- **Purpose**: Maintains consistent block production rate

---

## Hash Function: SHA256D

Bitcoin uses a double SHA-256 hash function:

```
hash = SHA256(SHA256(block_header))
```

This means:
1. First SHA-256 hash of the block header
2. Second SHA-256 hash of the first hash result
3. Result must be below the network difficulty target

Try it with the [Hash tool](/tools/hash).

### SHA256D Implementation

:::code-group
```rust
// In Cargo.toml: hex = "0.4"
use hex;
use sha2::{Sha256, Digest};

/// Performs double SHA-256 (SHA256D) hash.
/// This is the core hashing algorithm used in Bitcoin mining.
fn sha256d(data: &[u8]) -> [u8; 32] {
    let first_hash = Sha256::digest(data);
    let second_hash = Sha256::digest(&first_hash);
    second_hash.into()
}

/// Checks if a hash meets the difficulty target.
/// The hash must be numerically less than the target.
fn meets_target(hash: &[u8; 32], target: &[u8; 32]) -> bool {
    // Compare bytes from most significant to least significant
    for i in (0..32).rev() {
        if hash[i] < target[i] {
            return true;
        } else if hash[i] > target[i] {
            return false;
        }
    }
    true // Equal hashes meet the target
}

/// Constructs an 80-byte block header and performs proof-of-work.
fn mine_block(
    version: u32,
    prev_hash: &[u8; 32],
    merkle_root: &[u8; 32],
    timestamp: u32,
    bits: u32,
    target: &[u8; 32],
) -> Option<(u32, [u8; 32])> {
    let mut header = [0u8; 80];
    
    // Build header (all fields little-endian)
    header[0..4].copy_from_slice(&version.to_le_bytes());
    header[4..36].copy_from_slice(prev_hash);
    header[36..68].copy_from_slice(merkle_root);
    header[68..72].copy_from_slice(&timestamp.to_le_bytes());
    header[72..76].copy_from_slice(&bits.to_le_bytes());
    
    for nonce in 0..u32::MAX {
        header[76..80].copy_from_slice(&nonce.to_le_bytes());
        let hash = sha256d(&header);
        
        if meets_target(&hash, target) {
            return Some((nonce, hash));
        }
    }
    None
}

fn main() {
    let data = b"Hello, Bitcoin!";
    let hash = sha256d(data);
    println!("SHA256D hash: {}", hex::encode(hash));
}
```

```python
import hashlib
import struct

def sha256d(data: bytes) -> bytes:
    """
    Performs double SHA-256 (SHA256D) hash.
    This is the core hashing algorithm used in Bitcoin mining.
    
    Args:
        data: The data to hash
    
    Returns:
        32-byte SHA256D hash
    """
    first_hash = hashlib.sha256(data).digest()
    return hashlib.sha256(first_hash).digest()

def meets_target(hash_bytes: bytes, target: bytes) -> bool:
    """
    Checks if a hash meets the difficulty target.
    The hash must be numerically less than the target.
    
    Args:
        hash_bytes: 32-byte hash to check
        target: 32-byte target threshold
    
    Returns:
        True if hash meets target (is less than target)
    """
    # Compare as big-endian integers
    return int.from_bytes(hash_bytes, 'big') < int.from_bytes(target, 'big')

def mine_block(version: int, prev_hash: bytes, merkle_root: bytes,
               timestamp: int, bits: int, target: bytes,
               max_nonce: int = 1_000_000) -> tuple[int, bytes] | None:
    """
    Constructs an 80-byte block header and performs proof-of-work.
    
    Args:
        version: Block version
        prev_hash: 32-byte previous block hash
        merkle_root: 32-byte merkle root
        timestamp: Unix timestamp
        bits: Compact difficulty representation
        target: 32-byte target hash
        max_nonce: Maximum nonces to try
    
    Returns:
        Tuple of (nonce, hash) if found, None otherwise
    """
    # Build header without nonce (76 bytes)
    header_base = struct.pack('<I', version)  # 4 bytes
    header_base += prev_hash                   # 32 bytes
    header_base += merkle_root                 # 32 bytes
    header_base += struct.pack('<I', timestamp)  # 4 bytes
    header_base += struct.pack('<I', bits)     # 4 bytes
    
    for nonce in range(max_nonce):
        header = header_base + struct.pack('<I', nonce)
        hash_result = sha256d(header)
        
        if meets_target(hash_result, target):
            return (nonce, hash_result)
    
    return None

# Example usage
data = b"Hello, Bitcoin!"
hash_result = sha256d(data)
print(f"SHA256D hash: {hash_result.hex()}")
```

```cpp
#include <iostream>
#include <iomanip>
#include <cstring>
#include <openssl/sha.h>

/**
 * Performs double SHA-256 (SHA256D) hash.
 * This is the core hashing algorithm used in Bitcoin mining.
 * 
 * @param data Input data to hash
 * @param len Length of input data
 * @param out Output buffer for 32-byte hash
 */
void sha256d(const unsigned char* data, size_t len, unsigned char* out) {
    unsigned char first_hash[SHA256_DIGEST_LENGTH];
    SHA256(data, len, first_hash);
    SHA256(first_hash, SHA256_DIGEST_LENGTH, out);
}

/**
 * Checks if a hash meets the difficulty target.
 * The hash must be numerically less than the target.
 * 
 * @param hash 32-byte hash to check
 * @param target 32-byte target threshold
 * @return true if hash meets target
 */
bool meets_target(const unsigned char* hash, const unsigned char* target) {
    // Compare bytes from most significant to least significant
    for (int i = 31; i >= 0; --i) {
        if (hash[i] < target[i]) return true;
        if (hash[i] > target[i]) return false;
    }
    return true;  // Equal hashes meet the target
}

/**
 * Constructs an 80-byte block header and performs proof-of-work.
 * 
 * @param version Block version
 * @param prev_hash 32-byte previous block hash
 * @param merkle_root 32-byte merkle root
 * @param timestamp Unix timestamp
 * @param bits Compact difficulty representation
 * @param target 32-byte target hash
 * @param out_nonce Output: valid nonce if found
 * @param out_hash Output: resulting hash
 * @param max_nonce Maximum nonces to try
 * @return true if valid nonce found
 */
bool mine_block(uint32_t version, const unsigned char* prev_hash,
                const unsigned char* merkle_root, uint32_t timestamp,
                uint32_t bits, const unsigned char* target,
                uint32_t* out_nonce, unsigned char* out_hash,
                uint32_t max_nonce = 1000000) {
    unsigned char header[80];
    
    // Build header (all fields little-endian)
    memcpy(header, &version, 4);
    memcpy(header + 4, prev_hash, 32);
    memcpy(header + 36, merkle_root, 32);
    memcpy(header + 68, &timestamp, 4);
    memcpy(header + 72, &bits, 4);
    
    for (uint32_t nonce = 0; nonce < max_nonce; ++nonce) {
        memcpy(header + 76, &nonce, 4);
        sha256d(header, 80, out_hash);
        
        if (meets_target(out_hash, target)) {
            *out_nonce = nonce;
            return true;
        }
    }
    return false;
}

int main() {
    const char* data = "Hello, Bitcoin!";
    unsigned char hash[SHA256_DIGEST_LENGTH];
    
    sha256d((unsigned char*)data, strlen(data), hash);
    
    std::cout << "SHA256D hash: ";
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) {
        std::cout << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }
    std::cout << std::endl;
    
    return 0;
}
```

```go
package main

import (
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"fmt"
)

// SHA256D performs double SHA-256 (SHA256D) hash.
func SHA256D(data []byte) []byte {
	first := sha256.Sum256(data)
	second := sha256.Sum256(first[:])
	return second[:]
}

// MeetsTarget checks if a hash meets the difficulty target.
// The hash must be numerically less than the target.
func MeetsTarget(hash []byte, target []byte) bool {
	// Compare bytes from most significant to least significant
	for i := 31; i >= 0; i-- {
		if hash[i] < target[i] {
			return true
		}
		if hash[i] > target[i] {
			return false
		}
	}
	return true // Equal hashes meet the target
}

// MineBlock constructs an 80-byte block header and performs proof-of-work.
func MineBlock(version uint32, prevHash []byte, merkleRoot []byte, timestamp uint32, bits uint32, target []byte, maxNonce uint32) (uint32, []byte, bool) {
	header := make([]byte, 80)
	
	// Build header (all fields little-endian)
	binary.LittleEndian.PutUint32(header[0:4], version)
	copy(header[4:36], prevHash)
	copy(header[36:68], merkleRoot)
	binary.LittleEndian.PutUint32(header[68:72], timestamp)
	binary.LittleEndian.PutUint32(header[72:76], bits)
	
	for nonce := uint32(0); nonce < maxNonce; nonce++ {
		binary.LittleEndian.PutUint32(header[76:80], nonce)
		
		hash := SHA256D(header)
		
		if MeetsTarget(hash, target) {
			return nonce, hash, true
		}
	}
	return 0, nil, false
}

func main() {
	// Example usage
	data := []byte("Hello, Bitcoin!")
	hash := SHA256D(data)
	fmt.Printf("SHA256D hash: %s\n", hex.EncodeToString(hash))
}
```

```javascript
const crypto = require('crypto');

/**
 * Performs double SHA-256 (SHA256D) hash.
 * This is the core hashing algorithm used in Bitcoin mining.
 * 
 * @param {Buffer} data - The data to hash
 * @returns {Buffer} - 32-byte SHA256D hash
 */
function sha256d(data) {
    const firstHash = crypto.createHash('sha256').update(data).digest();
    return crypto.createHash('sha256').update(firstHash).digest();
}

/**
 * Checks if a hash meets the difficulty target.
 * The hash must be numerically less than the target.
 * 
 * @param {Buffer} hash - 32-byte hash to check
 * @param {Buffer} target - 32-byte target threshold
 * @returns {boolean} - True if hash meets target
 */
function meetsTarget(hash, target) {
    // compare() returns negative if hash < target
    return hash.compare(target) < 0;
}

/**
 * Constructs an 80-byte block header and performs proof-of-work.
 * 
 * @param {number} version - Block version
 * @param {Buffer} prevHash - 32-byte previous block hash
 * @param {Buffer} merkleRoot - 32-byte merkle root
 * @param {number} timestamp - Unix timestamp
 * @param {number} bits - Compact difficulty representation
 * @param {Buffer} target - 32-byte target hash
 * @param {number} maxNonce - Maximum nonces to try
 * @returns {{nonce: number, hash: Buffer}|null} - Result or null
 */
function mineBlock(version, prevHash, merkleRoot, timestamp, bits, target, maxNonce = 1_000_000) {
    // Build header without nonce (76 bytes)
    const headerBase = Buffer.alloc(76);
    headerBase.writeUInt32LE(version, 0);
    prevHash.copy(headerBase, 4);
    merkleRoot.copy(headerBase, 36);
    headerBase.writeUInt32LE(timestamp, 68);
    headerBase.writeUInt32LE(bits, 72);
    
    const header = Buffer.alloc(80);
    headerBase.copy(header);
    
    for (let nonce = 0; nonce < maxNonce; nonce++) {
        header.writeUInt32LE(nonce, 76);
        const hash = sha256d(header);
        
        if (meetsTarget(hash, target)) {
            return { nonce, hash };
        }
    }
    return null;
}

// Example usage
const data = Buffer.from('Hello, Bitcoin!');
const hash = sha256d(data);
console.log(`SHA256D hash: ${hash.toString('hex')}`);
```
:::

---

## Mining Process Flow

```
1. Collect Transactions
   ↓
2. Build Block Header
   ↓
3. Hash Block Header
   ↓
4. Check if Hash < Target
   ├─ Yes → Broadcast Block → Receive Reward
   └─ No → Increment Nonce → Repeat from Step 3
```

---

## Educational Value

### What You'll Learn
1. **Block Construction**: How Bitcoin blocks are built
2. **Mining Algorithms**: SHA256D hash function
3. **Network Protocol**: RPC communication with Bitcoin node
4. **Difficulty Adjustment**: How network difficulty works
5. **Economic Incentives**: Why mining is competitive

### Technical Concepts
- **Block Headers**: 80-byte block metadata
- **Coinbase Transactions**: Special reward transactions
- **Merkle Trees**: Transaction organization
- **Nonce Space**: 4.3 billion possible values
- **Difficulty Target**: Network-wide mining target

---

## Related Topics

- [Bitcoin Mining](/docs/mining) - Mining architecture and concepts
- [Mining Economics](/docs/mining/economics) - Rewards and profitability
- [Difficulty Adjustment](/docs/mining/difficulty) - How difficulty adjusts over time
- [Block Construction](/docs/mining/block-construction) - How blocks are assembled
