# Lightning Onion Routing

Lightning Network uses Sphinx onion routing to provide privacy and security for payments. Each hop in a route only knows the previous and next hop, not the full route or payment details. Onion routing encrypts data in layers, like an onion. Each hop peels off one layer, revealing only the information needed for that hop to forward the payment. Key properties:

- **Privacy**: Each hop only knows immediate neighbors
- **Integrity**: HMACs prevent tampering
- **Source Hiding**: Sender identity is hidden from all hops
- **Path Hiding**: Full route is never revealed

---

## Sphinx Protocol

Lightning uses the Sphinx protocol (adapted from Tor's design) for payment routing. It provides:

- Compact fixed-size packets (1300 bytes)
- Per-hop payload encryption
- Replay attack protection
- Forward secrecy

### How It Works

1. **Sender builds onion**: Encrypts routing data in layers (innermost first)
2. **Each hop processes**: Peels off one layer, learns next hop
3. **Final hop**: Receives payment details and claims HTLC
4. **Response**: Preimage propagates back through same path

```text
[Onion Packet Structure - 1366 bytes]
├── Version 1 byte
├── Public Key 33 bytes
├── Encrypted Payload 1300 bytes
└── HMAC 32 bytes
```

---

## Onion Packet Components

| Field | Size | Description |
|-------|------|-------------|
| Version | 1 byte | Protocol version (currently 0) |
| Public Key | 33 bytes | Ephemeral public key for ECDH |
| Payload | 1300 bytes | Encrypted per-hop data |
| HMAC | 32 bytes | Authentication tag |

### Per-Hop Payload (TLV Format)

Each decrypted layer contains:

- **Short Channel ID**: 8 bytes: Which channel to forward through
- **Amount to Forward**: Variable: HTLC amount for next hop
- **Outgoing CLTV**: 4 bytes: Expiry for outgoing HTLC
- **Padding**: Variable: Random data to maintain fixed size

---

## Shared Secret Derivation

:::code-group
```rust
use secp256k1::{PublicKey, SecretKey, Secp256k1};
use sha2::{Sha256, Digest};

/// Derive shared secret using ECDH
fn derive_shared_secret(
    ephemeral_secret: &SecretKey,
    hop_pubkey: &PublicKey,
) -> [u8; 32] {
    let secp = Secp256k1::new();
    
    // Perform ECDH: multiply hop's public key by our secret
    let shared_point = hop_pubkey.mul_tweak(&secp, &ephemeral_secret.into())
        .expect("Valid multiplication");
    
    // Hash the x-coordinate to get the shared secret
    let mut hasher = Sha256::new();
    hasher.update(&shared_point.serialize());
    hasher.finalize().into()
}

/// Derive the blinding factor for key rotation
fn derive_blinding_factor(
    ephemeral_pubkey: &PublicKey,
    shared_secret: &[u8; 32],
) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(&ephemeral_pubkey.serialize());
    hasher.update(shared_secret);
    hasher.finalize().into()
}
```

```python
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import hashlib

def derive_shared_secret(ephemeral_private_key: ec.EllipticCurvePrivateKey, 
                         hop_public_key: ec.EllipticCurvePublicKey) -> bytes:
    """Derive shared secret using ECDH."""
    # Perform ECDH key exchange
    shared_key = ephemeral_private_key.exchange(ec.ECDH(), hop_public_key)
    
    # Hash to get 32-byte shared secret
    return hashlib.sha256(shared_key).digest()

def derive_blinding_factor(ephemeral_pubkey_bytes: bytes, 
                           shared_secret: bytes) -> bytes:
    """Derive blinding factor for ephemeral key rotation."""
    hasher = hashlib.sha256()
    hasher.update(ephemeral_pubkey_bytes)
    hasher.update(shared_secret)
    return hasher.digest()

def derive_rho_key(shared_secret: bytes) -> bytes:
    """Derive the rho key for payload encryption (ChaCha20)."""
    return hashlib.sha256(b"rho" + shared_secret).digest()

def derive_mu_key(shared_secret: bytes) -> bytes:
    """Derive the mu key for HMAC computation."""
    return hashlib.sha256(b"mu" + shared_secret).digest()
```

```cpp
#include <array>
#include <cstdint>
#include <openssl/evp.h>
#include <openssl/sha.h>
#include <openssl/ec.h>

/**
 * Derive shared secret using ECDH
 * In production, use a proper secp256k1 library
 */
std::array<uint8_t, 32> derive_shared_secret(
    const std::array<uint8_t, 32>& ephemeral_secret,
    const std::array<uint8_t, 33>& hop_pubkey
) {
    // This is simplified - real implementation uses secp256k1 ECDH
    std::array<uint8_t, 32> shared_secret;
    
    // In practice: 
    // 1. Parse hop_pubkey as EC point
    // 2. Multiply by ephemeral_secret
    // 3. SHA256 hash the result
    
    // Placeholder for demonstration
    SHA256_CTX ctx;
    SHA256_Init(&ctx);
    SHA256_Update(&ctx, ephemeral_secret.data(), 32);
    SHA256_Update(&ctx, hop_pubkey.data(), 33);
    SHA256_Final(shared_secret.data(), &ctx);
    
    return shared_secret;
}

/**
 * Derive key for specific purpose (rho, mu, etc.)
 */
std::array<uint8_t, 32> derive_key(
    const char* purpose,
    const std::array<uint8_t, 32>& shared_secret
) {
    std::array<uint8_t, 32> key;
    SHA256_CTX ctx;
    SHA256_Init(&ctx);
    SHA256_Update(&ctx, purpose, strlen(purpose));
    SHA256_Update(&ctx, shared_secret.data(), 32);
    SHA256_Final(key.data(), &ctx);
    return key;
}
```

```go
package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"

	"github.com/btcsuite/btcd/btcec/v2"
)

// DeriveSharedSecret derives shared secret using ECDH
func DeriveSharedSecret(ephemeralPrivateKey *btcec.PrivateKey, hopPublicKey *btcec.PublicKey) [32]byte {
	// Perform ECDH: multiply hop's public key by our secret
	sharedPoint := new(btcec.PublicKey)
	sharedPoint.X, sharedPoint.Y = elliptic.P256().ScalarMult(hopPublicKey.X(), hopPublicKey.Y(), ephemeralPrivateKey.D().Bytes())

	// Hash the x-coordinate to get the shared secret
	hash := sha256.Sum256(sharedPoint.SerializeCompressed())
	return hash
}

// DeriveBlindingFactor derives the blinding factor for key rotation
func DeriveBlindingFactor(ephemeralPubkey *btcec.PublicKey, sharedSecret [32]byte) [32]byte {
	hasher := sha256.New()
	hasher.Write(ephemeralPubkey.SerializeCompressed())
	hasher.Write(sharedSecret[:])
	var result [32]byte
	copy(result[:], hasher.Sum(nil))
	return result
}

// DeriveRhoKey derives encryption key (rho) for ChaCha20
func DeriveRhoKey(sharedSecret [32]byte) [32]byte {
	hasher := sha256.New()
	hasher.Write([]byte("rho"))
	hasher.Write(sharedSecret[:])
	var result [32]byte
	copy(result[:], hasher.Sum(nil))
	return result
}

// DeriveMuKey derives HMAC key (mu)
func DeriveMuKey(sharedSecret [32]byte) [32]byte {
	hasher := sha256.New()
	hasher.Write([]byte("mu"))
	hasher.Write(sharedSecret[:])
	var result [32]byte
	copy(result[:], hasher.Sum(nil))
	return result
}

func main() {
	// Example usage
	ephemeralKey, _ := btcec.NewPrivateKey()
	hopKey, _ := btcec.NewPrivateKey()
	hopPubKey := hopKey.PubKey()

	sharedSecret := DeriveSharedSecret(ephemeralKey, hopPubKey)
	fmt.Printf("Shared secret: %s\n", hex.EncodeToString(sharedSecret[:]))

	rhoKey := DeriveRhoKey(sharedSecret)
	fmt.Printf("Rho key: %s\n", hex.EncodeToString(rhoKey[:]))

	muKey := DeriveMuKey(sharedSecret)
	fmt.Printf("Mu key: %s\n", hex.EncodeToString(muKey[:]))
}
```

```javascript
const crypto = require('crypto');

/**
 * Derive shared secret using ECDH
 * @param {Buffer} ephemeralPrivateKey - 32-byte private key
 * @param {Buffer} hopPublicKey - 33-byte compressed public key
 * @returns {Buffer} 32-byte shared secret
 */
function deriveSharedSecret(ephemeralPrivateKey, hopPublicKey) {
    // Create ECDH instance with secp256k1 curve
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(ephemeralPrivateKey);
    
    // Compute shared secret
    const sharedPoint = ecdh.computeSecret(hopPublicKey);
    
    // Hash to get 32-byte secret
    return crypto.createHash('sha256').update(sharedPoint).digest();
}

/**
 * Derive blinding factor for ephemeral key rotation
 * @param {Buffer} ephemeralPubkey - 33-byte compressed public key
 * @param {Buffer} sharedSecret - 32-byte shared secret
 * @returns {Buffer} 32-byte blinding factor
 */
function deriveBlindingFactor(ephemeralPubkey, sharedSecret) {
    const hasher = crypto.createHash('sha256');
    hasher.update(ephemeralPubkey);
    hasher.update(sharedSecret);
    return hasher.digest();
}

/**
 * Derive encryption key (rho) for ChaCha20
 * @param {Buffer} sharedSecret
 * @returns {Buffer}
 */
function deriveRhoKey(sharedSecret) {
    return crypto.createHash('sha256')
        .update(Buffer.from('rho'))
        .update(sharedSecret)
        .digest();
}

/**
 * Derive HMAC key (mu)
 * @param {Buffer} sharedSecret
 * @returns {Buffer}
 */
function deriveMuKey(sharedSecret) {
    return crypto.createHash('sha256')
        .update(Buffer.from('mu'))
        .update(sharedSecret)
        .digest();
}
```
:::

---

## Encryption Process

### Layer Construction (Sender)

For a 3-hop route (Alice → Bob → Carol → Dave):

1. Generate ephemeral keypair
2. Compute shared secrets with all hops using ECDH
3. Build payloads for each hop
4. Encrypt from innermost (Dave) to outermost (Bob)
5. Compute HMACs at each layer

```text
Construction Order (inside-out):
1. Create Dave's payload (final hop data)
2. Encrypt with Dave's shared secret
3. Prepend Carol's payload
4. Encrypt with Carol's shared secret
5. Prepend Bob's payload
6. Encrypt with Bob's shared secret
7. Add ephemeral public key
```

### Decryption (Each Hop)

Each hop performs:

1. Compute shared secret using ephemeral pubkey and node's private key
2. Derive decryption key (rho) and HMAC key (mu)
3. Verify HMAC
4. Decrypt payload to get routing instructions
5. Shift payload left (removes own data, pads end with zeros)
6. Blind ephemeral public key for next hop
7. Forward modified packet

---

## Privacy Guarantees

### Information Visibility

| Information | Sender | Intermediate | Final Hop |
|-------------|--------|--------------|-----------|
| Full route | Yes | No | No |
| Sender identity | Yes | No | No |
| Destination | Yes | No | Yes |
| Payment amount | Yes | Partial | Yes |
| Route position | Yes | No | Partial |

### What Intermediaries Learn

An intermediate hop knows only:
- Previous hop's node ID (who sent the packet)
- Next hop's channel ID (where to forward)
- Amount and CLTV for the forwarded HTLC
- That they're neither first nor last (if route length > 2)

### What Remains Hidden

- Total route length
- Sender's identity
- Final destination
- Total payment amount
- Their position in the route

---

## Fixed Packet Size

All onion packets are exactly 1366 bytes regardless of route length:

- Prevents traffic analysis based on packet size
- Unused space filled with random padding
- Maximum 20 hops supported

---

## Security Properties

### Integrity

- HMAC-SHA256 at each layer
- Tampering detected immediately
- Modified packets rejected

### Forward Secrecy

- Ephemeral keys used per-payment
- Past payments cannot be decrypted if keys compromised later
- No correlation between payments

### Replay Protection

- Each hop tracks seen shared secrets
- Duplicate packets rejected
- Prevents payment replay attacks

---

## Common Failure Modes

### HMAC Mismatch

Payment fails with `BADONION` error. Causes:
- Packet corruption
- Incorrect key derivation
- Implementation bug

### Invalid Onion Version

If version byte is not 0, packet is rejected.

### Packet Too Short

Malformed packets are rejected immediately.

---

## Summary

Onion routing provides Lightning's privacy layer:

- **Source privacy**: Sender hidden from all hops
- **Path privacy**: Full route never revealed
- **Amount privacy**: Intermediaries don't know total payment
- **Fixed size**: Route length hidden
- **Forward secrecy**: Past payments stay private

---

## Related Topics

- [Routing & HTLCs](/docs/lightning/routing-fees) - Payment routing mechanics
- [Trampoline Routing](/docs/advanced/trampoline-routing) - Delegated pathfinding
- [Invoices (BOLT11)](/docs/lightning/invoices) - Payment request format

---

## Resources

- [BOLT 4: Onion Routing Protocol](https://github.com/lightning/bolts/blob/master/04-onion-routing.md)
- [Sphinx Paper](https://cypherpunks.ca/~iang/pubs/Sphinx_Oakland09.pdf) - Original protocol
