# Block Propagation

This document explains how blocks propagate through the Bitcoin network, including the [gossip protocol](/docs/glossary#gossip-protocol), validation process, and [orphan block](/docs/glossary#orphan-block) handling.

## Block Structure

<img src="/images/docs/bitcoin-block-overview.jpg" alt="Bitcoin Block Structure" class="doc-img-big" />
<p class="doc-img-legend">Bitcoin Block Structure</p>

A Bitcoin block consists of:
- **Block Header** (80 bytes): Contains version, previous block hash, merkle root, timestamp, difficulty target, and nonce
- **Transaction Count**: Variable-length integer indicating number of transactions
- **Transactions**: List of transactions, starting with the coinbase transaction

The block header is hashed twice with SHA-256 to produce the block hash, which must meet the difficulty target for the block to be valid. See the [Block Visualizer](/block-visualizer) to explore the latest blocks and transactions.

---

## Block Propagation Flow

### 1. Block Discovery and Initial Broadcast

When a miner finds a new block:

1. **Miner solves [proof-of-work](/docs/glossary#pow) puzzle**: Finds a valid nonce
2. **Creates valid block**: Includes transactions from [mempool](/docs/glossary#mempool)
3. **Immediately broadcasts**: Sends to all connected [peers](/docs/glossary#peer) (8-10 first-hop nodes)
4. **First-hop nodes validate**: Each node checks the block
5. **First-hop nodes forward**: Send to their peers (50-100 second-hop nodes)
6. **Your node receives**: Eventually gets the block from one or more peers
7. **Your node validates**: Thoroughly checks the block
8. **Your node forwards**: Sends to peers who haven't seen it yet

| Step | Actor | Action |
|------|-------|--------|
| 1 | Miner | Solve PoW; build block from mempool |
| 2 | Miner | Broadcast block to connected peers |
| 3 | First-hop nodes | Validate block; forward to their peers |
| 4 | Receiving node | Validate; forward to peers that have not seen it |

```mermaid
flowchart LR
  Miner[Miner]
  Peer1[First-hop peers]
  Peer2[Second-hop peers]
  Node[Your node]
  Miner --> Peer1 --> Peer2 --> Node
```

### 2. Gossip Protocol Mechanism

**Key Rule**: Nodes never re-broadcast blocks back to the peer that sent them.

**What happens:**
- Peer A sends you the block
- You validate and accept it
- You forward to Peers D, E, F (but NOT back to Peer A)
- This prevents infinite loops and network flooding

### 3. Block Validation Process

Each full node performs complete validation:

1. **Header Validation**
   - Proof-of-work meets [difficulty](/docs/glossary#difficulty) target
   - Timestamp is reasonable
   - Version is acceptable
   - Previous block hash is correct

2. **Transaction Validation**
   - All transactions are valid
   - No [double-spends](/docs/glossary#double-spend)
   - Proper signatures
   - [UTXO](/docs/glossary#utxo) references are correct
   - [Consensus rules](/docs/glossary#consensus-rules) compliance

3. **[Merkle Tree](/docs/glossary#merkle-tree) Verification**
   - Merkle root matches transactions
   - Tree structure is valid

4. **Chain Validity**
   - Builds on valid previous block
   - Maintains blockchain integrity

---

## Compact Block Relay (BIP 152)

Compact blocks dramatically reduce propagation bandwidth and latency:

### How It Works

Instead of sending full blocks (~1-2 MB), nodes send:
1. **Block header** (80 bytes)
2. **Short transaction IDs** (6 bytes each)
3. **Prefilled transactions** (usually just the [coinbase](/docs/glossary#coinbase-transaction))

The receiving node reconstructs the full block using transactions already in its mempool.

### Benefits

- **90% bandwidth reduction**: Most transactions are already known
- **Faster propagation**: Smaller data means quicker transmission
- **Reduced orphan rates**: Faster propagation reduces stale blocks

### Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| Low bandwidth | Request-based, saves bandwidth | Default for most peers |
| High bandwidth | Pushed immediately | Selected fast peers (up to 3) |

---

## Headers-First Synchronization

New nodes use headers-first sync for efficient IBD (Initial Block Download):

1. Download all block headers first (~60 MB total)
2. Validate the header chain (proof-of-work, timestamps)
3. Download full blocks in parallel from multiple peers
4. Validate blocks against downloaded headers

This allows nodes to verify they're on the correct chain before downloading gigabytes of block data.

---

## Erlay Protocol

Erlay (BIP 330) improves transaction relay efficiency:

- **Set reconciliation**: Nodes exchange transaction set differences instead of full announcements
- **40% bandwidth reduction**: For transaction relay
- **Better connectivity**: Enables more peer connections without bandwidth increase

---

## Monitoring Block Propagation

### Subscribe to New Blocks via ZMQ

:::code-group
```rust
use zmq;
use std::error::Error;

fn subscribe_to_blocks() -> Result<(), Box<dyn Error>> {
    let context = zmq::Context::new();
    let subscriber = context.socket(zmq::SUB)?;
    
    // Connect to Bitcoin Core's ZMQ endpoint
    subscriber.connect("tcp://127.0.0.1:28332")?;
    subscriber.set_subscribe(b"hashblock")?;
    
    println!("Listening for new blocks...");
    
    loop {
        // Receive topic
        let topic = subscriber.recv_bytes(0)?;
        // Receive block hash (32 bytes, little-endian)
        let hash = subscriber.recv_bytes(0)?;
        // Receive sequence number
        let _sequence = subscriber.recv_bytes(0)?;
        
        // Convert to hex (reverse for big-endian display)
        let hash_hex: String = hash.iter()
            .rev()
            .map(|b| format!("{:02x}", b))
            .collect();
        
        println!("New block: {}", hash_hex);
    }
}

fn main() {
    if let Err(e) = subscribe_to_blocks() {
        eprintln!("Error: {}", e);
    }
}
```

```python
import zmq
import binascii

def subscribe_to_blocks():
    context = zmq.Context()
    subscriber = context.socket(zmq.SUB)
    
    # Connect to Bitcoin Core's ZMQ endpoint
    subscriber.connect("tcp://127.0.0.1:28332")
    subscriber.setsockopt_string(zmq.SUBSCRIBE, "hashblock")
    
    print("Listening for new blocks...")
    
    while True:
        # Receive multipart message: [topic, body, sequence]
        topic, body, seq = subscriber.recv_multipart()
        
        # Convert hash to hex (reverse bytes for big-endian display)
        block_hash = binascii.hexlify(body[::-1]).decode('ascii')
        sequence = int.from_bytes(seq, 'little')
        
        print(f"New block #{sequence}: {block_hash}")

if __name__ == "__main__":
    subscribe_to_blocks()
```

```cpp
#include <iostream>
#include <zmq.hpp>
#include <sstream>
#include <iomanip>

std::string bytes_to_hex_reversed(const unsigned char* data, size_t len) {
    std::stringstream ss;
    for (int i = len - 1; i >= 0; --i) {
        ss << std::hex << std::setfill('0') << std::setw(2) << (int)data[i];
    }
    return ss.str();
}

int main() {
    zmq::context_t context(1);
    zmq::socket_t subscriber(context, zmq::socket_type::sub);
    
    // Connect to Bitcoin Core's ZMQ endpoint
    subscriber.connect("tcp://127.0.0.1:28332");
    subscriber.set(zmq::sockopt::subscribe, "hashblock");
    
    std::cout << "Listening for new blocks..." << std::endl;
    
    while (true) {
        zmq::message_t topic, body, seq;
        
        subscriber.recv(topic, zmq::recv_flags::none);
        subscriber.recv(body, zmq::recv_flags::none);
        subscriber.recv(seq, zmq::recv_flags::none);
        
        std::string hash = bytes_to_hex_reversed(
            static_cast<unsigned char*>(body.data()), body.size());
        
        std::cout << "New block: " << hash << std::endl;
    }
    
    return 0;
}
```

```go
package main

import (
	"fmt"
	"log"
	
	"github.com/pebbe/zmq4"
)

func subscribeToBlocks() {
	subscriber, err := zmq4.NewSocket(zmq4.SUB)
	if err != nil {
		log.Fatal(err)
	}
	defer subscriber.Close()
	
	// Connect to Bitcoin Core's ZMQ endpoint
	err = subscriber.Connect("tcp://127.0.0.1:28332")
	if err != nil {
		log.Fatal(err)
	}
	
	err = subscriber.SetSubscribe("hashblock")
	if err != nil {
		log.Fatal(err)
	}
	
	fmt.Println("Listening for new blocks...")
	
	for {
		// Receive multipart message: [topic, body, sequence]
		parts, err := subscriber.RecvMessageBytes(0)
		if err != nil {
			log.Fatal(err)
		}
		
		if len(parts) < 3 {
			continue
		}
		
		// Reverse bytes for big-endian display
		body := parts[1]
		hashHex := ""
		for i := len(body) - 1; i >= 0; i-- {
			hashHex += fmt.Sprintf("%02x", body[i])
		}
		
		seq := parts[2]
		sequence := uint32(seq[0]) | uint32(seq[1])<<8 | uint32(seq[2])<<16 | uint32(seq[3])<<24
		
		fmt.Printf("New block #%d: %s\n", sequence, hashHex)
	}
}

func main() {
	subscribeToBlocks()
}
```

```javascript
const zmq = require('zeromq');

async function subscribeToBlocks() {
    const subscriber = new zmq.Subscriber();
    
    // Connect to Bitcoin Core's ZMQ endpoint
    subscriber.connect('tcp://127.0.0.1:28332');
    subscriber.subscribe('hashblock');
    
    console.log('Listening for new blocks...');
    
    for await (const [topic, body, seq] of subscriber) {
        // Reverse bytes for big-endian display
        const hashHex = Buffer.from(body).reverse().toString('hex');
        const sequence = seq.readUInt32LE(0);
        
        console.log(`New block #${sequence}: ${hashHex}`);
    }
}

subscribeToBlocks().catch(console.error);
```
:::

### Parse Block Header

:::code-group
```rust
use sha2::{Sha256, Digest};

#[derive(Debug)]
struct BlockHeader {
    version: i32,
    prev_block: [u8; 32],
    merkle_root: [u8; 32],
    timestamp: u32,
    bits: u32,
    nonce: u32,
}

impl BlockHeader {
    fn from_bytes(data: &[u8; 80]) -> Self {
        BlockHeader {
            version: i32::from_le_bytes(data[0..4].try_into().unwrap()),
            prev_block: data[4..36].try_into().unwrap(),
            merkle_root: data[36..68].try_into().unwrap(),
            timestamp: u32::from_le_bytes(data[68..72].try_into().unwrap()),
            bits: u32::from_le_bytes(data[72..76].try_into().unwrap()),
            nonce: u32::from_le_bytes(data[76..80].try_into().unwrap()),
        }
    }
    
    fn hash(&self, data: &[u8; 80]) -> [u8; 32] {
        // Double SHA256
        let first = Sha256::digest(data);
        let second = Sha256::digest(&first);
        second.into()
    }
}

fn main() {
    // Example: Genesis block header (80 bytes)
    let header_hex = "0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c";
    let header_bytes: Vec<u8> = hex::decode(header_hex).unwrap();
    let header_array: [u8; 80] = header_bytes.try_into().unwrap();
    
    let header = BlockHeader::from_bytes(&header_array);
    println!("Version: {}", header.version);
    println!("Timestamp: {}", header.timestamp);
    println!("Nonce: {}", header.nonce);
}
```

```python
import struct
import hashlib
from dataclasses import dataclass

@dataclass
class BlockHeader:
    version: int
    prev_block: bytes
    merkle_root: bytes
    timestamp: int
    bits: int
    nonce: int
    
    @classmethod
    def from_bytes(cls, data: bytes) -> 'BlockHeader':
        """Parse 80-byte block header."""
        return cls(
            version=struct.unpack('<i', data[0:4])[0],
            prev_block=data[4:36],
            merkle_root=data[36:68],
            timestamp=struct.unpack('<I', data[68:72])[0],
            bits=struct.unpack('<I', data[72:76])[0],
            nonce=struct.unpack('<I', data[76:80])[0],
        )
    
    def hash(self, data: bytes) -> bytes:
        """Calculate block hash (double SHA256)."""
        return hashlib.sha256(hashlib.sha256(data).digest()).digest()
    
    def hash_hex(self, data: bytes) -> str:
        """Return block hash as hex string (big-endian)."""
        return self.hash(data)[::-1].hex()

# Example: Genesis block header
header_hex = "0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c"
header_bytes = bytes.fromhex(header_hex)

header = BlockHeader.from_bytes(header_bytes)
print(f"Version: {header.version}")
print(f"Timestamp: {header.timestamp}")
print(f"Nonce: {header.nonce}")
print(f"Block hash: {header.hash_hex(header_bytes)}")
```

```cpp
#include <iostream>
#include <cstdint>
#include <cstring>
#include <array>
#include <openssl/sha.h>

struct BlockHeader {
    int32_t version;
    uint8_t prev_block[32];
    uint8_t merkle_root[32];
    uint32_t timestamp;
    uint32_t bits;
    uint32_t nonce;
    
    static BlockHeader from_bytes(const uint8_t* data) {
        BlockHeader header;
        std::memcpy(&header.version, data, 4);
        std::memcpy(header.prev_block, data + 4, 32);
        std::memcpy(header.merkle_root, data + 36, 32);
        std::memcpy(&header.timestamp, data + 68, 4);
        std::memcpy(&header.bits, data + 72, 4);
        std::memcpy(&header.nonce, data + 76, 4);
        return header;
    }
    
    std::array<uint8_t, 32> hash(const uint8_t* data) const {
        std::array<uint8_t, 32> first, second;
        SHA256(data, 80, first.data());
        SHA256(first.data(), 32, second.data());
        return second;
    }
};

int main() {
    // Parse and display block header
    // (In practice, read from network or file)
    std::cout << "Block header parser ready" << std::endl;
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

type BlockHeader struct {
	Version     int32
	PrevBlock   [32]byte
	MerkleRoot  [32]byte
	Timestamp   uint32
	Bits        uint32
	Nonce       uint32
}

func ParseBlockHeader(data []byte) *BlockHeader {
	header := &BlockHeader{}
	header.Version = int32(binary.LittleEndian.Uint32(data[0:4]))
	copy(header.PrevBlock[:], data[4:36])
	copy(header.MerkleRoot[:], data[36:68])
	header.Timestamp = binary.LittleEndian.Uint32(data[68:72])
	header.Bits = binary.LittleEndian.Uint32(data[72:76])
	header.Nonce = binary.LittleEndian.Uint32(data[76:80])
	return header
}

func (h *BlockHeader) Hash(data []byte) [32]byte {
	// Double SHA256
	first := sha256.Sum256(data)
	second := sha256.Sum256(first[:])
	return second
}

func (h *BlockHeader) HashHex(data []byte) string {
	hash := h.Hash(data)
	// Reverse bytes for big-endian display
	reversed := make([]byte, 32)
	for i := 0; i < 32; i++ {
		reversed[i] = hash[31-i]
	}
	return hex.EncodeToString(reversed)
}

func main() {
	// Example: Genesis block header
	headerHex := "0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c"
	headerBytes, _ := hex.DecodeString(headerHex)

	header := ParseBlockHeader(headerBytes)
	fmt.Printf("Version: %d\n", header.Version)
	fmt.Printf("Timestamp: %d\n", header.Timestamp)
	fmt.Printf("Nonce: %d\n", header.Nonce)
	fmt.Printf("Block hash: %s\n", header.HashHex(headerBytes))
}
```

```javascript
const crypto = require('crypto');

class BlockHeader {
    constructor(data) {
        // Parse 80-byte header (little-endian)
        this.version = data.readInt32LE(0);
        this.prevBlock = data.slice(4, 36);
        this.merkleRoot = data.slice(36, 68);
        this.timestamp = data.readUInt32LE(68);
        this.bits = data.readUInt32LE(72);
        this.nonce = data.readUInt32LE(76);
    }
    
    hash(data) {
        // Double SHA256
        const first = crypto.createHash('sha256').update(data).digest();
        const second = crypto.createHash('sha256').update(first).digest();
        return second;
    }
    
    hashHex(data) {
        // Return as big-endian hex string
        return Buffer.from(this.hash(data)).reverse().toString('hex');
    }
}

// Example: Genesis block header
const headerHex = '0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c';
const headerBytes = Buffer.from(headerHex, 'hex');

const header = new BlockHeader(headerBytes);
console.log(`Version: ${header.version}`);
console.log(`Timestamp: ${header.timestamp}`);
console.log(`Nonce: ${header.nonce}`);
console.log(`Block hash: ${header.hashHex(headerBytes)}`);
```
:::

---

## Orphan Block Scenarios

### Simultaneous Block Discovery

Sometimes two miners find blocks at nearly the same time, creating a temporary fork:

```
Block 850,000 (everyone agrees)
       |
       +-------------+-------------+
       |             |             |
  Block A      Block B (orphan) Block C
  (main chain)      |
       |        Block D
  Block E       (also orphaned)
  (main chain)
       |
    Winner!
```

### Timeline of Fork Resolution

```
Time 0:00    Miner A finds Block A
Time 0:01    Miner B finds Block B (almost simultaneously)
Time 0:02    Network splits: some nodes see A first, others see B
Time 0:05    Some miners start building on Block A
Time 0:06    Other miners start building on Block B
Time 0:10    Block E found building on Block A
Time 0:11    Chain A is now longer (more proof-of-work)
Time 0:12    All nodes converge on Chain A
Time 0:13    Block B and Block D become orphans
Time 0:14    Orphaned transactions return to mempool
```

### What Happens to Orphaned Blocks

- Block B and Block D are discarded
- Unique transactions from orphans return to mempool
- Miners' work on orphaned blocks is wasted
- Network automatically converges on longest chain
- This is why exchanges wait for 6 [confirmations](/docs/glossary#confirmation)

---

## Propagation Timing

### Typical Network Performance

| Stage | Time | Description |
|-------|------|-------------|
| Block found | 0:00 | Miner discovers valid hash |
| First hop | ~1s | Direct peers receive block |
| Second hop | ~2s | 50-100 nodes have block |
| Your node | ~5s | Typical home node receives |
| Most network | ~10s | >90% of nodes synchronized |
| Full propagation | ~30s | Entire network synchronized |

### Factors Affecting Speed

**Fast Propagation:**
- Well-connected nodes (many peers)
- High-bandwidth connections
- Geographic proximity to miners
- Compact block relay enabled

**Slow Propagation:**
- Few peer connections
- Low-bandwidth connections
- Geographic distance from miners
- Firewall restrictions

---

## Network Topology

### Typical Node Connections

A typical Bitcoin node has:
- **8-10 outbound connections**: You connect TO other nodes
- **Up to 125 inbound connections**: Other nodes connect TO you
- **Diverse IP ranges**: Protection against [eclipse attacks](/docs/glossary#sybil-attack)

### Connection Types

| Type | Direction | Purpose | Limit |
|------|-----------|---------|-------|
| Outbound | You to peers | Request data | 8-10 |
| Inbound | Peers to you | Serve data | 125 |
| Block-relay-only | Outbound | Blocks only (privacy) | 2 |
| Feeler | Temporary | Test new peers | 1-2 |

---

## Security Considerations

### Why Validation is Critical

Every node validates every block because:

- **No central authority to trust**
- **Prevents invalid blocks from spreading**
- **Ensures consensus rules are followed**
- **Protects against malicious actors**
- **Maintains network integrity**

If a node doesn't validate, it could spread invalid blocks and harm the network.

### Economic Incentives

**Miners are incentivized to:**
- Find blocks quickly (first to market)
- Broadcast blocks immediately (avoid orphaning)
- Include high-fee transactions
- Follow consensus rules (avoid rejection)

**Nodes are incentivized to:**
- Validate blocks (maintain network health)
- Relay blocks quickly (help the network)
- Stay connected (receive updates)

---

## Key Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Block interval | ~10 min | Time between consecutive blocks |
| Propagation delay | <10s | Time from discovery to your node |
| Peer count | 8-125 | Number of active connections |
| Validation time | <1s | Time to validate a block |
| Orphan rate | <1% | Percentage of blocks orphaned |

---

## Summary

Bitcoin's block propagation mechanism is designed to be:

- **Decentralized**: No single point of failure
- **Resilient**: Multiple paths for block propagation
- **Secure**: Every node validates every block
- **Efficient**: Compact blocks reduce bandwidth by 90%
- **Self-healing**: Orphan blocks are automatically resolved

---

## Resources

- **[mempool.space](https://mempool.space)**: Real-time block explorer and mempool visualization
- **[BIP 152: Compact Block Relay](https://github.com/bitcoin/bips/blob/master/bip-0152.mediawiki)**: Compact blocks specification
- **[Bitcoin Core P2P documentation](https://github.com/bitcoin/bitcoin/blob/master/doc/p2p.md)**: Network protocol details
