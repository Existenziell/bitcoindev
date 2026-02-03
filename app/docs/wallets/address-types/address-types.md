# Address Types

Bitcoin has evolved through several address formats, each offering different features, security properties, and transaction costs. Understanding these types is essential for wallet development. Decode and inspect any address in the [Address Decoder](/interactive-tools/address-decoder) tool.

## Overview

| Type | Prefix | Example Start | Introduced |
|------|--------|---------------|------------|
| P2PKH | `1` | `1BvBMSEYstW...` | 2009 (Genesis) |
| P2SH | `3` | `3J98t1WpEZ7...` | 2012 (BIP16) |
| P2WPKH | `bc1q` | `bc1qw508d6q...` | 2017 (BIP141) |
| P2WSH | `bc1q` | `bc1qrp33g0q...` | 2017 (BIP141) |
| P2TR | `bc1p` | `bc1p5cyxnux...` | 2021 (BIP341) |

---

## P2PKH (Pay-to-Public-Key-Hash)

The original Bitcoin address format, also known as "legacy" addresses.

### Structure

```
scriptPubKey: OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
scriptSig: <signature> <publicKey>
```

### Address Generation

:::code-group
```rust
use bitcoin::{
    secp256k1::{Secp256k1, rand::rngs::OsRng},
    Address, Network, PublicKey, PrivateKey,
};

fn generate_p2pkh_address() -> (PrivateKey, Address) {
    let secp = Secp256k1::new();
    let (secret_key, public_key) = secp.generate_keypair(&mut OsRng);
    
    let private_key = PrivateKey::new(secret_key, Network::Bitcoin);
    let public_key = PublicKey::new(public_key);
    
    // Create P2PKH address (starts with '1')
    let address = Address::p2pkh(&public_key, Network::Bitcoin);
    
    (private_key, address)
}

fn main() {
    let (privkey, address) = generate_p2pkh_address();
    println!("Private Key (WIF): {}", privkey);
    println!("P2PKH Address: {}", address);
    // Output: 1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2
}
```

```python
import secrets
import hashlib
import base58

def generate_p2pkh_address():
    """Generate a P2PKH (legacy) Bitcoin address."""
    from ecdsa import SECP256k1, SigningKey
    
    # Generate private key
    private_key = secrets.token_bytes(32)
    
    # Derive public key
    signing_key = SigningKey.from_string(private_key, curve=SECP256k1)
    verifying_key = signing_key.get_verifying_key()
    
    # Compressed public key (33 bytes)
    x = verifying_key.point.x()
    y = verifying_key.point.y()
    prefix = b'\x02' if y % 2 == 0 else b'\x03'
    public_key = prefix + x.to_bytes(32, 'big')
    
    # Hash160 = RIPEMD160(SHA256(pubkey))
    sha256_hash = hashlib.sha256(public_key).digest()
    ripemd160_hash = hashlib.new('ripemd160', sha256_hash).digest()
    
    # Add version byte (0x00 for mainnet)
    versioned = b'\x00' + ripemd160_hash
    
    # Double SHA256 checksum
    checksum = hashlib.sha256(hashlib.sha256(versioned).digest()).digest()[:4]
    
    # Base58Check encode
    address = base58.b58encode(versioned + checksum).decode()
    
    return private_key.hex(), address

privkey, address = generate_p2pkh_address()
print(f"Private Key: {privkey}")
print(f"P2PKH Address: {address}")  # Starts with '1'
```

```cpp
#include <bitcoin/bitcoin.hpp>
#include <iostream>

int main() {
    // Generate random private key
    bc::data_chunk seed(32);
    bc::pseudo_random_fill(seed);
    
    bc::ec_secret secret;
    std::copy(seed.begin(), seed.end(), secret.begin());
    
    // Derive compressed public key
    bc::ec_compressed public_key;
    bc::secret_to_public(public_key, secret);
    
    // Create P2PKH address
    bc::wallet::payment_address address(public_key, 
        bc::wallet::payment_address::mainnet_p2kh);
    
    // Get WIF private key
    bc::wallet::ec_private wif(secret, bc::wallet::ec_private::mainnet);
    
    std::cout << "Private Key (WIF): " << wif.encoded() << std::endl;
    std::cout << "P2PKH Address: " << address.encoded() << std::endl;
    
    return 0;
}
```

```go
package main

import (
	"fmt"

	"github.com/btcsuite/btcd/btcec/v2"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
)

func generateP2PKHAddress() (string, string) {
	// Generate key pair
	privateKey, err := btcec.NewPrivateKey()
	if err != nil {
		panic(err)
	}

	// Get WIF private key
	wif, err := btcutil.NewWIF(privateKey, &chaincfg.MainNetParams, true)
	if err != nil {
		panic(err)
	}

	// Create P2PKH address
	pubkeyHash := btcutil.Hash160(privateKey.PubKey().SerializeCompressed())
	addr, err := btcutil.NewAddressPubKeyHash(pubkeyHash, &chaincfg.MainNetParams)
	if err != nil {
		panic(err)
	}

	return wif.String(), addr.EncodeAddress()
}

func main() {
	privateKey, address := generateP2PKHAddress()
	fmt.Printf("Private Key (WIF): %s\n", privateKey)
	fmt.Printf("P2PKH Address: %s\n", address) // Starts with '1'
}
```

```javascript
const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const ecc = require('tiny-secp256k1');

const ECPair = ECPairFactory(ecc);

function generateP2PKHAddress() {
    // Generate key pair
    const keyPair = ECPair.makeRandom();
    
    // Create P2PKH address
    const { address } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network: bitcoin.networks.bitcoin
    });
    
    return {
        privateKey: keyPair.toWIF(),
        address: address  // Starts with '1'
    };
}

const { privateKey, address } = generateP2PKHAddress();
console.log('Private Key (WIF):', privateKey);
console.log('P2PKH Address:', address);
```
:::

### Characteristics

- **Size**: 34 characters
- **Input size**: ~148 vB
- **Output size**: 34 vB
- **Script type**: Standard pay-to-pubkey-hash

---

## P2SH (Pay-to-Script-Hash)

Introduced in BIP16, P2SH allows complex scripts to be represented by a simple hash.

### Structure

```
scriptPubKey: OP_HASH160 <scriptHash> OP_EQUAL
scriptSig: <data> <redeemScript>
```

### Common Uses

- Multisig addresses (before SegWit)
- Nested SegWit (P2SH-P2WPKH)
- Time-locked scripts

### Address Generation (P2SH-P2WPKH)

:::code-group
```rust
use bitcoin::{
    secp256k1::{Secp256k1, rand::rngs::OsRng},
    Address, Network, PublicKey,
};

fn generate_p2sh_p2wpkh_address() -> Address {
    let secp = Secp256k1::new();
    let (_, public_key) = secp.generate_keypair(&mut OsRng);
    let public_key = PublicKey::new(public_key);
    
    // Create P2SH-P2WPKH (nested SegWit, starts with '3')
    Address::p2shwpkh(&public_key, Network::Bitcoin)
        .expect("Failed to create address")
}

fn main() {
    let address = generate_p2sh_p2wpkh_address();
    println!("P2SH-P2WPKH Address: {}", address);
    // Output: 3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy
}
```

```python
import hashlib
import base58

def generate_p2sh_p2wpkh_address(public_key: bytes) -> str:
    """Generate a P2SH-P2WPKH (nested SegWit) address."""
    # Create witness program (P2WPKH)
    sha256_hash = hashlib.sha256(public_key).digest()
    pubkey_hash = hashlib.new('ripemd160', sha256_hash).digest()
    
    # Witness script: OP_0 <20-byte-pubkey-hash>
    witness_script = b'\x00\x14' + pubkey_hash
    
    # Hash the witness script for P2SH
    script_hash = hashlib.new('ripemd160', 
        hashlib.sha256(witness_script).digest()).digest()
    
    # Add version byte (0x05 for P2SH mainnet)
    versioned = b'\x05' + script_hash
    
    # Checksum and encode
    checksum = hashlib.sha256(hashlib.sha256(versioned).digest()).digest()[:4]
    address = base58.b58encode(versioned + checksum).decode()
    
    return address  # Starts with '3'
```

```cpp
#include <bitcoin/bitcoin.hpp>
#include <iostream>

int main() {
    // Generate key pair
    bc::data_chunk seed(32);
    bc::pseudo_random_fill(seed);
    
    bc::ec_secret secret;
    std::copy(seed.begin(), seed.end(), secret.begin());
    
    bc::ec_compressed public_key;
    bc::secret_to_public(public_key, secret);
    
    // Create P2SH-P2WPKH address
    // First create the witness program
    bc::short_hash pubkey_hash = bc::bitcoin_short_hash(public_key);
    
    // Witness script: OP_0 <pubkey_hash>
    bc::data_chunk witness_script;
    witness_script.push_back(0x00);  // OP_0
    witness_script.push_back(0x14);  // Push 20 bytes
    witness_script.insert(witness_script.end(), 
        pubkey_hash.begin(), pubkey_hash.end());
    
    // Hash for P2SH
    bc::short_hash script_hash = bc::bitcoin_short_hash(witness_script);
    
    bc::wallet::payment_address address(script_hash, 
        bc::wallet::payment_address::mainnet_p2sh);
    
    std::cout << "P2SH-P2WPKH Address: " << address.encoded() << std::endl;
    
    return 0;
}
```

```go
package main

import (
	"fmt"

	"github.com/btcsuite/btcd/btcec/v2"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcd/txscript"
)

func generateP2SHP2WPKHAddress() (string, string) {
	// Generate key pair
	privateKey, err := btcec.NewPrivateKey()
	if err != nil {
		panic(err)
	}

	// Get WIF private key
	wif, err := btcutil.NewWIF(privateKey, &chaincfg.MainNetParams, true)
	if err != nil {
		panic(err)
	}

	// Create P2WPKH witness program
	pubkeyHash := btcutil.Hash160(privateKey.PubKey().SerializeCompressed())
	witnessProgram := append([]byte{0x00, 0x14}, pubkeyHash...)

	// Create P2SH address from witness program
	scriptHash := btcutil.Hash160(witnessProgram)
	addr, err := btcutil.NewAddressScriptHashFromHash(scriptHash, &chaincfg.MainNetParams)
	if err != nil {
		panic(err)
	}

	return wif.String(), addr.EncodeAddress()
}

func main() {
	privateKey, address := generateP2SHP2WPKHAddress()
	fmt.Printf("Private Key (WIF): %s\n", privateKey)
	fmt.Printf("P2SH-P2WPKH Address: %s\n", address) // Starts with '3'
}
```

```javascript
const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const ecc = require('tiny-secp256k1');

const ECPair = ECPairFactory(ecc);

function generateP2SHP2WPKHAddress() {
    const keyPair = ECPair.makeRandom();
    
    // Create P2SH-P2WPKH (nested SegWit)
    const p2wpkh = bitcoin.payments.p2wpkh({
        pubkey: keyPair.publicKey,
        network: bitcoin.networks.bitcoin
    });
    
    const p2sh = bitcoin.payments.p2sh({
        redeem: p2wpkh,
        network: bitcoin.networks.bitcoin
    });
    
    return {
        privateKey: keyPair.toWIF(),
        address: p2sh.address  // Starts with '3'
    };
}

const { privateKey, address } = generateP2SHP2WPKHAddress();
console.log('P2SH-P2WPKH Address:', address);
```
:::

### Characteristics

- **Size**: 34 characters
- **Input size**: ~91 vB (for P2SH-P2WPKH)
- **Output size**: 32 vB
- **Script type**: Pay-to-script-hash

---

## P2WPKH (Native SegWit)

Introduced with SegWit in BIP141, P2WPKH provides significant fee savings.

### Structure

```
scriptPubKey: OP_0 <20-byte-pubkey-hash>
witness: <signature> <publicKey>
```

### Address Generation

:::code-group
```rust
use bitcoin::{
    secp256k1::{Secp256k1, rand::rngs::OsRng},
    Address, Network, PublicKey,
};

fn generate_p2wpkh_address() -> Address {
    let secp = Secp256k1::new();
    let (_, public_key) = secp.generate_keypair(&mut OsRng);
    let public_key = PublicKey::new(public_key);
    
    // Create P2WPKH (native SegWit, starts with 'bc1q')
    Address::p2wpkh(&public_key, Network::Bitcoin)
        .expect("Failed to create address")
}

fn main() {
    let address = generate_p2wpkh_address();
    println!("P2WPKH Address: {}", address);
    // Output: bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4
}
```

```python
import hashlib
import bech32

def generate_p2wpkh_address(public_key: bytes, mainnet: bool = True) -> str:
    """Generate a P2WPKH (native SegWit) address."""
    # Hash160 of public key
    sha256_hash = hashlib.sha256(public_key).digest()
    pubkey_hash = hashlib.new('ripemd160', sha256_hash).digest()
    
    # Bech32 encode with witness version 0
    hrp = "bc" if mainnet else "tb"
    
    # Convert to 5-bit groups
    converted = bech32.convertbits(list(pubkey_hash), 8, 5)
    
    # Witness version 0 + converted data
    address = bech32.bech32_encode(hrp, [0] + converted)
    
    return address  # Starts with 'bc1q'

# Example with generated public key
from ecdsa import SECP256k1, SigningKey
import secrets

private_key = secrets.token_bytes(32)
signing_key = SigningKey.from_string(private_key, curve=SECP256k1)
vk = signing_key.get_verifying_key()

# Compressed public key
x = vk.point.x()
y = vk.point.y()
prefix = b'\x02' if y % 2 == 0 else b'\x03'
public_key = prefix + x.to_bytes(32, 'big')

address = generate_p2wpkh_address(public_key)
print(f"P2WPKH Address: {address}")
```

```cpp
#include <bitcoin/bitcoin.hpp>
#include <iostream>

int main() {
    // Generate key pair
    bc::data_chunk seed(32);
    bc::pseudo_random_fill(seed);
    
    bc::ec_secret secret;
    std::copy(seed.begin(), seed.end(), secret.begin());
    
    bc::ec_compressed public_key;
    bc::secret_to_public(public_key, secret);
    
    // Hash160 of public key
    bc::short_hash pubkey_hash = bc::bitcoin_short_hash(public_key);
    
    // Create witness program
    bc::data_chunk witness_program;
    witness_program.push_back(0x00);  // Witness version 0
    witness_program.push_back(0x14);  // Push 20 bytes
    witness_program.insert(witness_program.end(), 
        pubkey_hash.begin(), pubkey_hash.end());
    
    // Bech32 encode
    std::string address = bc::wallet::encode_witness_address(
        "bc", witness_program);
    
    std::cout << "P2WPKH Address: " << address << std::endl;
    
    return 0;
}
```

```go
package main

import (
	"fmt"

	"github.com/btcsuite/btcd/btcec/v2"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
)

func generateP2WPKHAddress() (string, string) {
	// Generate key pair
	privateKey, err := btcec.NewPrivateKey()
	if err != nil {
		panic(err)
	}

	// Get WIF private key
	wif, err := btcutil.NewWIF(privateKey, &chaincfg.MainNetParams, true)
	if err != nil {
		panic(err)
	}

	// Create P2WPKH (native SegWit) address
	pubkeyHash := btcutil.Hash160(privateKey.PubKey().SerializeCompressed())
	addr, err := btcutil.NewAddressWitnessPubKeyHash(pubkeyHash, &chaincfg.MainNetParams)
	if err != nil {
		panic(err)
	}

	return wif.String(), addr.EncodeAddress()
}

func main() {
	privateKey, address := generateP2WPKHAddress()
	fmt.Printf("Private Key (WIF): %s\n", privateKey)
	fmt.Printf("P2WPKH Address: %s\n", address) // Starts with 'bc1q'
}
```

```javascript
const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const ecc = require('tiny-secp256k1');

const ECPair = ECPairFactory(ecc);

function generateP2WPKHAddress() {
    const keyPair = ECPair.makeRandom();
    
    // Create P2WPKH (native SegWit)
    const { address } = bitcoin.payments.p2wpkh({
        pubkey: keyPair.publicKey,
        network: bitcoin.networks.bitcoin
    });
    
    return {
        privateKey: keyPair.toWIF(),
        address: address  // Starts with 'bc1q'
    };
}

const { privateKey, address } = generateP2WPKHAddress();
console.log('P2WPKH Address:', address);
```
:::

### Characteristics

- **Size**: 42 characters (bc1q + 39 chars)
- **Input size**: ~68 vB
- **Output size**: 31 vB
- **Encoding**: Bech32

---

## P2WSH (Pay-to-Witness-Script-Hash)

P2WSH is the SegWit version of P2SH, used for complex scripts like multisig.

### Structure

```
scriptPubKey: OP_0 <32-byte-script-hash>
witness: <data...> <witnessScript>
```

### Characteristics

- **Size**: 62 characters (bc1q + 59 chars)
- **Input size**: Variable (depends on witness script)
- **Output size**: 43 vB
- **Encoding**: Bech32

---

## P2TR (Pay-to-Taproot)

Introduced in BIP341, Taproot provides the best combination of privacy, efficiency, and flexibility.

### Structure

Key path spend:
```
scriptPubKey: OP_1 <32-byte-tweaked-pubkey>
witness: <signature>
```

Script path spend:
```
witness: <script input> <script> <control block>
```

### Address Generation

:::code-group
```rust
use bitcoin::{
    secp256k1::{Secp256k1, rand::rngs::OsRng, XOnlyPublicKey},
    Address, Network,
};

fn generate_p2tr_address() -> Address {
    let secp = Secp256k1::new();
    let (secret_key, public_key) = secp.generate_keypair(&mut OsRng);
    
    // Convert to x-only public key for Taproot
    let (xonly, _parity) = public_key.x_only_public_key();
    
    // Create P2TR address (starts with 'bc1p')
    Address::p2tr(&secp, xonly, None, Network::Bitcoin)
}

fn main() {
    let address = generate_p2tr_address();
    println!("P2TR Address: {}", address);
    // Output: bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr
}
```

```python
import hashlib
import bech32

def generate_p2tr_address(internal_pubkey: bytes, mainnet: bool = True) -> str:
    """Generate a P2TR (Taproot) address from x-only public key.
    
    Args:
        internal_pubkey: 32-byte x-only public key
        mainnet: True for mainnet, False for testnet
    
    Returns:
        Bech32m encoded Taproot address
    """
    # For key-path only spend, tweak with empty merkle root
    # tweaked_pubkey = internal_pubkey + H_TapTweak(internal_pubkey)
    
    # Simplified: using internal pubkey directly for demonstration
    # In production, apply proper BIP341 tweaking
    
    hrp = "bc" if mainnet else "tb"
    
    # Convert to 5-bit groups for bech32m
    converted = bech32.convertbits(list(internal_pubkey), 8, 5)
    
    # Witness version 1 + converted data (bech32m encoding)
    address = bech32.bech32m_encode(hrp, [1] + converted)
    
    return address  # Starts with 'bc1p'
```

```cpp
#include <bitcoin/bitcoin.hpp>
#include <iostream>

int main() {
    // Generate key pair
    bc::data_chunk seed(32);
    bc::pseudo_random_fill(seed);
    
    bc::ec_secret secret;
    std::copy(seed.begin(), seed.end(), secret.begin());
    
    bc::ec_compressed public_key;
    bc::secret_to_public(public_key, secret);
    
    // Extract x-only public key (32 bytes, drop the prefix)
    bc::data_chunk xonly_pubkey(public_key.begin() + 1, public_key.end());
    
    // Create witness program for Taproot
    bc::data_chunk witness_program;
    witness_program.push_back(0x01);  // Witness version 1
    witness_program.push_back(0x20);  // Push 32 bytes
    witness_program.insert(witness_program.end(), 
        xonly_pubkey.begin(), xonly_pubkey.end());
    
    // Bech32m encode (note: requires bech32m support)
    std::string address = bc::wallet::encode_witness_address(
        "bc", witness_program);
    
    std::cout << "P2TR Address: " << address << std::endl;
    
    return 0;
}
```

```go
package main

import (
	"fmt"

	"github.com/btcsuite/btcd/btcec/v2"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
)

func generateP2TRAddress() (string, string) {
	// Generate key pair
	privateKey, err := btcec.NewPrivateKey()
	if err != nil {
		panic(err)
	}

	// Get WIF private key
	wif, err := btcutil.NewWIF(privateKey, &chaincfg.MainNetParams, true)
	if err != nil {
		panic(err)
	}

	// Get x-only public key (32 bytes, drop the prefix)
	pubkey := privateKey.PubKey()
	xOnlyPubkey := pubkey.SerializeCompressed()[1:33]

	// Create P2TR address (key path only, simplified)
	// In production, apply proper BIP341 tweaking
	addr, err := btcutil.NewAddressTaproot(xOnlyPubkey, &chaincfg.MainNetParams)
	if err != nil {
		panic(err)
	}

	return wif.String(), addr.EncodeAddress()
}

func main() {
	privateKey, address := generateP2TRAddress()
	fmt.Printf("Private Key (WIF): %s\n", privateKey)
	fmt.Printf("P2TR Address: %s\n", address) // Starts with 'bc1p'
}
```

```javascript
const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const ecc = require('tiny-secp256k1');

const ECPair = ECPairFactory(ecc);

// Initialize ECC library for Taproot
bitcoin.initEccLib(ecc);

function generateP2TRAddress() {
    const keyPair = ECPair.makeRandom();
    
    // Get x-only public key (32 bytes)
    const xOnlyPubkey = keyPair.publicKey.slice(1, 33);
    
    // Create P2TR address (key path only)
    const { address } = bitcoin.payments.p2tr({
        internalPubkey: xOnlyPubkey,
        network: bitcoin.networks.bitcoin
    });
    
    return {
        privateKey: keyPair.toWIF(),
        address: address  // Starts with 'bc1p'
    };
}

const { privateKey, address } = generateP2TRAddress();
console.log('P2TR Address:', address);
```
:::

### Characteristics

- **Size**: 62 characters (bc1p + 59 chars)
- **Input size**: ~58 vB (key path)
- **Output size**: 43 vB
- **Encoding**: Bech32m

---

## Comparison

### Transaction Size and Fees

| Type | Input (vB) | Output (vB) | Relative Cost |
|------|------------|-------------|---------------|
| P2PKH | 148 | 34 | 100% (baseline) |
| P2SH-P2WPKH | 91 | 32 | 62% |
| P2WPKH | 68 | 31 | 46% |
| P2TR | 58 | 43 | 39% |

### Feature Comparison

| Feature | P2PKH | P2SH | P2WPKH | P2TR |
|---------|-------|------|--------|------|
| Multisig | No | Yes | Via P2WSH | Yes (MuSig) |
| Fee efficiency | Low | Medium | High | Highest |
| Privacy | Low | Medium | Medium | High |
| Script flexibility | No | Yes | Limited | High |
| Encoding | Base58 | Base58 | Bech32 | Bech32m |

---

## Best Practices

### For New Wallets

1. **Default to P2WPKH** for single-sig (best balance of compatibility and fees)
2. **Use P2TR** when Taproot support is widespread
3. **Avoid P2PKH** for new addresses (higher fees)

### For Compatibility

- Support receiving on all address types
- Prefer SegWit (bc1q) for sending when possible
- Some older services only support legacy addresses

### Address Validation

Always validate addresses before sending:
- Check length and prefix
- Verify checksum (Base58Check or Bech32)
- Confirm network (mainnet vs testnet)

---

## Summary

Bitcoin address types have evolved to provide:

- **P2PKH**: Original format, highest fees
- **P2SH**: Script flexibility, moderate fees
- **P2WPKH**: Native SegWit, lower fees
- **P2TR**: Taproot, lowest fees and best privacy

Choose the appropriate type based on your use case, required features, and compatibility needs.

---

## Related Topics

- [Bitcoin Wallets](/docs/wallets) - Introduction to Bitcoin wallets
- [HD Wallets](/docs/wallets/hd-wallets) - Hierarchical deterministic key derivation
- [Coin Selection](/docs/bitcoin-development/coin-selection) - How address types affect transaction fees
- [Address Generation](/docs/bitcoin-development/addresses) - Developer guide to address generation
