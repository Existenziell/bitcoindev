# Cryptography in Bitcoin

Bitcoin relies on several cryptographic primitives to secure transactions, prove ownership, and maintain the integrity of the blockchain. Understanding these cryptographic foundations is essential for grasping how Bitcoin achieves trustless security.

## The Power of Cryptography

Cryptography enables remarkable capabilities that seem almost magical:

- **Prove knowledge without revealing it**: You can prove you know a secret (like a private key) without ever exposing the secret itself. This is how you sign Bitcoin transactions.
- **Create unforgeable signatures**: Only the holder of a private key can create a valid signature, but anyone can verify it with the corresponding public key.
- **Commit to data irrevocably**: Hash functions create unique fingerprints that bind you to specific data without revealing it until you choose to.
- **Verify integrity instantly**: Detect any tampering with data, no matter how large, by comparing small hash values.

These concepts aren't unique to Bitcoin. You encounter cryptography daily:

| Application | Cryptographic Use |
|-------------|-------------------|
| **HTTPS/TLS** | Encrypts web traffic, verifies website identity |
| **PGP/GPG** | Email encryption and digital signatures |
| **Signal/WhatsApp** | End-to-end encrypted messaging |
| **SSH** | Secure remote server access |
| **Password Storage** | Hashing passwords so they're never stored in plain text |

Bitcoin combines these proven cryptographic techniques in a novel way to create a trustless monetary system.

---

## Overview

Bitcoin uses cryptography for three main purposes:

1. **Ownership & Authentication**: Proving you own bitcoin without revealing your private key
2. **Integrity**: Ensuring data hasn't been tampered with
3. **Proof-of-Work**: Securing the blockchain through computational work

| Primitive | Purpose | Used in |
|-----------|---------|---------|
| **Hash (SHA-256, SHA256D)** | Integrity, commitments, PoW | Block hashes, TXIDs, Merkle trees, mining |
| **ECDSA** | Signatures (legacy) | P2PKH, P2SH, pre-Taproot outputs |
| **Schnorr (BIP 340)** | Signatures (Taproot) | P2TR outputs, signature aggregation |

```mermaid
flowchart LR
  subgraph Sign[Sign]
    PK1[Private key]
    Msg1[Message]
    Sig[Signature]
    PK1 --> Sig
    Msg1 --> Sig
  end
  subgraph Verify[Verify]
    Sig2[Signature]
    Msg2[Message]
    Pub[Public key]
    Result[Valid or Invalid]
    Sig2 --> Result
    Msg2 --> Result
    Pub --> Result
  end
  Sign --> Verify
```

---

## Hash Functions

A **cryptographic hash function** takes any input data and produces a fixed-size output (the "hash" or "digest"). Hash functions are one-way: easy to compute, but practically impossible to reverse.

**Properties of Cryptographic Hash Functions:**

| Property | Description |
|----------|-------------|
| **Deterministic** | Same input always produces same output |
| **Fast** | Quick to compute for any input |
| **One-way** | Cannot derive input from output |
| **Collision-resistant** | Infeasible to find two inputs with same output |
| **Avalanche effect** | Small input change = completely different output |

### SHA-256

Bitcoin's primary hash function is **[SHA-256](/docs/glossary#sha-256)** (Secure Hash Algorithm, 256-bit).

**Characteristics:**
- Output: 256 bits (32 bytes, 64 hex characters)
- Designed by NSA, published in 2001
- No known practical attacks

**Example:**
```
Input:  "Hello"
SHA-256: 185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969

Input:  "Hello!"
SHA-256: 334d016f755cd6dc58c53a86e183882f8ec14f52fb05345887c8a5edd42c87b7
```

Notice how adding a single character completely changes the output (avalanche effect).

### Double SHA-256 ([SHA256D](/docs/glossary#sha256d))

Bitcoin often uses **double SHA-256**: `SHA256(SHA256(data))`

**Used for:**
- Block hashes
- [Transaction IDs](/docs/glossary#txid) (TXIDs)
- [Merkle tree](/docs/glossary#merkle-tree) nodes
- [Proof-of-work](/docs/glossary#pow)

**Why double hashing?**
- Defense against length-extension attacks
- Additional security margin
- Historical design choice by Satoshi

### Code: SHA-256 and Double SHA-256

:::code-group
```rust
// In Cargo.toml: hex = "0.4"
use hex;
use sha2::{Sha256, Digest};

fn sha256(data: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().into()
}

fn double_sha256(data: &[u8]) -> [u8; 32] {
    sha256(&sha256(data))
}

fn main() {
    let message = b"Hello";
    println!("SHA-256: {}", hex::encode(sha256(message)));
    println!("Double SHA-256: {}", hex::encode(double_sha256(message)));
}
```

```python
import hashlib

def sha256(data: bytes) -> bytes:
    return hashlib.sha256(data).digest()

def double_sha256(data: bytes) -> bytes:
    """Bitcoin's double SHA-256"""
    return hashlib.sha256(hashlib.sha256(data).digest()).digest()

# Example
message = b"Hello"
print(f"SHA-256: {sha256(message).hex()}")
print(f"Double SHA-256: {double_sha256(message).hex()}")
```

```cpp
#include <openssl/sha.h>
#include <vector>
#include <iomanip>
#include <sstream>

std::vector<uint8_t> sha256(const std::vector<uint8_t>& data) {
    std::vector<uint8_t> hash(SHA256_DIGEST_LENGTH);
    SHA256(data.data(), data.size(), hash.data());
    return hash;
}

std::vector<uint8_t> double_sha256(const std::vector<uint8_t>& data) {
    return sha256(sha256(data));
}

std::string to_hex(const std::vector<uint8_t>& data) {
    std::stringstream ss;
    for (auto byte : data) {
        ss << std::hex << std::setfill('0') << std::setw(2) << (int)byte;
    }
    return ss.str();
}

int main() {
    std::vector<uint8_t> message = {'H', 'e', 'l', 'l', 'o'};
    std::cout << "SHA-256: " << to_hex(sha256(message)) << std::endl;
    std::cout << "Double SHA-256: " << to_hex(double_sha256(message)) << std::endl;
}
```

```go
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

func SHA256(data []byte) [32]byte {
	return sha256.Sum256(data)
}

func DoubleSHA256(data []byte) [32]byte {
	// Bitcoin's double SHA-256
	first := sha256.Sum256(data)
	second := sha256.Sum256(first[:])
	return second
}

func main() {
	message := []byte("Hello")
	fmt.Printf("SHA-256: %s\n", hex.EncodeToString(SHA256(message)[:]))
	fmt.Printf("Double SHA-256: %s\n", hex.EncodeToString(DoubleSHA256(message)[:]))
}
```

```javascript
const crypto = require('crypto');

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest();
}

function doubleSha256(data) {
  return sha256(sha256(data));
}

// Example
const message = Buffer.from('Hello');
console.log(`SHA-256: ${sha256(message).toString('hex')}`);
console.log(`Double SHA-256: ${doubleSha256(message).toString('hex')}`);
```
:::

### [RIPEMD-160](/docs/glossary#ripemd-160) and Hash160

**RIPEMD-160** produces a 160-bit (20-byte) hash, used in combination with SHA-256.

**Hash160 = RIPEMD160(SHA256(data))**

**Used for:**
- Bitcoin [addresses](/docs/glossary#address) ([P2PKH](/docs/glossary#p2pkh), [P2SH](/docs/glossary#p2sh))
- Shorter than SHA-256, reducing address length
- Still cryptographically secure

### Code: Hash160

:::code-group
```rust
// In Cargo.toml: hex = "0.4"
use hex;
use ripemd::Ripemd160;
use sha2::{Sha256, Digest};

fn hash160(data: &[u8]) -> [u8; 20] {
    let sha256_hash = Sha256::digest(data);
    let ripemd_hash = Ripemd160::digest(&sha256_hash);
    ripemd_hash.into()
}

fn main() {
    let public_key = hex::decode("02b4632d08485ff1df2db55b9dafd23347d1c47a457072a1e87be26896549a8737").unwrap();
    println!("Hash160: {}", hex::encode(hash160(&public_key)));
}
```

```python
import hashlib

def hash160(data: bytes) -> bytes:
    """RIPEMD160(SHA256(data)) - used for Bitcoin addresses"""
    sha256_hash = hashlib.sha256(data).digest()
    ripemd160 = hashlib.new('ripemd160')
    ripemd160.update(sha256_hash)
    return ripemd160.digest()

# Hash a public key
public_key = bytes.fromhex("02b4632d08485ff1df2db55b9dafd23347d1c47a457072a1e87be26896549a8737")
print(f"Hash160: {hash160(public_key).hex()}")
```

```cpp
#include <openssl/sha.h>
#include <openssl/ripemd.h>

std::vector<uint8_t> hash160(const std::vector<uint8_t>& data) {
    // First SHA-256
    std::vector<uint8_t> sha256_hash(SHA256_DIGEST_LENGTH);
    SHA256(data.data(), data.size(), sha256_hash.data());
    
    // Then RIPEMD-160
    std::vector<uint8_t> hash(RIPEMD160_DIGEST_LENGTH);
    RIPEMD160(sha256_hash.data(), sha256_hash.size(), hash.data());
    return hash;
}
```

```go
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"golang.org/x/crypto/ripemd160"
)

// Hash160 performs RIPEMD160(SHA256(data)) - used for Bitcoin addresses
func Hash160(data []byte) []byte {
	sha256Hash := sha256.Sum256(data)
	hasher := ripemd160.New()
	hasher.Write(sha256Hash[:])
	return hasher.Sum(nil)
}

func main() {
	// Hash a public key
	publicKey, _ := hex.DecodeString("02b4632d08485ff1df2db55b9dafd23347d1c47a457072a1e87be26896549a8737")
	hash160 := Hash160(publicKey)
	fmt.Printf("Hash160: %s\n", hex.EncodeToString(hash160))
}
```

```javascript
const crypto = require('crypto');

function hash160(data) {
  const sha256Hash = crypto.createHash('sha256').update(data).digest();
  return crypto.createHash('ripemd160').update(sha256Hash).digest();
}

// Hash a public key
const publicKey = Buffer.from('02b4632d08485ff1df2db55b9dafd23347d1c47a457072a1e87be26896549a8737', 'hex');
console.log(`Hash160: ${hash160(publicKey).toString('hex')}`);
```
:::

---

## Merkle Trees

A **Merkle tree** (or hash tree) is a data structure that efficiently summarizes and verifies large datasets.

**Structure:**
```
                    Merkle Root
                   /            \
              Hash AB          Hash CD
             /      \         /      \
         Hash A   Hash B   Hash C   Hash D
            |        |        |        |
           Tx A    Tx B     Tx C     Tx D
```

### How Bitcoin Uses Merkle Trees

**Block Structure:**
- Each block contains a **[Merkle root](/docs/glossary#merkle-root)** in its header
- Merkle root summarizes all transactions in the block
- Changing any transaction changes the Merkle root

**Benefits:**
1. **Efficient verification**: Prove transaction inclusion with O(log n) hashes
2. **Compact proofs**: [SPV](/docs/glossary#spv) nodes don't need full blockchain
3. **Data integrity**: Any tampering is immediately detectable

### Merkle Proofs (SPV)

**Simplified Payment Verification** allows lightweight clients to verify transactions without downloading the full blockchain.

**To prove Tx B is in a block:**
```
Provide: Hash A, Hash CD
Client calculates:
  1. Hash B (from Tx B)
  2. Hash AB = SHA256(Hash A + Hash B)
  3. Merkle Root = SHA256(Hash AB + Hash CD)
  4. Compare with block header's Merkle root
```

### Code: Merkle Tree and Proof Verification

:::code-group
```rust
use sha2::{Sha256, Digest};

fn double_sha256(data: &[u8]) -> [u8; 32] {
    let first = Sha256::digest(data);
    Sha256::digest(&first).into()
}

fn merkle_root(mut hashes: Vec<[u8; 32]>) -> [u8; 32] {
    if hashes.is_empty() {
        return [0u8; 32];
    }
    
    while hashes.len() > 1 {
        // Duplicate last if odd
        if hashes.len() % 2 == 1 {
            hashes.push(*hashes.last().unwrap());
        }
        
        // Hash pairs
        hashes = hashes
            .chunks(2)
            .map(|pair| {
                let mut combined = Vec::with_capacity(64);
                combined.extend_from_slice(&pair[0]);
                combined.extend_from_slice(&pair[1]);
                double_sha256(&combined)
            })
            .collect();
    }
    
    hashes[0]
}

fn verify_merkle_proof(tx_hash: [u8; 32], proof: &[[u8; 32]], 
                       root: [u8; 32], mut index: usize) -> bool {
    let mut current = tx_hash;
    for sibling in proof {
        let mut combined = Vec::with_capacity(64);
        if index % 2 == 0 {
            combined.extend_from_slice(&current);
            combined.extend_from_slice(sibling);
        } else {
            combined.extend_from_slice(sibling);
            combined.extend_from_slice(&current);
        }
        current = double_sha256(&combined);
        index /= 2;
    }
    current == root
}
```

```python
import hashlib

def double_sha256(data: bytes) -> bytes:
    return hashlib.sha256(hashlib.sha256(data).digest()).digest()

def merkle_root(tx_hashes: list) -> bytes:
    """Calculate Merkle root from transaction hashes"""
    if len(tx_hashes) == 0:
        return bytes(32)
    if len(tx_hashes) == 1:
        return tx_hashes[0]
    
    # Duplicate last hash if odd number
    if len(tx_hashes) % 2 == 1:
        tx_hashes = tx_hashes + [tx_hashes[-1]]
    
    # Hash pairs
    next_level = []
    for i in range(0, len(tx_hashes), 2):
        combined = tx_hashes[i] + tx_hashes[i + 1]
        next_level.append(double_sha256(combined))
    
    return merkle_root(next_level)

def verify_merkle_proof(tx_hash: bytes, proof: list, root: bytes, index: int) -> bool:
    """Verify transaction inclusion using Merkle proof"""
    current = tx_hash
    for sibling in proof:
        if index % 2 == 0:
            current = double_sha256(current + sibling)
        else:
            current = double_sha256(sibling + current)
        index //= 2
    return current == root

# Example: 4 transactions
tx_hashes = [double_sha256(f"tx{i}".encode()) for i in range(4)]
root = merkle_root(tx_hashes)
print(f"Merkle Root: {root.hex()}")
```

```cpp
#include <vector>
#include <array>
#include <openssl/sha.h>

using Hash = std::array<uint8_t, 32>;

Hash double_sha256(const std::vector<uint8_t>& data) {
    Hash first, second;
    SHA256(data.data(), data.size(), first.data());
    SHA256(first.data(), first.size(), second.data());
    return second;
}

Hash merkle_root(std::vector<Hash> hashes) {
    if (hashes.empty()) return Hash{};
    
    while (hashes.size() > 1) {
        // Duplicate last if odd
        if (hashes.size() % 2 == 1) {
            hashes.push_back(hashes.back());
        }
        
        // Hash pairs
        std::vector<Hash> next_level;
        for (size_t i = 0; i < hashes.size(); i += 2) {
            std::vector<uint8_t> combined;
            combined.insert(combined.end(), hashes[i].begin(), hashes[i].end());
            combined.insert(combined.end(), hashes[i+1].begin(), hashes[i+1].end());
            next_level.push_back(double_sha256(combined));
        }
        hashes = std::move(next_level);
    }
    
    return hashes[0];
}
```

```go
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

func DoubleSHA256(data []byte) [32]byte {
	first := sha256.Sum256(data)
	second := sha256.Sum256(first[:])
	return second
}

func MerkleRoot(hashes [][]byte) [32]byte {
	if len(hashes) == 0 {
		return [32]byte{}
	}
	if len(hashes) == 1 {
		var result [32]byte
		copy(result[:], hashes[0])
		return result
	}
	
	// Duplicate last if odd
	if len(hashes)%2 == 1 {
		hashes = append(hashes, hashes[len(hashes)-1])
	}
	
	// Hash pairs
	var nextLevel [][]byte
	for i := 0; i < len(hashes); i += 2 {
		combined := append(hashes[i], hashes[i+1]...)
		hash := DoubleSHA256(combined)
		nextLevel = append(nextLevel, hash[:])
	}
	
	return MerkleRoot(nextLevel)
}

func VerifyMerkleProof(txHash []byte, proof [][]byte, root [32]byte, index int) bool {
	current := make([]byte, 32)
	copy(current, txHash)
	
	for _, sibling := range proof {
		var combined []byte
		if index%2 == 0 {
			combined = append(current, sibling...)
		} else {
			combined = append(sibling, current...)
		}
		current = DoubleSHA256(combined)[:]
		index = index / 2
	}
	
	return hex.EncodeToString(current) == hex.EncodeToString(root[:])
}

func main() {
	// Example: 4 transactions
	txHashes := make([][]byte, 4)
	for i := 0; i < 4; i++ {
		tx := []byte(fmt.Sprintf("tx%d", i))
		hash := DoubleSHA256(tx)
		txHashes[i] = hash[:]
	}
	
	root := MerkleRoot(txHashes)
	fmt.Printf("Merkle Root: %s\n", hex.EncodeToString(root[:]))
}
```

```javascript
const crypto = require('crypto');

function doubleSha256(data) {
    const first = crypto.createHash('sha256').update(data).digest();
    return crypto.createHash('sha256').update(first).digest();
}

function merkleRoot(hashes) {
    if (hashes.length === 0) return Buffer.alloc(32);
    if (hashes.length === 1) return hashes[0];
    
    // Duplicate last if odd
    if (hashes.length % 2 === 1) {
        hashes.push(hashes[hashes.length - 1]);
    }
    
    // Hash pairs
    const nextLevel = [];
    for (let i = 0; i < hashes.length; i += 2) {
        const combined = Buffer.concat([hashes[i], hashes[i + 1]]);
        nextLevel.push(doubleSha256(combined));
    }
    
    return merkleRoot(nextLevel);
}

function verifyMerkleProof(txHash, proof, root, index) {
    let current = txHash;
    for (const sibling of proof) {
        if (index % 2 == 0) {
            current = doubleSha256(Buffer.concat([current, sibling]));
        } else {
            current = doubleSha256(Buffer.concat([sibling, current]));
        }
        index = Math.floor(index / 2);
    }
    return current.equals(root);
}

// Example: 4 transactions
const txHashes = [0, 1, 2, 3].map(i => 
    doubleSha256(Buffer.from(`tx${i}`))
);
const root = merkleRoot(txHashes);
console.log(`Merkle Root: ${root.toString('hex')}`);
```
:::

---

## Elliptic Curve Cryptography

![Elliptic Curve Cryptography](/images/docs/ECC.webp)

**Elliptic Curve Cryptography (ECC)** is a public-key cryptography system based on the algebraic structure of elliptic curves over finite fields.

**Why Bitcoin uses ECC:**
- Smaller key sizes than RSA (256-bit vs 3072-bit for equivalent security)
- Faster computation
- Lower bandwidth and storage requirements

### The secp256k1 Curve

Bitcoin uses the **secp256k1** elliptic curve (used by both [ECDSA](#ecdsa) and [Schnorr](#schnorr-signatures) for signatures), defined by the equation:

```
y² = x³ + 7 (mod p)
```

**Parameters:**
- **p** (prime): 2²⁵⁶ - 2³² - 977
- **Order (n)**: Number of points on the curve
- **Generator point (G)**: Fixed starting point for key generation

**Why secp256k1?**
- Chosen by Satoshi (not the most common curve at the time)
- Efficiently computable
- No known weaknesses
- Parameters are "nothing up my sleeve" numbers (verifiably random)

### Key Generation

**Private Key:**
- Random 256-bit number (1 to n-1)
- Must be kept secret
- Generated from cryptographically secure random source

**Public Key:**
- Derived from private key: `Public Key = Private Key × G`
- Point multiplication on the elliptic curve
- Cannot reverse to find private key (discrete logarithm problem)
- Can be shared publicly

**Key Relationship:**
```
Random Number → Private Key → Public Key → Bitcoin Address
     (256 bits)    (256 bits)   (512 bits)   (160 bits)
```

### Code: Key Generation

:::code-group
```rust
// In Cargo.toml: hex = "0.4"
use hex;
use secp256k1::{Secp256k1, SecretKey, PublicKey};
use secp256k1::rand::rngs::OsRng;

fn main() {
    let secp = Secp256k1::new();
    
    // Generate random private key
    let (secret_key, public_key) = secp.generate_keypair(&mut OsRng);
    
    // Serialize keys
    let private_key_bytes = secret_key.secret_bytes();
    let public_key_compressed = public_key.serialize();                  // 33 bytes
    let public_key_uncompressed = public_key.serialize_uncompressed();   // 65 bytes
    
    println!("Private Key: {}", hex::encode(private_key_bytes));
    println!("Public Key (compressed): {}", hex::encode(public_key_compressed));
    println!("Public Key (uncompressed): {}", hex::encode(public_key_uncompressed));
}
```

```python
import secrets
from secp256k1 import PrivateKey

# Generate random private key (32 bytes)
private_key_bytes = secrets.token_bytes(32)
private_key = PrivateKey(private_key_bytes)

# Derive public key
public_key_compressed = private_key.pubkey.serialize()           # 33 bytes
public_key_uncompressed = private_key.pubkey.serialize(False)    # 65 bytes

print(f"Private Key: {private_key_bytes.hex()}")
print(f"Public Key (compressed): {public_key_compressed.hex()}")
print(f"Public Key (uncompressed): {public_key_uncompressed.hex()}")
```

```cpp
#include <secp256k1.h>
#include <random>

int main() {
    // Create context
    secp256k1_context* ctx = secp256k1_context_create(SECP256K1_CONTEXT_SIGN);
    
    // Generate random private key (use proper CSPRNG in production)
    unsigned char private_key[32];
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 255);
    for (int i = 0; i < 32; i++) {
        private_key[i] = dis(gen);
    }
    
    // Verify private key is valid
    while (!secp256k1_ec_seckey_verify(ctx, private_key)) {
        for (int i = 0; i < 32; i++) private_key[i] = dis(gen);
    }
    
    // Derive public key
    secp256k1_pubkey pubkey;
    secp256k1_ec_pubkey_create(ctx, &pubkey, private_key);
    
    // Serialize public key (compressed)
    unsigned char public_key_compressed[33];
    size_t len = 33;
    secp256k1_ec_pubkey_serialize(ctx, public_key_compressed, &len, 
                                   &pubkey, SECP256K1_EC_COMPRESSED);
    
    secp256k1_context_destroy(ctx);
}
```

```go
package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"

	"github.com/btcsuite/btcd/btcec/v2"
)

func main() {
	// Generate random private key
	privateKey, err := btcec.NewPrivateKey()
	if err != nil {
		panic(err)
	}

	// Serialize keys
	privateKeyBytes := privateKey.Serialize()
	publicKey := privateKey.PubKey()
	publicKeyCompressed := publicKey.SerializeCompressed()     // 33 bytes
	publicKeyUncompressed := publicKey.SerializeUncompressed()  // 65 bytes

	fmt.Printf("Private Key: %s\n", hex.EncodeToString(privateKeyBytes))
	fmt.Printf("Public Key (compressed): %s\n", hex.EncodeToString(publicKeyCompressed))
	fmt.Printf("Public Key (uncompressed): %s\n", hex.EncodeToString(publicKeyUncompressed))
}
```

```javascript
const { randomBytes } = require('crypto');
const secp256k1 = require('secp256k1');

// Generate random private key
let privateKey;
do {
  privateKey = randomBytes(32);
} while (!secp256k1.privateKeyVerify(privateKey));

// Derive public key
const publicKeyCompressed = secp256k1.publicKeyCreate(privateKey, true);    // 33 bytes
const publicKeyUncompressed = secp256k1.publicKeyCreate(privateKey, false); // 65 bytes

console.log(`Private Key: ${privateKey.toString('hex')}`);
console.log(`Public Key (compressed): ${Buffer.from(publicKeyCompressed).toString('hex')}`);
console.log(`Public Key (uncompressed): ${Buffer.from(publicKeyUncompressed).toString('hex')}`);
```
:::

### The Discrete Logarithm Problem

**Why can't you derive the private key from the public key?**

Given `Q = k × G` where:
- `Q` is the public key (known)
- `G` is the generator point (known)
- `k` is the private key (unknown)

Finding `k` requires solving the **Elliptic Curve Discrete Logarithm Problem (ECDLP)**, which is computationally infeasible for sufficiently large numbers.

**Security Level:**
- 256-bit private key = ~128 bits of security
- Would take billions of years with current technology
- Quantum computers could theoretically break this (see future considerations)

### ECC and Signature Schemes

**Elliptic Curve Cryptography (ECC)** provides the curve (secp256k1), key generation, and the underlying math—it answers *how you get a public key from a private key*. **Signature schemes** such as [ECDSA](#ecdsa) and [Schnorr](#schnorr-signatures) are different algorithms built on top of ECC that use those key pairs to *sign* and *verify* messages. Bitcoin uses the same curve for both; ECC is the foundation, ECDSA and Schnorr are the signature algorithms.

---

## Digital Signatures

A **digital signature** proves:
1. **Authenticity**: Message came from the claimed sender
2. **Integrity**: Message hasn't been altered
3. **Non-repudiation**: Sender cannot deny sending

**Signature types in Bitcoin:**
- **[ECDSA](#ecdsa)**: Used for legacy outputs (P2PKH, P2SH, pre-Taproot SegWit).
- **[Schnorr](#schnorr-signatures)** (BIP 340): Used for [Taproot](/docs/glossary#taproot) (P2TR) outputs; enables smaller signatures and aggregation.

### Signing a Bitcoin Transaction

When you spend bitcoin:

1. **Construct transaction** with [inputs](/docs/glossary#input) and [outputs](/docs/glossary#output)
2. **Create signature hash** (sighash) of transaction data
3. **Sign** the sighash with your private key
4. **Include signature** in transaction's [witness](/docs/glossary#witness)/[scriptSig](/docs/glossary#scriptsig)
5. **Broadcast** transaction to network
6. **Nodes verify** signature matches public key and transaction

---

## ECDSA

**ECDSA** (Elliptic Curve Digital Signature Algorithm) was Bitcoin's original signature scheme. Bitcoin used it for all signatures until [Taproot](/docs/glossary#taproot) introduced [Schnorr](#schnorr-signatures).

**Signing Process:**
1. Hash the message: `z = SHA256(message)`
2. Generate random number `k` (nonce)
3. Calculate point `R = k × G`
4. Calculate signature: `s = k⁻¹(z + r × privateKey) mod n`
5. Signature is the pair `(r, s)`

**Verification Process:**
1. Hash the message: `z = SHA256(message)`
2. Calculate: `u1 = z × s⁻¹ mod n`
3. Calculate: `u2 = r × s⁻¹ mod n`
4. Calculate point: `P = u1 × G + u2 × PublicKey`
5. Signature valid if `P.x = r`

**ECDSA Characteristics:**
- Signature size: 70-72 bytes (DER encoded)
- Requires secure random nonce `k`
- Reusing `k` exposes private key!

### Code: ECDSA Signing and Verification

:::code-group
```rust
// In Cargo.toml: hex = "0.4"
use hex;
use secp256k1::{Secp256k1, SecretKey, Message};
use sha2::{Sha256, Digest};

fn main() {
    let secp = Secp256k1::new();
    
    // Private key
    let private_key = SecretKey::from_slice(
        &hex::decode("e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35").unwrap()
    ).unwrap();
    
    // Message to sign
    let message = b"Hello, Bitcoin!";
    let message_hash = Sha256::digest(message);
    let msg = Message::from_digest_slice(&message_hash).unwrap();
    
    // Sign
    let signature = secp.sign_ecdsa(&msg, &private_key);
    println!("Message Hash: {}", hex::encode(message_hash));
    println!("Signature: {}", hex::encode(signature.serialize_compact()));
    
    // Verify
    let public_key = private_key.public_key(&secp);
    let is_valid = secp.verify_ecdsa(&msg, &signature, &public_key).is_ok();
    println!("Signature valid: {}", is_valid);
}
```

```python
import hashlib
from secp256k1 import PrivateKey

# Private key (use secrets.token_bytes(32) for real applications)
private_key = PrivateKey(bytes.fromhex(
    "e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35"
))

# Message to sign
message = b"Hello, Bitcoin!"
message_hash = hashlib.sha256(message).digest()

# Sign
signature = private_key.ecdsa_sign(message_hash)
signature_der = private_key.ecdsa_serialize(signature)

print(f"Message Hash: {message_hash.hex()}")
print(f"Signature (DER): {signature_der.hex()}")

# Verify
is_valid = private_key.pubkey.ecdsa_verify(message_hash, signature)
print(f"Signature valid: {is_valid}")
```

```cpp
#include <secp256k1.h>
#include <openssl/sha.h>
#include <cstring>

int main() {
    secp256k1_context* ctx = secp256k1_context_create(
        SECP256K1_CONTEXT_SIGN | SECP256K1_CONTEXT_VERIFY
    );
    
    // Private key (initialize from hex in production)
    unsigned char private_key[32];
    // hex: "e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35"
    
    // Message hash
    const char* message = "Hello, Bitcoin!";
    unsigned char message_hash[SHA256_DIGEST_LENGTH];
    SHA256((unsigned char*)message, strlen(message), message_hash);
    
    // Sign
    secp256k1_ecdsa_signature signature;
    secp256k1_ecdsa_sign(ctx, &signature, message_hash, private_key, NULL, NULL);
    
    // Serialize signature
    unsigned char sig_serialized[64];
    secp256k1_ecdsa_signature_serialize_compact(ctx, sig_serialized, &signature);
    
    // Get public key and verify
    secp256k1_pubkey pubkey;
    secp256k1_ec_pubkey_create(ctx, &pubkey, private_key);
    int is_valid = secp256k1_ecdsa_verify(ctx, &signature, message_hash, &pubkey);
    
    secp256k1_context_destroy(ctx);
    return 0;
}
```

```go
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"github.com/btcsuite/btcd/btcec/v2"
	"github.com/btcsuite/btcd/btcec/v2/ecdsa"
)

func main() {
	// Private key
	privateKeyBytes, _ := hex.DecodeString("e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35")
	privateKey, _ := btcec.PrivKeyFromBytes(privateKeyBytes)

	// Message to sign
	message := []byte("Hello, Bitcoin!")
	messageHash := sha256.Sum256(message)

	// Sign
	signature := ecdsa.Sign(privateKey, messageHash[:])
	signatureBytes := signature.Serialize()

	fmt.Printf("Message Hash: %s\n", hex.EncodeToString(messageHash[:]))
	fmt.Printf("Signature: %s\n", hex.EncodeToString(signatureBytes))

	// Verify
	publicKey := privateKey.PubKey()
	isValid := signature.Verify(messageHash[:], publicKey)
	fmt.Printf("Signature valid: %v\n", isValid)
}
```

```javascript
const crypto = require('crypto');
const secp256k1 = require('secp256k1');

// Private key
const privateKey = Buffer.from(
  'e8f32e723decf4051aefac8e2c93c9c5b214313817cdb01a1494b917c8436b35', 'hex'
);

// Message to sign
const message = Buffer.from('Hello, Bitcoin!');
const messageHash = crypto.createHash('sha256').update(message).digest();

// Sign
const sigObj = secp256k1.ecdsaSign(messageHash, privateKey);
console.log(`Message Hash: ${messageHash.toString('hex')}`);
console.log(`Signature: ${Buffer.from(sigObj.signature).toString('hex')}`);

// Verify
const publicKey = secp256k1.publicKeyCreate(privateKey);
const isValid = secp256k1.ecdsaVerify(sigObj.signature, messageHash, publicKey);
console.log(`Signature valid: ${isValid}`);
```
:::

---

## Schnorr Signatures

**Schnorr signatures** (BIP 340) are Bitcoin's signature scheme for [Taproot](/docs/glossary#taproot) (P2TR) outputs, activated in November 2021 (block 709,632). [Pieter Wuille](/docs/history/people#pieter-wuille) was a key designer of BIP 340.

### Why Schnorr in Bitcoin?

Schnorr offers simpler mathematics, stronger security proofs under standard assumptions, and **linearity**—the property that enables key and signature aggregation. Fixed 64-byte signatures reduce size and cost compared to variable-length ECDSA.

### Schnorr vs ECDSA

| Property | ECDSA | Schnorr (BIP 340) |
|----------|-------|-------------------|
| **Signature size** | 70–72 bytes (DER) | 64 bytes (fixed) |
| **Encoding** | Variable (DER) | Fixed `r\|\|s` |
| **Nonce** | Must be secret, unique; reuse leaks key | Derived (e.g. BIP 340 nonce); safer |
| **Aggregation** | No | Yes (e.g. [MuSig](/docs/glossary#musig)) |
| **Batch verification** | Per-signature | Faster batch mode |
| **Security proofs** | More complex | Simpler, well-understood |

### BIP 340 Format

- **Signature**: 64 bytes = 32-byte `r` (x-coordinate of ephemeral point) concatenated with 32-byte `s` (scalar).
- **Public key**: 32-byte **x-only** public key (y-coordinate omitted; implied by curve and x). No encoding variability.
- **Tagged hashes**: BIP 340 uses domain-separated hashes (e.g. `BIP0340/challenge`, `BIP0340/aux`, `BIP0340/nonce`) to avoid cross-protocol misuse.

### Schnorr in Bitcoin (BIP 340)

![Schnorr Signature Equations](/images/docs/schnorr-equations.png)

Schnorr signatures in Bitcoin follow BIP 340: they use the secp256k1 curve, x-only public keys, and tagged hashes for all hashing steps (signing, nonce derivation, challenge computation).

### Code: BIP-340 Schnorr Tagged Hash

:::code-group
```rust
// In Cargo.toml: hex = "0.4"
use hex;
use sha2::{Sha256, Digest};

fn tagged_hash(tag: &str, msg: &[u8]) -> [u8; 32] {
    let tag_hash = Sha256::digest(tag.as_bytes());
    let mut hasher = Sha256::new();
    hasher.update(&tag_hash);
    hasher.update(&tag_hash);
    hasher.update(msg);
    hasher.finalize().into()
}

fn main() {
    let challenge = tagged_hash("BIP0340/challenge", b"some data");
    println!("Challenge hash: {}", hex::encode(challenge));
}
```

```python
import hashlib

def tagged_hash(tag: str, msg: bytes) -> bytes:
    """BIP-340 tagged hash for domain separation"""
    tag_hash = hashlib.sha256(tag.encode()).digest()
    return hashlib.sha256(tag_hash + tag_hash + msg).digest()

# Example tags used in Bitcoin
challenge = tagged_hash("BIP0340/challenge", b"some data")
aux = tagged_hash("BIP0340/aux", b"random auxiliary data")
nonce = tagged_hash("BIP0340/nonce", b"nonce derivation input")

print(f"Challenge hash: {challenge.hex()}")
```

```cpp
#include <iostream>
#include <vector>
#include <array>
#include <string>
#include <openssl/sha.h>

using Hash256 = std::array<uint8_t, 32>;

Hash256 sha256(const std::vector<uint8_t>& data) {
    Hash256 hash;
    SHA256(data.data(), data.size(), hash.data());
    return hash;
}

Hash256 tagged_hash(const std::string& tag, const std::vector<uint8_t>& msg) {
    // Hash the tag
    std::vector<uint8_t> tag_bytes(tag.begin(), tag.end());
    Hash256 tag_hash = sha256(tag_bytes);
    
    // Concatenate: tag_hash || tag_hash || msg
    std::vector<uint8_t> data;
    data.insert(data.end(), tag_hash.begin(), tag_hash.end());
    data.insert(data.end(), tag_hash.begin(), tag_hash.end());
    data.insert(data.end(), msg.begin(), msg.end());
    
    return sha256(data);
}

std::string to_hex(const Hash256& hash) {
    std::string result;
    for (uint8_t byte : hash) {
        char buf[3];
        snprintf(buf, sizeof(buf), "%02x", byte);
        result += buf;
    }
    return result;
}

int main() {
    std::vector<uint8_t> msg = {'s', 'o', 'm', 'e', ' ', 'd', 'a', 't', 'a'};
    Hash256 challenge = tagged_hash("BIP0340/challenge", msg);
    std::cout << "Challenge hash: " << to_hex(challenge) << std::endl;
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

func TaggedHash(tag string, msg []byte) [32]byte {
	tagHash := sha256.Sum256([]byte(tag))
	
	// Concatenate: tag_hash || tag_hash || msg
	data := make([]byte, 0, len(tagHash)*2+len(msg))
	data = append(data, tagHash[:]...)
	data = append(data, tagHash[:]...)
	data = append(data, msg...)
	
	return sha256.Sum256(data)
}

func main() {
	// Example tags used in Bitcoin
	challenge := TaggedHash("BIP0340/challenge", []byte("some data"))
	aux := TaggedHash("BIP0340/aux", []byte("random auxiliary data"))
	nonce := TaggedHash("BIP0340/nonce", []byte("nonce derivation input"))
	
	fmt.Printf("Challenge hash: %s\n", hex.EncodeToString(challenge[:]))
	fmt.Printf("Aux hash: %s\n", hex.EncodeToString(aux[:]))
	fmt.Printf("Nonce hash: %s\n", hex.EncodeToString(nonce[:]))
}
```

```javascript
const crypto = require('crypto');

function taggedHash(tag, msg) {
    const tagHash = crypto.createHash('sha256').update(tag).digest();
    return crypto.createHash('sha256')
        .update(tagHash)
        .update(tagHash)
        .update(msg)
        .digest();
}

// Example tags used in Bitcoin
const challenge = taggedHash('BIP0340/challenge', Buffer.from('some data'));
const aux = taggedHash('BIP0340/aux', Buffer.from('random auxiliary data'));
const nonce = taggedHash('BIP0340/nonce', Buffer.from('nonce derivation input'));

console.log(`Challenge hash: ${challenge.toString('hex')}`);
```
:::

### Signature Aggregation

Schnorr's linearity allows multiple signatures to be combined into one. **[MuSig](/docs/glossary#musig)** and **MuSig2** (BIP 327) let multiple signers produce a single Schnorr signature for a combined public key. Benefits:

- **Privacy**: Multi-party spends look like single-signature spends on-chain.
- **Efficiency**: One 64-byte signature instead of many; lower fees.
- **Compatibility**: Aggregated output is a normal Taproot key-path spend.

For how Taproot uses Schnorr and MuSig in practice, see [Taproot](/docs/bitcoin/taproot).

### Relation to Taproot

Taproot (BIPs 341, 342) uses Schnorr for all P2TR signatures. Key-path spends need only one Schnorr signature; script-path spends reveal one branch of a Merkle tree and still use Schnorr in [Tapscript](/docs/glossary#tapscript). That way, complex contracts can look identical to simple single-sig payments. For MAST, script paths, and address format, see [Taproot](/docs/bitcoin/taproot).

### Resources

- **[BIP 340: Schnorr Signatures](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)** — Signature specification
- **[BIP 327: MuSig2](https://github.com/bitcoin/bips/blob/master/bip-0327.mediawiki)** — Multi-signature aggregation

---

## Address Encoding

### [Base58](/docs/glossary#base58)Check

**Base58** encoding uses 58 characters (excluding 0, O, I, l to avoid confusion):

```
123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
```

**Base58Check** adds a checksum:
1. Add version byte prefix
2. Calculate checksum: `SHA256(SHA256(data))` (first 4 bytes)
3. Append checksum to data
4. Encode in Base58

**Used for:** Legacy addresses (1..., 3...)

### [Bech32](/docs/glossary#bech32) and Bech32m

**Bech32** encoding (BIP-173) is used for [SegWit](/docs/glossary#segwit) addresses:

**Characteristics:**
- Case-insensitive
- Better error detection (BCH codes)
- QR code friendly
- Prefix: `bc1` for mainnet, `tb1` for testnet

**Address Types:**
- `bc1q...`: Native SegWit ([P2WPKH](/docs/glossary#p2wpkh), [P2WSH](/docs/glossary#p2wsh)) - Bech32
- `bc1p...`: Taproot ([P2TR](/docs/glossary#p2tr)) - Bech32m

**Bech32m** (BIP-350) is a modified version for Taproot addresses with improved error detection.

### Code: Address Generation (Full Pipeline)

:::code-group
```rust
use bitcoin::{
    Network, PrivateKey, PublicKey, Address,
    secp256k1::{Secp256k1, rand},
};

fn main() {
    let secp = Secp256k1::new();
    
    // Generate private key
    let (secret_key, _) = secp.generate_keypair(&mut rand::thread_rng());
    let private_key = PrivateKey::new(secret_key, Network::Bitcoin);
    
    // Derive public key
    let public_key = PublicKey::from_private_key(&secp, &private_key);
    
    // Generate addresses
    let p2pkh = Address::p2pkh(&public_key, Network::Bitcoin);
    let p2wpkh = Address::p2wpkh(&public_key, Network::Bitcoin).unwrap();
    
    println!("Private Key (WIF): {}", private_key);
    println!("Public Key: {}", public_key);
    println!("P2PKH Address: {}", p2pkh);
    println!("P2WPKH Address: {}", p2wpkh);
}
```

```python
import hashlib
import secrets
from secp256k1 import PrivateKey

# Base58 alphabet
BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

def base58_encode(data: bytes) -> str:
    num = int.from_bytes(data, 'big')
    result = ""
    while num > 0:
        num, rem = divmod(num, 58)
        result = BASE58_ALPHABET[rem] + result
    for byte in data:
        if byte == 0:
            result = '1' + result
        else:
            break
    return result

def base58check_encode(version: bytes, payload: bytes) -> str:
    data = version + payload
    checksum = hashlib.sha256(hashlib.sha256(data).digest()).digest()[:4]
    return base58_encode(data + checksum)

def hash160(data: bytes) -> bytes:
    sha256_hash = hashlib.sha256(data).digest()
    return hashlib.new('ripemd160', sha256_hash).digest()

# Bech32 encoding (simplified)
BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"

def bech32_polymod(values):
    GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
    chk = 1
    for v in values:
        b = chk >> 25
        chk = ((chk & 0x1ffffff) << 5) ^ v
        for i in range(5):
            chk ^= GEN[i] if ((b >> i) & 1) else 0
    return chk

def bech32_encode(hrp: str, data: list) -> str:
    values = [ord(c) >> 5 for c in hrp] + [0] + [ord(c) & 31 for c in hrp] + data
    polymod = bech32_polymod(values + [0]*6) ^ 1
    checksum = [(polymod >> 5*(5-i)) & 31 for i in range(6)]
    return hrp + "1" + "".join(BECH32_CHARSET[d] for d in data + checksum)

def convertbits(data, frombits, tobits, pad=True):
    acc, bits, ret = 0, 0, []
    maxv = (1 << tobits) - 1
    for value in data:
        acc = (acc << frombits) | value
        bits += frombits
        while bits >= tobits:
            bits -= tobits
            ret.append((acc >> bits) & maxv)
    if pad and bits:
        ret.append((acc << (tobits - bits)) & maxv)
    return ret

def generate_addresses():
    """Generate all address types from a single private key"""
    # 1. Generate private key
    private_key_bytes = secrets.token_bytes(32)
    private_key = PrivateKey(private_key_bytes)
    
    # 2. Get compressed public key
    public_key = private_key.pubkey.serialize()
    
    # 3. Hash160 the public key
    pubkey_hash = hash160(public_key)
    
    # 4. Generate addresses
    # P2PKH (Legacy) - starts with '1'
    p2pkh = base58check_encode(b'\x00', pubkey_hash)
    
    # P2WPKH (Native SegWit) - starts with 'bc1q'
    witness_program = convertbits(list(pubkey_hash), 8, 5)
    p2wpkh = bech32_encode("bc", [0] + witness_program)
    
    return {
        "private_key": private_key_bytes.hex(),
        "public_key": public_key.hex(),
        "pubkey_hash": pubkey_hash.hex(),
        "p2pkh_address": p2pkh,
        "p2wpkh_address": p2wpkh,
    }

result = generate_addresses()
print(f"Private Key: {result['private_key']}")
print(f"Public Key: {result['public_key']}")
print(f"P2PKH Address: {result['p2pkh_address']}")
print(f"P2WPKH Address: {result['p2wpkh_address']}")
```

```cpp
#include <iostream>
#include <vector>
#include <array>
#include <openssl/sha.h>
#include <openssl/ripemd.h>
#include <secp256k1.h>

using Hash256 = std::array<uint8_t, 32>;
using Hash160 = std::array<uint8_t, 20>;

const std::string BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

Hash256 sha256(const std::vector<uint8_t>& data) {
    Hash256 hash;
    SHA256(data.data(), data.size(), hash.data());
    return hash;
}

Hash160 hash160(const std::vector<uint8_t>& data) {
    Hash256 sha_hash;
    SHA256(data.data(), data.size(), sha_hash.data());
    Hash160 ripemd_hash;
    RIPEMD160(sha_hash.data(), sha_hash.size(), ripemd_hash.data());
    return ripemd_hash;
}

std::string base58_encode(const std::vector<uint8_t>& data) {
    std::vector<uint8_t> digits(data.size() * 138 / 100 + 1);
    size_t digitslen = 1;
    for (size_t i = 0; i < data.size(); i++) {
        uint32_t carry = data[i];
        for (size_t j = 0; j < digitslen; j++) {
            carry += (uint32_t)(digits[j]) << 8;
            digits[j] = carry % 58;
            carry /= 58;
        }
        while (carry) {
            digits[digitslen++] = carry % 58;
            carry /= 58;
        }
    }
    std::string result;
    for (size_t i = 0; i < data.size() && data[i] == 0; i++) {
        result += '1';
    }
    for (size_t i = 0; i < digitslen; i++) {
        result += BASE58_ALPHABET[digits[digitslen - 1 - i]];
    }
    return result;
}

std::string base58check_encode(uint8_t version, const Hash160& payload) {
    std::vector<uint8_t> data;
    data.push_back(version);
    data.insert(data.end(), payload.begin(), payload.end());
    
    auto hash1 = sha256(data);
    std::vector<uint8_t> hash1_vec(hash1.begin(), hash1.end());
    auto hash2 = sha256(hash1_vec);
    
    data.insert(data.end(), hash2.begin(), hash2.begin() + 4);
    return base58_encode(data);
}

int main() {
    secp256k1_context* ctx = secp256k1_context_create(SECP256K1_CONTEXT_SIGN);
    
    // Generate random private key (use secure random in production)
    uint8_t private_key[32];
    // ... fill with secure random bytes ...
    
    // Generate public key
    secp256k1_pubkey pubkey;
    secp256k1_ec_pubkey_create(ctx, &pubkey, private_key);
    
    // Serialize compressed public key
    std::vector<uint8_t> public_key(33);
    size_t pk_len = 33;
    secp256k1_ec_pubkey_serialize(ctx, public_key.data(), &pk_len, &pubkey, SECP256K1_EC_COMPRESSED);
    
    // Generate P2PKH address
    Hash160 pubkey_hash = hash160(public_key);
    std::string p2pkh = base58check_encode(0x00, pubkey_hash);
    
    std::cout << "P2PKH Address: " << p2pkh << std::endl;
    
    secp256k1_context_destroy(ctx);
    return 0;
}
```

```go
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"github.com/btcsuite/btcd/btcec/v2"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
	"golang.org/x/crypto/ripemd160"
)

func hash160(data []byte) []byte {
	sha := sha256.Sum256(data)
	hasher := ripemd160.New()
	hasher.Write(sha[:])
	return hasher.Sum(nil)
}

func generateAddresses() {
	// 1. Generate private key
	privateKey, err := btcec.NewPrivateKey()
	if err != nil {
		panic(err)
	}

	// 2. Get compressed public key
	publicKey := privateKey.PubKey()
	publicKeyBytes := publicKey.SerializeCompressed()

	// 3. Hash160 the public key
	pubkeyHash := hash160(publicKeyBytes)

	// 4. Generate P2PKH address (Legacy - starts with '1')
	p2pkhAddr, err := btcutil.NewAddressPubKeyHash(pubkeyHash, &chaincfg.MainNetParams)
	if err != nil {
		panic(err)
	}

	// 5. Generate P2WPKH address (Native SegWit - starts with 'bc1q')
	p2wpkhAddr, err := btcutil.NewAddressWitnessPubKeyHash(pubkeyHash, &chaincfg.MainNetParams)
	if err != nil {
		panic(err)
	}

	fmt.Printf("Private Key: %x\n", privateKey.Serialize())
	fmt.Printf("Public Key: %s\n", hex.EncodeToString(publicKeyBytes))
	fmt.Printf("Pubkey Hash: %s\n", hex.EncodeToString(pubkeyHash))
	fmt.Printf("P2PKH Address: %s\n", p2pkhAddr.EncodeAddress())
	fmt.Printf("P2WPKH Address: %s\n", p2wpkhAddr.EncodeAddress())
}

func main() {
	generateAddresses()
}
```

```javascript
const crypto = require('crypto');
const secp256k1 = require('secp256k1');
const { bech32 } = require('bech32');

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function sha256(data) {
    return crypto.createHash('sha256').update(data).digest();
}

function hash160(data) {
    const sha = sha256(data);
    return crypto.createHash('ripemd160').update(sha).digest();
}

function base58Encode(buffer) {
    let num = BigInt('0x' + buffer.toString('hex'));
    let result = '';
    while (num > 0n) {
        result = BASE58_ALPHABET[Number(num % 58n)] + result;
        num = num / 58n;
    }
    for (const byte of buffer) {
        if (byte === 0) result = '1' + result;
        else break;
    }
    return result;
}

function base58CheckEncode(version, payload) {
    const data = Buffer.concat([Buffer.from([version]), payload]);
    const checksum = sha256(sha256(data)).slice(0, 4);
    return base58Encode(Buffer.concat([data, checksum]));
}

function generateAddresses() {
    // 1. Generate private key
    let privateKey;
    do {
        privateKey = crypto.randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privateKey));
    
    // 2. Get compressed public key
    const publicKey = Buffer.from(secp256k1.publicKeyCreate(privateKey, true));
    
    // 3. Hash160 the public key
    const pubkeyHash = hash160(publicKey);
    
    // 4. Generate P2PKH address (Legacy - starts with '1')
    const p2pkh = base58CheckEncode(0x00, pubkeyHash);
    
    // 5. Generate P2WPKH address (Native SegWit - starts with 'bc1q')
    const words = bech32.toWords(pubkeyHash);
    words.unshift(0); // witness version 0
    const p2wpkh = bech32.encode('bc', words);
    
    return {
        privateKey: privateKey.toString('hex'),
        publicKey: publicKey.toString('hex'),
        pubkeyHash: pubkeyHash.toString('hex'),
        p2pkhAddress: p2pkh,
        p2wpkhAddress: p2wpkh
    };
}

const result = generateAddresses();
console.log(`Private Key: ${result.privateKey}`);
console.log(`Public Key: ${result.publicKey}`);
console.log(`P2PKH Address: ${result.p2pkhAddress}`);
console.log(`P2WPKH Address: ${result.p2wpkhAddress}`);
```
:::

---

## Cryptographic Security Assumptions

### What Bitcoin Assumes

Bitcoin's security relies on these assumptions holding true:

| Assumption | If Broken |
|------------|-----------|
| SHA-256 is collision-resistant | Could create invalid blocks |
| SHA-256 is preimage-resistant | Could forge proof-of-work |
| ECDLP is hard | Private keys could be derived from public keys |
| Random number generation is secure | Private keys could be predicted |

### Quantum Computing Considerations

**Potential Threats:**
- **Shor's algorithm** could break ECDSA/Schnorr (public key → private key)
- **Grover's algorithm** could speed up SHA-256 attacks (but only quadratic speedup)

**Current Status:**
- No quantum computer capable of breaking Bitcoin exists today
- Estimates suggest decades before practical quantum threats
- Bitcoin community is researching post-quantum solutions
- Addresses that haven't revealed public keys are safer

**Mitigations:**
- Don't reuse addresses (limits public key exposure)
- Post-quantum signature schemes being researched
- Soft fork could add quantum-resistant signatures

---

## Summary

| Cryptographic Primitive | Purpose in Bitcoin |
|------------------------|-------------------|
| SHA-256 | Block hashing, TXIDs, PoW |
| SHA-256d (double) | Block headers, Merkle trees |
| RIPEMD-160 | Address generation (Hash160) |
| secp256k1 (ECC) | Key pairs, signatures |
| ECDSA | Legacy transaction signatures |
| Schnorr | Taproot signatures, aggregation |
| Merkle Trees | Transaction summarization, SPV proofs |
| Base58Check | Legacy address encoding |
| Bech32/Bech32m | SegWit/Taproot address encoding |

---

## Resources

- **[Tools](/tools)** - Interactive tools (Stack Lab for script, Block Visualizer for blocks, [Hash tool](/tools/hash) for SHA-256 / HASH256 / HASH160)
- **[Bitcoin Developer Guide - Transactions](https://developer.bitcoin.org/devguide/transactions.html)** - Official documentation on transaction signing
- **[Learn Me a Bitcoin](https://learnmeabitcoin.com)** - Visual explanations of Bitcoin cryptography
- **[BIP-340: Schnorr Signatures](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)** - Schnorr signature specification
- **[SEC 2: Recommended Elliptic Curve Domain Parameters](https://www.secg.org/sec2-v2.pdf)** - secp256k1 specification
- **[libsecp256k1](https://github.com/bitcoin-core/secp256k1)** - Bitcoin Core's optimized secp256k1 C library
