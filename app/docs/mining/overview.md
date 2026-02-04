# Bitcoin Mining

Bitcoin mining is the process by which new Bitcoin transactions are verified and added to the blockchain. Miners compete to solve cryptographic puzzles using computational power, and the first miner to solve the puzzle gets to add the next block to the blockchain and receive a reward.

## Why "Mining"?

The term "mining" is borrowed from gold mining. Just as gold miners expend resources (labor, equipment, energy) to extract gold from the earth, Bitcoin miners expend computational resources (hardware, electricity) to "extract" new bitcoin from the protocol.

The analogy runs deeper:

| Gold Mining | Bitcoin Mining |
|-------------|----------------|
| Requires work to extract value | Requires computational work (proof-of-work) |
| Gold supply is finite | Bitcoin supply is capped at 21 million |
| Gets harder to mine over time (deeper deposits) | Gets harder over time ([difficulty adjustment](/docs/mining/difficulty)) |
| New gold enters circulation through mining | New bitcoin enters circulation through mining |
| Anyone can mine (permissionless) | Anyone can mine (permissionless) |

This parallel was intentional. [Satoshi Nakamoto](/docs/history/people) designed Bitcoin to be "digital gold": a scarce, hard money that requires real-world cost to produce, preventing arbitrary inflation.

---

## What Mining Does

Mining serves two critical functions:
1. **Transaction Processing**: Validating and confirming transactions
2. **Currency Issuance**: Creating new bitcoin according to the predetermined [supply schedule](/docs/history/halvings)

---

## How Mining Works

### Block Creation Process

1. **Transaction Collection**: Miners collect pending transactions from the mempool
2. **Block Construction**: Miners assemble transactions into a candidate block
3. **Proof-of-Work**: Miners repeatedly hash the block header with different nonce values
4. **Difficulty Target**: The hash must be below a certain target (determined by network difficulty)
5. **Block Discovery**: When a miner finds a valid hash, they broadcast the block to the network
6. **Block Validation**: Other nodes verify the block and add it to their blockchain
7. **Reward**: The successful miner receives the block reward plus transaction fees

### The Mining Algorithm

The core of Bitcoin mining is finding a nonce that, when combined with the block header data and hashed twice with SHA-256, produces a value below the current difficulty target.

:::code-group
```rust
use sha2::{Sha256, Digest};

/// Demonstrates the basic mining hash calculation.
/// In real mining, this would be optimized and run billions of times.
fn mine_block_header(header: &[u8], target: &[u8; 32]) -> Option<u32> {
    for nonce in 0..u32::MAX {
        // Create header with nonce (simplified - real headers are 80 bytes)
        let mut data = header.to_vec();
        data.extend_from_slice(&nonce.to_le_bytes());
        
        // Double SHA-256 (SHA256D)
        let first_hash = Sha256::digest(&data);
        let hash = Sha256::digest(&first_hash);
        
        // Check if hash is below target (simplified comparison)
        if hash.as_slice() < target {
            return Some(nonce);
        }
    }
    None
}

fn main() {
    // Example: very easy target for demonstration
    let header = b"example block header data";
    let easy_target = [0x0F; 32]; // Very easy target
    
    if let Some(nonce) = mine_block_header(header, &easy_target) {
        println!("Found valid nonce: {}", nonce);
    }
}
```

```python
import hashlib
import struct

def sha256d(data: bytes) -> bytes:
    """Double SHA-256 hash."""
    return hashlib.sha256(hashlib.sha256(data).digest()).digest()

def mine_block_header(header: bytes, target: bytes, max_nonce: int = 1_000_000) -> int | None:
    """
    Demonstrates the basic mining hash calculation.
    In real mining, this would be optimized and run billions of times.
    
    Args:
        header: Block header data (without nonce)
        target: 32-byte target hash
        max_nonce: Maximum nonces to try
    
    Returns:
        Valid nonce if found, None otherwise
    """
    for nonce in range(max_nonce):
        # Add nonce to header (little-endian 4-byte integer)
        data = header + struct.pack('<I', nonce)
        
        # Double SHA-256
        hash_result = sha256d(data)
        
        # Check if hash is below target
        if hash_result < target:
            return nonce
    
    return None

# Example: very easy target for demonstration
header = b"example block header data"
easy_target = bytes([0x0F] * 32)  # Very easy target

nonce = mine_block_header(header, easy_target)
if nonce is not None:
    print(f"Found valid nonce: {nonce}")
```

```cpp
#include <iostream>
#include <vector>
#include <cstring>
#include <openssl/sha.h>

/**
 * Performs double SHA-256 (SHA256D) hash.
 */
void sha256d(const unsigned char* data, size_t len, unsigned char* out) {
    unsigned char first_hash[SHA256_DIGEST_LENGTH];
    SHA256(data, len, first_hash);
    SHA256(first_hash, SHA256_DIGEST_LENGTH, out);
}

/**
 * Demonstrates the basic mining hash calculation.
 * In real mining, this would be optimized and run billions of times.
 * 
 * @param header Block header data
 * @param header_len Length of header
 * @param target 32-byte target hash
 * @param max_nonce Maximum nonces to try
 * @return Valid nonce if found, -1 otherwise
 */
int64_t mine_block_header(const unsigned char* header, size_t header_len,
                          const unsigned char* target, uint32_t max_nonce = 1000000) {
    std::vector<unsigned char> data(header_len + 4);
    unsigned char hash[SHA256_DIGEST_LENGTH];
    
    for (uint32_t nonce = 0; nonce < max_nonce; ++nonce) {
        // Create header with nonce
        memcpy(data.data(), header, header_len);
        memcpy(data.data() + header_len, &nonce, 4);  // Little-endian
        
        // Double SHA-256
        sha256d(data.data(), data.size(), hash);
        
        // Check if hash is below target
        if (memcmp(hash, target, 32) < 0) {
            return nonce;
        }
    }
    return -1;
}

int main() {
    // Example: very easy target for demonstration
    const unsigned char header[] = "example block header data";
    unsigned char easy_target[32];
    memset(easy_target, 0x0F, 32);  // Very easy target
    
    int64_t nonce = mine_block_header(header, strlen((char*)header), easy_target);
    if (nonce >= 0) {
        std::cout << "Found valid nonce: " << nonce << std::endl;
    }
    return 0;
}
```

```go
package main

import (
	"crypto/sha256"
	"encoding/binary"
	"fmt"
)

// sha256d performs double SHA-256 hash
func sha256d(data []byte) []byte {
	first := sha256.Sum256(data)
	second := sha256.Sum256(first[:])
	return second[:]
}

// mineBlockHeader demonstrates the basic mining hash calculation.
// In real mining, this would be optimized and run billions of times.
func mineBlockHeader(header []byte, target []byte, maxNonce uint32) (uint32, bool) {
	data := make([]byte, len(header)+4)
	copy(data, header)
	
	for nonce := uint32(0); nonce < maxNonce; nonce++ {
		// Add nonce to header (little-endian 4-byte integer)
		binary.LittleEndian.PutUint32(data[len(header):], nonce)
		
		// Double SHA-256
		hash := sha256d(data)
		
		// Check if hash is below target
		if compareBytes(hash, target) < 0 {
			return nonce, true
		}
	}
	return 0, false
}

func compareBytes(a, b []byte) int {
	for i := 0; i < len(a) && i < len(b); i++ {
		if a[i] < b[i] {
			return -1
		}
		if a[i] > b[i] {
			return 1
		}
	}
	return 0
}

func main() {
	// Example: very easy target for demonstration
	header := []byte("example block header data")
	easyTarget := make([]byte, 32)
	for i := range easyTarget {
		easyTarget[i] = 0x0F // Very easy target
	}
	
	nonce, found := mineBlockHeader(header, easyTarget, 1_000_000)
	if found {
		fmt.Printf("Found valid nonce: %d\n", nonce)
	}
}
```

```javascript
const crypto = require('crypto');

/**
 * Performs double SHA-256 (SHA256D) hash.
 * @param {Buffer} data - Data to hash
 * @returns {Buffer} - Double SHA-256 hash
 */
function sha256d(data) {
    const firstHash = crypto.createHash('sha256').update(data).digest();
    return crypto.createHash('sha256').update(firstHash).digest();
}

/**
 * Demonstrates the basic mining hash calculation.
 * In real mining, this would be optimized and run billions of times.
 * 
 * @param {Buffer} header - Block header data (without nonce)
 * @param {Buffer} target - 32-byte target hash
 * @param {number} maxNonce - Maximum nonces to try
 * @returns {number|null} - Valid nonce if found, null otherwise
 */
function mineBlockHeader(header, target, maxNonce = 1_000_000) {
    for (let nonce = 0; nonce < maxNonce; nonce++) {
        // Add nonce to header (little-endian 4-byte integer)
        const nonceBuffer = Buffer.alloc(4);
        nonceBuffer.writeUInt32LE(nonce);
        const data = Buffer.concat([header, nonceBuffer]);
        
        // Double SHA-256
        const hash = sha256d(data);
        
        // Check if hash is below target
        if (hash.compare(target) < 0) {
            return nonce;
        }
    }
    return null;
}

// Example: very easy target for demonstration
const header = Buffer.from('example block header data');
const easyTarget = Buffer.alloc(32, 0x0F);  // Very easy target

const nonce = mineBlockHeader(header, easyTarget);
if (nonce !== null) {
    console.log(`Found valid nonce: ${nonce}`);
}
```
:::

### Mining Hardware

- **ASIC Miners**: Application-Specific Integrated Circuits designed specifically for Bitcoin mining (most efficient)
- **GPU Mining**: Graphics Processing Units (less efficient than ASICs, rarely profitable)
- **CPU Mining**: Central Processing Units (least efficient, primarily educational)

See [Hardware Evolution](/docs/mining/hardware) for the complete history of mining hardware development.

### Mining Pools

Most miners join mining pools to:
- **Reduce Variance**: Share rewards with other miners
- **Consistent Payouts**: Receive smaller but regular payments
- **Lower Barrier**: Don't need to find a full block individually
- **Combine Hash Power**: Pool hash rate increases chances of finding blocks

See [Mining Pools](/docs/mining/pools) for detailed information on pool operations and payout schemes.

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Proof-of-Work** | Cryptographic puzzle that miners solve to validate blocks |
| **Block Reward** | Currently 3.125 BTC per block (after 2024 halving) |
| **Difficulty** | Adjusts every 2016 blocks to maintain ~10 minute block times |
| **Hash Rate** | Measure of mining power (network: ~700 EH/s) |
| **[Coinbase Transaction](/docs/bitcoin/coinbase-transaction)** | Special transaction that creates new bitcoin as block reward |

---

## Why Mining Matters

### Network Security

Mining provides Bitcoin's security through proof-of-work. To attack the network, an adversary would need to control more than 50% of the global hash rate: an astronomically expensive proposition requiring billions of dollars in hardware and electricity. See [Mining Attacks](/docs/mining/attacks) for more on security considerations.

### Decentralization

Unlike traditional payment systems with central authorities, Bitcoin's mining is permissionless. Anyone with hardware and electricity can participate, contributing to the network's [decentralization](/docs/fundamentals/decentralization).

### Monetary Policy Enforcement

Mining enforces Bitcoin's fixed [supply schedule](/docs/history/halvings). The protocol rules embedded in mining software ensure that:
- Only ~21 million bitcoin will ever exist
- Block rewards halve every 210,000 blocks
- No entity can create bitcoin outside the rules

---

## Mining Today

### Current Statistics (2024)

- **Network Hash Rate**: ~700 EH/s (exahashes per second)
- **Block Reward**: 3.125 BTC
- **Average Block Time**: ~10 minutes
- **Difficulty**: Adjusts every ~2 weeks
- **Daily Blocks**: ~144

### Who Mines?

Modern Bitcoin mining is dominated by:
- **Industrial Operations**: Large-scale facilities with thousands of ASICs
- **Mining Pools**: Collectives that combine hash power
- **Home Miners**: Hobbyists and those with cheap electricity

---

## Related Topics

- [Proof-of-Work Mechanism](/docs/mining/proof-of-work) - How the mining algorithm works
- [Difficulty Adjustment](/docs/mining/difficulty) - How difficulty adjusts to maintain block times
- [Mining Economics](/docs/mining/economics) - Block rewards, fees, and profitability
- [Block Construction](/docs/mining/block-construction) - How miners build blocks
- [Mining Pools](/docs/mining/pools) - Collaborative mining operations
- [Mining Attacks](/docs/mining/attacks) - Mining-specific attack vectors
- [Network Attacks & Security](/docs/mining/network-attacks) - Network-layer security threats
