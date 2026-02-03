# Hash Time-Locked Contracts (HTLCs)

HTLCs are the mechanism that enables payments to route through the Lightning Network. They ensure that payments can only be claimed with the correct preimage, and expire after a certain time if unclaimed. An HTLC is a conditional payment that requires:

1. **Hash Lock**: Knowledge of a secret (preimage) that hashes to a known value
2. **Time Lock**: Expires after a certain block height (CLTV)

```text
HTLC Conditions:
- If preimage is revealed before expiry → Payment goes to recipient
- If time lock expires → Payment returns to sender
```

---

## How HTLCs Work in Lightning

### Payment Flow

1. **Recipient generates preimage**: Random 32-byte secret, shares SHA256 hash
2. **Sender creates HTLC chain**: Locks funds with hash and decreasing expiries
3. **HTLCs propagate**: Each hop creates an HTLC to the next
4. **Recipient reveals preimage**: Claims final HTLC
5. **Preimage propagates back**: Each hop claims their incoming HTLC
6. **Settlement complete**: All HTLCs resolved atomically

```mermaid
sequenceDiagram
  participant Sender
  participant Hop
  participant Recipient
  Sender->>Hop: Create HTLC with hash
  Hop->>Recipient: Create HTLC with same hash
  Recipient->>Recipient: Reveal preimage to claim
  Recipient->>Hop: Preimage propagates back
  Hop->>Sender: Settle HTLCs
```

### Example Route

```text
Alice → Bob → Carol → Dave

Alice creates HTLC to Bob:
  - Amount: 1000 + 3 sats (fees)
  - Hash: SHA256(preimage)
  - Expiry: Block 850,040

Bob creates HTLC to Carol:
  - Amount: 1000 + 1 sats (fees)  
  - Hash: SHA256(preimage) [same]
  - Expiry: Block 850,030 [earlier]

Carol creates HTLC to Dave:
  - Amount: 1000 sats
  - Hash: SHA256(preimage) [same]
  - Expiry: Block 850,020 [earliest]
```

### Why Decreasing Expiries?

Each hop needs an **expiry delta** (CLTV delta) buffer to:

- Have time to claim incoming HTLC after learning preimage
- Handle blockchain congestion
- Account for clock differences between nodes

**Rule**: Outgoing HTLC expiry < Incoming HTLC expiry (by at least `cltv_expiry_delta`)

---

## HTLC Script Structure

HTLCs in commitment transactions use this script pattern:

```text
# Offered HTLC (you're offering payment)
OP_DUP OP_HASH160 <revocation_pubkey_hash> OP_EQUAL
OP_IF
    OP_CHECKSIG                           # Revocation path
OP_ELSE
    <remote_htlc_pubkey> OP_SWAP OP_SIZE 32 OP_EQUAL
    OP_IF
        OP_HASH160 <payment_hash> OP_EQUALVERIFY  # Success path
        2 OP_SWAP <local_htlc_pubkey> 2 OP_CHECKMULTISIG
    OP_ELSE
        OP_DROP <cltv_expiry> OP_CHECKLOCKTIMEVERIFY OP_DROP
        OP_CHECKSIG                       # Timeout path
    OP_ENDIF
OP_ENDIF
```

---

## HTLC Verification

:::code-group
```rust
use sha2::{Sha256, Digest};

/// Represents an HTLC
struct Htlc {
    payment_hash: [u8; 32],
    amount_msat: u64,
    cltv_expiry: u32,
}

impl Htlc {
    /// Verify a preimage against this HTLC's payment hash
    fn verify_preimage(&self, preimage: &[u8; 32]) -> bool {
        let mut hasher = Sha256::new();
        hasher.update(preimage);
        let hash: [u8; 32] = hasher.finalize().into();
        hash == self.payment_hash
    }
    
    /// Check if HTLC has expired at given block height
    fn is_expired(&self, current_height: u32) -> bool {
        current_height >= self.cltv_expiry
    }
    
    /// Calculate if we have enough time to safely forward
    fn can_forward(&self, current_height: u32, min_delta: u32) -> bool {
        self.cltv_expiry > current_height + min_delta
    }
}

fn main() {
    // Example: Create preimage and verify
    let preimage: [u8; 32] = [0x42; 32];  // In practice, use secure random
    
    let mut hasher = Sha256::new();
    hasher.update(&preimage);
    let payment_hash: [u8; 32] = hasher.finalize().into();
    
    let htlc = Htlc {
        payment_hash,
        amount_msat: 1_000_000,
        cltv_expiry: 850_000,
    };
    
    assert!(htlc.verify_preimage(&preimage));
    println!("Preimage verified successfully!");
}
```

```python
import hashlib
import secrets
from dataclasses import dataclass

@dataclass
class Htlc:
    payment_hash: bytes  # 32 bytes
    amount_msat: int
    cltv_expiry: int
    
    def verify_preimage(self, preimage: bytes) -> bool:
        """Verify a preimage against this HTLC's payment hash."""
        computed_hash = hashlib.sha256(preimage).digest()
        return computed_hash == self.payment_hash
    
    def is_expired(self, current_height: int) -> bool:
        """Check if HTLC has expired at given block height."""
        return current_height >= self.cltv_expiry
    
    def can_forward(self, current_height: int, min_delta: int = 40) -> bool:
        """Check if we have enough time to safely forward this HTLC."""
        return self.cltv_expiry > current_height + min_delta


def create_htlc(amount_msat: int, cltv_expiry: int) -> tuple[Htlc, bytes]:
    """Create an HTLC with a new random preimage."""
    preimage = secrets.token_bytes(32)
    payment_hash = hashlib.sha256(preimage).digest()
    
    htlc = Htlc(
        payment_hash=payment_hash,
        amount_msat=amount_msat,
        cltv_expiry=cltv_expiry
    )
    return htlc, preimage


# Example usage
htlc, preimage = create_htlc(amount_msat=1_000_000, cltv_expiry=850_000)

# Verify the preimage
assert htlc.verify_preimage(preimage)
print(f"Payment hash: {htlc.payment_hash.hex()}")
print(f"Preimage: {preimage.hex()}")
print("Preimage verified successfully!")
```

```cpp
#include <iostream>
#include <array>
#include <cstdint>
#include <cstring>
#include <openssl/sha.h>

struct Htlc {
    std::array<uint8_t, 32> payment_hash;
    uint64_t amount_msat;
    uint32_t cltv_expiry;
    
    // Verify a preimage against this HTLC's payment hash
    bool verify_preimage(const std::array<uint8_t, 32>& preimage) const {
        std::array<uint8_t, 32> computed_hash;
        SHA256(preimage.data(), preimage.size(), computed_hash.data());
        return payment_hash == computed_hash;
    }
    
    // Check if HTLC has expired at given block height
    bool is_expired(uint32_t current_height) const {
        return current_height >= cltv_expiry;
    }
    
    // Check if we have enough time to safely forward
    bool can_forward(uint32_t current_height, uint32_t min_delta = 40) const {
        return cltv_expiry > current_height + min_delta;
    }
};

// Create payment hash from preimage
std::array<uint8_t, 32> hash_preimage(const std::array<uint8_t, 32>& preimage) {
    std::array<uint8_t, 32> hash;
    SHA256(preimage.data(), preimage.size(), hash.data());
    return hash;
}

int main() {
    // Create a test preimage
    std::array<uint8_t, 32> preimage;
    std::fill(preimage.begin(), preimage.end(), 0x42);
    
    // Create HTLC
    Htlc htlc;
    htlc.payment_hash = hash_preimage(preimage);
    htlc.amount_msat = 1000000;
    htlc.cltv_expiry = 850000;
    
    // Verify
    if (htlc.verify_preimage(preimage)) {
        std::cout << "Preimage verified successfully!" << std::endl;
    }
    
    // Check expiry
    uint32_t current_height = 849950;
    std::cout << "Expired: " << (htlc.is_expired(current_height) ? "Yes" : "No") << std::endl;
    std::cout << "Can forward: " << (htlc.can_forward(current_height) ? "Yes" : "No") << std::endl;
    
    return 0;
}
```

```go
package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

// HTLC represents a Hash Time-Locked Contract
type HTLC struct {
	PaymentHash [32]byte
	AmountMsat  uint64
	CLTVExpiry  uint32
}

// VerifyPreimage verifies a preimage against this HTLC's payment hash
func (h *HTLC) VerifyPreimage(preimage [32]byte) bool {
	hash := sha256.Sum256(preimage[:])
	return hash == h.PaymentHash
}

// IsExpired checks if HTLC has expired at given block height
func (h *HTLC) IsExpired(currentHeight uint32) bool {
	return currentHeight >= h.CLTVExpiry
}

// CanForward checks if we have enough time to safely forward this HTLC
func (h *HTLC) CanForward(currentHeight uint32, minDelta uint32) bool {
	if minDelta == 0 {
		minDelta = 40
	}
	return h.CLTVExpiry > currentHeight+minDelta
}

// CreateHTLC creates an HTLC with a new random preimage
func CreateHTLC(amountMsat uint64, cltvExpiry uint32) (*HTLC, [32]byte, error) {
	var preimage [32]byte
	if _, err := rand.Read(preimage[:]); err != nil {
		return nil, [32]byte{}, err
	}

	paymentHash := sha256.Sum256(preimage[:])
	htlc := &HTLC{
		PaymentHash: paymentHash,
		AmountMsat:  amountMsat,
		CLTVExpiry:  cltvExpiry,
	}

	return htlc, preimage, nil
}

func main() {
	// Example usage
	htlc, preimage, _ := CreateHTLC(1_000_000, 850_000)

	fmt.Printf("Payment hash: %s\n", hex.EncodeToString(htlc.PaymentHash[:]))
	fmt.Printf("Preimage: %s\n", hex.EncodeToString(preimage[:]))
	fmt.Printf("Verified: %v\n", htlc.VerifyPreimage(preimage))

	currentHeight := uint32(849_950)
	fmt.Printf("Expired: %v\n", htlc.IsExpired(currentHeight))
	fmt.Printf("Can forward: %v\n", htlc.CanForward(currentHeight, 40))
}
```

```javascript
const crypto = require('crypto');

class Htlc {
    /**
     * @param {Buffer} paymentHash - 32-byte payment hash
     * @param {bigint} amountMsat - Amount in millisatoshis
     * @param {number} cltvExpiry - Block height expiry
     */
    constructor(paymentHash, amountMsat, cltvExpiry) {
        this.paymentHash = paymentHash;
        this.amountMsat = amountMsat;
        this.cltvExpiry = cltvExpiry;
    }
    
    /**
     * Verify a preimage against this HTLC's payment hash
     * @param {Buffer} preimage - 32-byte preimage
     * @returns {boolean}
     */
    verifyPreimage(preimage) {
        const computedHash = crypto.createHash('sha256').update(preimage).digest();
        return computedHash.equals(this.paymentHash);
    }
    
    /**
     * Check if HTLC has expired at given block height
     * @param {number} currentHeight
     * @returns {boolean}
     */
    isExpired(currentHeight) {
        return currentHeight >= this.cltvExpiry;
    }
    
    /**
     * Check if we have enough time to safely forward this HTLC
     * @param {number} currentHeight
     * @param {number} minDelta - Minimum CLTV delta (default: 40)
     * @returns {boolean}
     */
    canForward(currentHeight, minDelta = 40) {
        return this.cltvExpiry > currentHeight + minDelta;
    }
}

/**
 * Create an HTLC with a new random preimage
 * @param {bigint} amountMsat
 * @param {number} cltvExpiry
 * @returns {{htlc: Htlc, preimage: Buffer}}
 */
function createHtlc(amountMsat, cltvExpiry) {
    const preimage = crypto.randomBytes(32);
    const paymentHash = crypto.createHash('sha256').update(preimage).digest();
    
    return {
        htlc: new Htlc(paymentHash, amountMsat, cltvExpiry),
        preimage
    };
}

// Example usage
const { htlc, preimage } = createHtlc(1_000_000n, 850_000);

console.log(`Payment hash: ${htlc.paymentHash.toString('hex')}`);
console.log(`Preimage: ${preimage.toString('hex')}`);
console.log(`Verified: ${htlc.verifyPreimage(preimage)}`);

const currentHeight = 849_950;
console.log(`Expired: ${htlc.isExpired(currentHeight)}`);
console.log(`Can forward: ${htlc.canForward(currentHeight)}`);
```
:::

---

## HTLC States

An HTLC in a channel transitions through these states:

| State | Description | Outcome |
|-------|-------------|---------|
| Offered | Sent to peer, awaiting response | → Accepted or Failed |
| Accepted | Peer acknowledged, awaiting preimage | → Settled or Failed |
| Settled | Preimage revealed, funds transferred | Complete |
| Failed | Timeout or error, funds returned | Complete |

```text
Lifecycle:
Offered → Accepted → Settled (success)
    ↓         ↓
  Failed   Failed (timeout/error)
```

---

## HTLC Security Properties

### Atomicity

Either the entire payment succeeds or fails completely:

- All HTLCs in the route share the same payment hash
- Revealing the preimage settles all HTLCs
- Timeout returns all funds to senders

### Hash Lock Security

- Preimage must be exactly 32 bytes
- SHA256 is collision-resistant
- Only the recipient knows the preimage initially

### Time Lock Security

- CLTV (CheckLockTimeVerify) enforced by Bitcoin consensus
- Sufficient delta prevents race conditions
- Allows time for breach detection

---

## Common Issues

### HTLC Timeout

**Problem**: HTLC expires before payment completes.

**Causes**:
- Route too long (accumulated CLTV deltas)
- Slow intermediate nodes
- Network congestion

**Solutions**:
- Increase `max_cltv_expiry` setting
- Use shorter routes
- Retry with different path

### Stuck HTLCs

**Problem**: HTLC neither settles nor fails.

**Causes**:
- Peer offline
- Bug in implementation
- Network partition

**Solutions**:
- Wait for CLTV expiry
- Force close channel if necessary

---

## Summary

HTLCs are the atomic building blocks of Lightning payments:

- **Hash locks** ensure only the recipient can claim funds
- **Time locks** enable safe routing through untrusted intermediaries
- **Decreasing expiries** prevent routing attacks
- **Atomicity** guarantees all-or-nothing settlement

---

## Related Topics

- [Routing Fees](/docs/lightning/routing-fees) - How routing fees work
- [Multi-Part Payments](/docs/lightning/routing/mpp) - Splitting payments across routes
- [Onion Routing](/docs/lightning/onion) - Privacy in payment routing
