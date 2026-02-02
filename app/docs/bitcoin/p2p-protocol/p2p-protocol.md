# P2P Network Protocol

Bitcoin uses a peer-to-peer (P2P) network protocol for nodes to communicate, share blocks, and propagate transactions. Understanding the P2P protocol is essential for running nodes and understanding network behavior.

## Design context

Bitcoin's P2P design was inspired by the same P2P ideas and era (early 2000s), including BitTorrent's success; decentralization, no single point of failure, and censorship resistance. Bitcoin does not use BitTorrent's protocol; it has its own messages and peer discovery.

Satoshi wrote that governments are good at cutting off centrally controlled networks like Napster, but that "pure P2P networks like Gnutella and Tor" hold their own; so the design philosophy aligns with that lineage.

## Network Architecture

### Node Types

```text
Full Nodes:
- Download and validate entire blockchain
- Relay blocks and transactions
- Maintain network consensus

Light Nodes (SPV):
- Download block headers only
- Request specific transactions
- Rely on full nodes for data
```

### Connection Model

```text
Typical Node:
├── 8-10 outbound connections (you connect to others)
├── Up to 125 inbound connections (others connect to you)
└── Block-relay-only connections (privacy)
```

---

## Protocol Messages

### Handshake

Nodes establish connections through a handshake:

```text
1. Version Message: Announce capabilities
2. Verack Message: Acknowledge version
3. Connection established
```

```mermaid
sequenceDiagram
  participant A as Node A
  participant B as Node B
  A->>B: version
  B->>A: verack
  A->>B: verack
  Note over A,B: getblocks / inv / getdata follow
```

### Core Messages

| Message | Purpose |
|---------|---------|
| `version` | Initial handshake, announce capabilities |
| `verack` | Acknowledge version message |
| `addr` | Share peer addresses |
| `inv` | Inventory announcement (blocks/tx) |
| `getdata` | Request specific data |
| `block` | Send block data |
| `tx` | Send transaction data |
| `headers` | Send block headers |
| `getheaders` | Request block headers |
| `ping` / `pong` | Keep connection alive |

### Magic Bytes

Each P2P message on the wire starts with **magic bytes**, a fixed 4-byte value that identifies the network (mainnet, testnet, signet, regtest). They help nodes detect message boundaries and reject messages intended for other networks. Mainnet magic is `0xF9BEB4D9` (little-endian). The message format is: magic (4 bytes) + command string (12 bytes) + payload length (4 bytes) + checksum (4 bytes) + payload. See the [Bitcoin P2P protocol](https://developer.bitcoin.org/reference/p2p_networking.html) for the full wire format.

---

## Code Examples

### Establishing Connection

:::code-group
```rust
use std::net::TcpStream;
use bitcoin::network::message::{NetworkMessage, RawNetworkMessage};
use bitcoin::network::constants::Magic;

fn connect_to_peer(address: &str) -> Result<(), Box<dyn std::error::Error>> {
    let mut stream = TcpStream::connect(address)?;
    
    // Send version message
    let version_msg = create_version_message();
    send_message(&mut stream, &version_msg)?;
    
    // Wait for verack
    let response = receive_message(&mut stream)?;
    // Process verack...
    
    Ok(())
}
```

```python
import socket
from bitcoin.network import CVersionMessage, CVerAckMessage

def connect_to_peer(address, port):
    """Connect to a Bitcoin peer."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((address, port))
    
    # Send version message
    version_msg = CVersionMessage()
    send_message(sock, version_msg)
    
    # Wait for verack
    response = receive_message(sock)
    # Process verack...
    
    return sock
```

```cpp
#include <bitcoin/bitcoin.hpp>
#include <iostream>

void connect_to_peer(const std::string& address, uint16_t port) {
    bc::network::session session;
    
    // Connect to peer
    session.connect(address, port, [](const bc::code& ec) {
        if (ec) {
            std::cerr << "Connection failed: " << ec.message() << std::endl;
            return;
        }
        
        // Send version message
        bc::message::version version_msg;
        session.send(version_msg, [](const bc::code& ec) {
            // Handle send result
        });
    });
}
```

```go
package main

import (
	"github.com/btcsuite/btcd/peer"
	"github.com/btcsuite/btcd/wire"
)

func connectToPeer(address string) (*peer.Peer, error) {
	// Create peer configuration
	cfg := &peer.Config{
		UserAgentName:    "bitcoin-node",
		UserAgentVersion: "1.0.0",
	}
	
	// Connect to peer
	p, err := peer.NewOutboundPeer(cfg, address)
	if err != nil {
		return nil, err
	}
	
	// Send version message
	msg := wire.NewMsgVersion(...)
	p.QueueMessage(msg, nil)
	
	return p, nil
}
```

```javascript
const net = require('net');
const { Message } = require('bitcoin-protocol');

function connectToPeer(address, port) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        
        socket.connect(port, address, () => {
            // Send version message
            const versionMsg = new Message('version', {...});
            socket.write(versionMsg.serialize());
            
            // Wait for verack
            socket.on('data', (data) => {
                const msg = Message.deserialize(data);
                if (msg.command === 'verack') {
                    resolve(socket);
                }
            });
        });
    });
}
```
:::

### Sending Inventory

:::code-group
```rust
use bitcoin::network::message::{NetworkMessage, InvMessage};
use bitcoin::network::message_network::Inventory;

fn announce_transaction(txid: [u8; 32]) {
    let inv = Inventory::new_transaction(txid);
    let inv_msg = InvMessage::new(vec![inv]);
    // Send to peers...
}
```

```python
from bitcoin.network import CInv, CInvMessage

def announce_transaction(txid):
    """Announce transaction to peers."""
    inv = CInv(CInv.MSG_TX, txid)
    inv_msg = CInvMessage([inv])
    # Send to peers...
```

```cpp
#include <bitcoin/bitcoin.hpp>

void announce_transaction(const bc::hash_digest& txid) {
    bc::message::inventory inv;
    inv.set_type(bc::message::inventory::type_id::transaction);
    inv.set_hash(txid);
    
    bc::message::inv inv_msg;
    inv_msg.inventories().push_back(inv);
    // Send to peers...
}
```

```go
package main

import (
	"github.com/btcsuite/btcd/wire"
)

func announceTransaction(txid *wire.ShaHash) {
	inv := wire.NewInvVect(wire.InvTypeTx, txid)
	invMsg := wire.NewMsgInv()
	invMsg.AddInvVect(inv)
	// Send to peers...
}
```

```javascript
const { Message } = require('bitcoin-protocol');

function announceTransaction(txid) {
    const inv = {
        type: 1, // MSG_TX
        hash: txid,
    };
    const invMsg = new Message('inv', { inventories: [inv] });
    // Send to peers...
}
```
:::

---

## Message Flow

### Block Propagation

```text
1. Miner finds block
2. Sends 'inv' message to peers
3. Peers request block with 'getdata'
4. Miner sends 'block' message
5. Peers validate and forward
```

### Transaction Propagation

```text
1. User creates transaction
2. Sends 'inv' or 'tx' to peers
3. Peers validate transaction
4. Peers forward to their peers
5. Transaction spreads across network
```

---

## Peer Discovery

### Methods

1. **DNS Seeds**: Hardcoded DNS servers
2. **Hardcoded Seeds**: Bootstrap IP addresses
3. **Peer Exchange**: Peers share addresses
4. **Manual Connection**: User-specified peers

### Address Management

```text
Known Addresses:
├── Tried addresses (recently connected)
├── New addresses (not yet tried)
└── Banned addresses (avoid)
```

---

## Network Security

### Eclipse Attacks

Prevented by:
- Connecting to diverse IP ranges
- Using multiple outbound connections
- Verifying block data independently

### Sybil Attacks

Mitigated by:
- Requiring proof-of-work for blocks
- Independent validation by all nodes
- No trust in individual peers

---

## Tor and Bitcoin

**Tor** is an anonymity network that routes traffic through volunteer relays so that observers cannot see who is talking to whom. Satoshi cited Tor (with Gnutella) as an example of a resilient pure P2P network.

Running a Bitcoin node or wallet over Tor hides a user's IP from peers and mitigates some network-level surveillance and eclipse risks. Many nodes support Tor (e.g. via `.onion` addresses). Lightning's [onion routing](/docs/lightning/onion) is inspired by Tor's design.

---

## Compact Blocks (BIP 152)

Optimization for faster block propagation:

```text
Standard Block:
- Full block: ~1-2 MB
- Slow propagation

Compact Block:
- Header + short IDs: ~20 KB
- Receiver reconstructs from mempool
- Much faster
```

---

## P2P v2 / Encrypted Transport (BIP 324)

[BIP 324](https://github.com/bitcoin/bips/blob/master/bip-0324.mediawiki) defines a **v2 P2P transport** that encrypts and authenticated the peer-to-peer link. [Messages](/docs/bitcoin/p2p-protocol#protocol-messages) (e.g., `version`, `verack`, `inv`, `block`, `tx`) are encrypted so that a passive on-path observer cannot read or tamper with them. This improves privacy (e.g., hiding which blocks or transactions are requested) and helps prevent some eclipse-style and downgrade attacks.

- **Handshake**: v2 uses an [ECDH](https://github.com/bitcoin/bips/blob/master/bip-0324.mediawiki)-based key agreement; once the shared secret is established, the rest of the session is ChaCha20-Poly1305 encrypted.
- **Rollout**: Bitcoin Core and other nodes can support both the legacy (unencrypted) and v2 transports; v2 is used when both peers support it. Adoption is increasing; see [Bitcoin Core](https://github.com/bitcoin/bitcoin) and [BIP 324](https://github.com/bitcoin/bips/blob/master/bip-0324.mediawiki) for the latest status.

---

## Related Topics

- [Block Propagation](/docs/bitcoin/blocks) - How blocks spread
- [Mempool](/docs/mining/mempool) - Transaction pool
- [Node Types](/docs/development/node-types) - Different node configurations

---

## Resources

- [Bitcoin Protocol Documentation](https://en.bitcoin.it/wiki/Protocol_documentation)
- [BIP 152: Compact Block Relay](https://github.com/bitcoin/bips/blob/master/bip-0152.mediawiki)
- [BIP 324: Version 2 P2P Encrypted Transport](https://github.com/bitcoin/bips/blob/master/bip-0324.mediawiki)
