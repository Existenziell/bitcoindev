# HD Wallets

Hierarchical Deterministic (HD) wallets generate all keys from a single master seed, enabling organized key management and simple backups. This is the foundation of modern Bitcoin wallet architecture.

## Overview

HD wallets, defined in BIP32, allow a wallet to derive an unlimited number of key pairs from a single master seed. Combined with BIP39 (mnemonic phrases) and BIP44 (account structure), this creates a powerful and standardized wallet system.

**Key Benefits:**
- Single backup (seed phrase) for all keys
- Organized account and address structure
- Watch-only wallets using extended public keys
- Deterministic key generation across devices

```text
[Seed] --> [m/44'/0'/0'] --> [m/44'/0'/0'/0] --> [Addresses]
```

---

## BIP39: Mnemonic Seed Phrases

BIP39 defines how to generate human-readable seed phrases from random entropy.

### Mnemonic Generation Process

1. Generate random entropy (128-256 bits)
2. Calculate checksum (first bits of SHA256 hash)
3. Append checksum to entropy
4. Split into 11-bit groups
5. Map each group to a word from the 2048-word list

| Entropy (bits) | Checksum (bits) | Words |
|----------------|-----------------|-------|
| 128 | 4 | 12 |
| 160 | 5 | 15 |
| 192 | 6 | 18 |
| 224 | 7 | 21 |
| 256 | 8 | 24 |

### Generating a Mnemonic

:::code-group
```rust
// In Cargo.toml: hex = "0.4"
use hex;
use bip39::{Mnemonic, Language};

fn generate_mnemonic() -> Mnemonic {
    // Generate a 24-word mnemonic (256 bits entropy)
    Mnemonic::generate_in(Language::English, 24)
        .expect("Failed to generate mnemonic")
}

fn mnemonic_to_seed(mnemonic: &Mnemonic, passphrase: &str) -> [u8; 64] {
    // Convert mnemonic to 512-bit seed using PBKDF2
    mnemonic.to_seed(passphrase)
}

fn main() {
    let mnemonic = generate_mnemonic();
    println!("Mnemonic: {}", mnemonic.to_string());
    
    // Optional passphrase (BIP39 calls this "extension word")
    let seed = mnemonic_to_seed(&mnemonic, "");
    println!("Seed: {}", hex::encode(seed));
}
```

```python
from mnemonic import Mnemonic
import hashlib
import hmac

def generate_mnemonic(strength: int = 256) -> str:
    """Generate a BIP39 mnemonic phrase.
    
    Args:
        strength: Entropy bits (128=12 words, 256=24 words)
    
    Returns:
        Space-separated mnemonic words
    """
    mnemo = Mnemonic("english")
    return mnemo.generate(strength=strength)

def mnemonic_to_seed(mnemonic: str, passphrase: str = "") -> bytes:
    """Convert mnemonic to 512-bit seed using PBKDF2.
    
    Args:
        mnemonic: Space-separated mnemonic words
        passphrase: Optional passphrase (BIP39 extension word)
    
    Returns:
        64-byte seed
    """
    mnemo = Mnemonic("english")
    return mnemo.to_seed(mnemonic, passphrase)

# Generate 24-word mnemonic
mnemonic = generate_mnemonic(256)
print(f"Mnemonic: {mnemonic}")

# Convert to seed (no passphrase)
seed = mnemonic_to_seed(mnemonic)
print(f"Seed: {seed.hex()}")
```

```cpp
#include <bitcoin/bitcoin.hpp>
#include <iostream>
#include <string>

int main() {
    // Generate entropy (256 bits for 24 words)
    bc::data_chunk entropy(32);
    bc::pseudo_random_fill(entropy);
    
    // Create mnemonic from entropy
    bc::wallet::word_list mnemonic = bc::wallet::create_mnemonic(entropy);
    
    std::cout << "Mnemonic: ";
    for (const auto& word : mnemonic) {
        std::cout << word << " ";
    }
    std::cout << std::endl;
    
    // Convert to seed (empty passphrase)
    bc::long_hash seed = bc::wallet::decode_mnemonic(mnemonic);
    std::cout << "Seed: " << bc::encode_base16(seed) << std::endl;
    
    return 0;
}
```

```javascript
const bip39 = require('bip39');

function generateMnemonic(strength = 256) {
    // Generate mnemonic (128=12 words, 256=24 words)
    return bip39.generateMnemonic(strength);
}

async function mnemonicToSeed(mnemonic, passphrase = '') {
    // Convert mnemonic to 512-bit seed using PBKDF2
    return bip39.mnemonicToSeed(mnemonic, passphrase);
}

// Generate 24-word mnemonic
const mnemonic = generateMnemonic(256);
console.log('Mnemonic:', mnemonic);

// Convert to seed
mnemonicToSeed(mnemonic).then(seed => {
    console.log('Seed:', seed.toString('hex'));
});

// Note: When using bip32 for key derivation, use BIP32Factory:
// const { BIP32Factory } = require('bip32');
// const ecc = require('tiny-secp256k1');
// const bip32 = BIP32Factory(ecc);
```

```go
package main

import (
	"fmt"

	"github.com/tyler-smith/go-bip39"
)

func generateMnemonic(strength int) (string, error) {
	// Generate mnemonic (128=12 words, 256=24 words)
	entropy, err := bip39.NewEntropy(strength)
	if err != nil {
		return "", err
	}
	return bip39.NewMnemonic(entropy)
}

func mnemonicToSeed(mnemonic, passphrase string) ([]byte, error) {
	// Convert mnemonic to 512-bit seed using PBKDF2
	return bip39.NewSeedWithErrorChecking(mnemonic, passphrase)
}

func main() {
	// Generate 24-word mnemonic
	mnemonic, err := generateMnemonic(256)
	if err != nil {
		panic(err)
	}
	fmt.Printf("Mnemonic: %s\n", mnemonic)

	// Convert to seed (no passphrase)
	seed, err := mnemonicToSeed(mnemonic, "")
	if err != nil {
		panic(err)
	}
	fmt.Printf("Seed: %x\n", seed)
}
```
:::

---

## BIP32: Key Derivation

BIP32 defines how to derive child keys from parent keys using a hierarchical structure.

### Extended Keys

Extended keys contain additional metadata for derivation:

- **Extended Private Key (xprv)**: Can derive child private and public keys
- **Extended Public Key (xpub)**: Can only derive child public keys

```
xprv = [4 bytes version][1 byte depth][4 bytes fingerprint][4 bytes child index][32 bytes chain code][33 bytes key]
```

### Derivation Paths

Derivation paths use slash-separated indices:

```
m / purpose' / coin_type' / account' / change / address_index
```

**Examples:**
- `m/44'/0'/0'/0/0` - First receiving address (BIP44 legacy)
- `m/84'/0'/0'/0/0` - First receiving address (BIP84 native SegWit)
- `m/86'/0'/0'/0/0` - First receiving address (BIP86 Taproot)

The apostrophe (') indicates hardened derivation.

### Hardened vs Normal Derivation

| Type | Index Range | Security | Use Case |
|------|-------------|----------|----------|
| Normal | 0 to 2^31-1 | Child xpub can derive siblings | Receiving addresses |
| Hardened | 2^31 to 2^32-1 | Child xpub cannot derive siblings | Account separation |

**Security Note:** Always use hardened derivation for account-level keys. If a normal child private key is compromised along with the parent xpub, all sibling private keys can be derived.

### Deriving Keys from Seed

:::code-group
```rust
use bitcoin::bip32::{Xpriv, Xpub, DerivationPath};
use bitcoin::Network;
use std::str::FromStr;

fn derive_keys(seed: &[u8]) {
    // Create master key from seed
    let master = Xpriv::new_master(Network::Bitcoin, seed)
        .expect("Failed to create master key");
    
    println!("Master xprv: {}", master);
    
    // Derive BIP84 path: m/84'/0'/0'/0/0
    let secp = bitcoin::secp256k1::Secp256k1::new();
    let path = DerivationPath::from_str("m/84'/0'/0'/0/0").unwrap();
    let derived = master.derive_priv(&secp, &path).unwrap();
    
    println!("Derived private key: {}", derived);
    
    // Get public key
    let xpub = Xpub::from_priv(&secp, &derived);
    println!("Derived public key: {}", xpub);
}
```

```python
from bip32 import BIP32
from mnemonic import Mnemonic

def derive_keys(seed: bytes):
    """Derive keys using BIP32 hierarchical derivation."""
    # Create BIP32 instance from seed
    bip32 = BIP32.from_seed(seed)
    
    # Get master extended private key
    master_xprv = bip32.get_xpriv_from_path("m")
    print(f"Master xprv: {master_xprv}")
    
    # Derive BIP84 path: m/84'/0'/0'/0/0
    # 84' = purpose (native SegWit)
    # 0' = coin type (Bitcoin mainnet)
    # 0' = account
    # 0 = external chain (receiving)
    # 0 = first address
    path = "m/84'/0'/0'/0/0"
    
    derived_xprv = bip32.get_xpriv_from_path(path)
    derived_xpub = bip32.get_xpub_from_path(path)
    
    print(f"Derived xprv: {derived_xprv}")
    print(f"Derived xpub: {derived_xpub}")
    
    # Get raw private and public keys
    privkey = bip32.get_privkey_from_path(path)
    pubkey = bip32.get_pubkey_from_path(path)
    
    print(f"Private key: {privkey.hex()}")
    print(f"Public key: {pubkey.hex()}")

# Generate seed from mnemonic
mnemo = Mnemonic("english")
mnemonic = mnemo.generate(256)
seed = mnemo.to_seed(mnemonic)

derive_keys(seed)
```

```cpp
#include <bitcoin/bitcoin.hpp>
#include <iostream>

int main() {
    // Generate seed from mnemonic
    bc::data_chunk entropy(32);
    bc::pseudo_random_fill(entropy);
    bc::wallet::word_list mnemonic = bc::wallet::create_mnemonic(entropy);
    bc::long_hash seed = bc::wallet::decode_mnemonic(mnemonic);
    
    // Create HD private key from seed
    bc::wallet::hd_private master(seed, bc::wallet::hd_private::mainnet);
    std::cout << "Master xprv: " << master.encoded() << std::endl;
    
    // Derive BIP84 path: m/84'/0'/0'/0/0
    // Using hardened derivation for first 3 levels
    auto purpose = master.derive_private(84 + bc::wallet::hd_first_hardened_key);
    auto coin = purpose.derive_private(0 + bc::wallet::hd_first_hardened_key);
    auto account = coin.derive_private(0 + bc::wallet::hd_first_hardened_key);
    auto change = account.derive_private(0);  // Normal derivation
    auto address = change.derive_private(0);  // Normal derivation
    
    std::cout << "Derived xprv: " << address.encoded() << std::endl;
    
    // Get public key
    bc::wallet::hd_public xpub = address.to_public();
    std::cout << "Derived xpub: " << xpub.encoded() << std::endl;
    
    return 0;
}
```

```javascript
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const bip39 = require('bip39');

// Initialize bip32 with the elliptic curve library
const bip32 = BIP32Factory(ecc);

async function deriveKeys(mnemonic) {
    // Convert mnemonic to seed
    const seed = await bip39.mnemonicToSeed(mnemonic);
    
    // Create master key from seed
    const master = bip32.fromSeed(seed);
    console.log('Master xprv:', master.toBase58());
    
    // Derive BIP84 path: m/84'/0'/0'/0/0
    // 84' = purpose (native SegWit)
    // 0' = coin type (Bitcoin mainnet)
    // 0' = account
    // 0 = external chain (receiving)
    // 0 = first address
    const path = "m/84'/0'/0'/0/0";
    const derived = master.derivePath(path);
    
    console.log('Derived xprv:', derived.toBase58());
    console.log('Derived xpub:', derived.neutered().toBase58());
    console.log('Private key:', derived.privateKey.toString('hex'));
    console.log('Public key:', derived.publicKey.toString('hex'));
}

const mnemonic = bip39.generateMnemonic(256);
console.log('Mnemonic:', mnemonic);
deriveKeys(mnemonic);
```

```go
package main

import (
	"fmt"

	"github.com/tyler-smith/go-bip32"
	"github.com/tyler-smith/go-bip39"
)

func deriveKeys(mnemonic string) error {
	// Convert mnemonic to seed
	seed, err := bip39.NewSeedWithErrorChecking(mnemonic, "")
	if err != nil {
		return err
	}

	// Create master key from seed
	master, err := bip32.NewMasterKey(seed)
	if err != nil {
		return err
	}
	fmt.Printf("Master xprv: %s\n", master.B58Serialize())

	// Derive BIP84 path: m/84'/0'/0'/0/0
	// 84' = purpose (native SegWit)
	// 0' = coin type (Bitcoin mainnet)
	// 0' = account
	// 0 = external chain (receiving)
	// 0 = first address
	purpose, err := master.NewChildKey(bip32.FirstHardenedChild + 84)
	if err != nil {
		return err
	}

	coin, err := purpose.NewChildKey(bip32.FirstHardenedChild + 0)
	if err != nil {
		return err
	}

	account, err := coin.NewChildKey(bip32.FirstHardenedChild + 0)
	if err != nil {
		return err
	}

	change, err := account.NewChildKey(0)
	if err != nil {
		return err
	}

	address, err := change.NewChildKey(0)
	if err != nil {
		return err
	}

	fmt.Printf("Derived xprv: %s\n", address.B58Serialize())
	fmt.Printf("Derived xpub: %s\n", address.PublicKey().B58Serialize())
	fmt.Printf("Private key: %x\n", address.Key)
	fmt.Printf("Public key: %x\n", address.PublicKey().Key)

	return nil
}

func main() {
	mnemonic, _ := bip39.NewMnemonic(bip39.NewEntropy(256))
	fmt.Printf("Mnemonic: %s\n", mnemonic)
	deriveKeys(mnemonic)
}
```
:::

---

## BIP44: Multi-Account Hierarchy

BIP44 defines a standard account structure for HD wallets.

### Path Structure

```
m / purpose' / coin_type' / account' / change / address_index
```

| Level | Hardened | Description |
|-------|----------|-------------|
| purpose | Yes | BIP number (44, 49, 84, 86) |
| coin_type | Yes | Coin identifier (0 = Bitcoin) |
| account | Yes | Account index (0, 1, 2...) |
| change | No | 0 = external (receiving), 1 = internal (change) |
| address_index | No | Address index within chain |

### Purpose Values by Address Type

| BIP | Purpose | Address Type | Prefix |
|-----|---------|--------------|--------|
| BIP44 | 44' | P2PKH (Legacy) | 1... |
| BIP49 | 49' | P2SH-P2WPKH (Nested SegWit) | 3... |
| BIP84 | 84' | P2WPKH (Native SegWit) | bc1q... |
| BIP86 | 86' | P2TR (Taproot) | bc1p... |

---

## Watch-Only Wallets

Extended public keys (xpubs) enable watch-only wallets that can:
- Generate receiving addresses
- Monitor incoming transactions
- Calculate balances

**Without** being able to spend funds (no private keys).

### Creating a Watch-Only Wallet

:::code-group
```rust
use bitcoin::bip32::{Xpub, DerivationPath};
use bitcoin::Address;
use std::str::FromStr;

fn generate_addresses_from_xpub(xpub: &str, count: u32) {
    let secp = bitcoin::secp256k1::Secp256k1::new();
    let xpub = Xpub::from_str(xpub).expect("Invalid xpub");
    
    // Generate receiving addresses (change = 0)
    for i in 0..count {
        let path = DerivationPath::from_str(&format!("m/0/{}", i)).unwrap();
        let derived = xpub.derive_pub(&secp, &path).unwrap();
        let address = Address::p2wpkh(&derived.public_key, bitcoin::Network::Bitcoin);
        println!("Address {}: {}", i, address);
    }
}
```

```python
from bip32 import BIP32
import bech32

def generate_addresses_from_xpub(xpub: str, count: int = 5):
    """Generate receiving addresses from an extended public key."""
    bip32 = BIP32.from_xpub(xpub)
    
    for i in range(count):
        # Derive child public key (0 = receiving chain)
        pubkey = bip32.get_pubkey_from_path(f"m/0/{i}")
        
        # Generate P2WPKH address
        import hashlib
        sha256_hash = hashlib.sha256(pubkey).digest()
        ripemd160_hash = hashlib.new('ripemd160', sha256_hash).digest()
        
        # Bech32 encode
        converted = bech32.convertbits(list(ripemd160_hash), 8, 5)
        address = bech32.bech32_encode("bc", [0] + converted)
        
        print(f"Address {i}: {address}")

# Example xpub (DO NOT USE - for demonstration only)
xpub = "xpub..."
generate_addresses_from_xpub(xpub, 5)
```

```cpp
#include <bitcoin/bitcoin.hpp>
#include <iostream>

void generate_addresses_from_xpub(const std::string& xpub_str, uint32_t count) {
    bc::wallet::hd_public xpub(xpub_str);
    
    for (uint32_t i = 0; i < count; ++i) {
        // Derive: xpub/0/i (receiving chain)
        auto chain = xpub.derive_public(0);
        auto derived = chain.derive_public(i);
        
        // Generate P2WPKH address
        bc::wallet::payment_address address(
            derived.point(),
            bc::wallet::payment_address::mainnet_p2kh
        );
        
        std::cout << "Address " << i << ": " << address.encoded() << std::endl;
    }
}
```

```javascript
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const bitcoin = require('bitcoinjs-lib');

// Initialize bip32 with the elliptic curve library
const bip32 = BIP32Factory(ecc);

function generateAddressesFromXpub(xpubString, count = 5) {
    const xpub = bip32.fromBase58(xpubString);
    
    for (let i = 0; i < count; i++) {
        // Derive: xpub/0/i (receiving chain)
        const derived = xpub.derive(0).derive(i);
        
        // Generate P2WPKH address
        const { address } = bitcoin.payments.p2wpkh({
            pubkey: derived.publicKey,
            network: bitcoin.networks.bitcoin
        });
        
        console.log(`Address ${i}: ${address}`);
    }
}

// Example usage with account xpub
const xpub = 'xpub...';
generateAddressesFromXpub(xpub, 5);
```

```go
package main

import (
	"fmt"

	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/tyler-smith/go-bip32"
)

func generateAddressesFromXpub(xpubString string, count int) error {
	// Parse extended public key
	xpub, err := bip32.B58Deserialize(xpubString)
	if err != nil {
		return err
	}

	for i := 0; i < count; i++ {
		// Derive: xpub/0/i (receiving chain)
		change, err := xpub.NewChildKey(0)
		if err != nil {
			return err
		}

		addressKey, err := change.NewChildKey(uint32(i))
		if err != nil {
			return err
		}

		// Generate P2WPKH address
		pubkeyHash := btcutil.Hash160(addressKey.Key)
		addr, err := btcutil.NewAddressWitnessPubKeyHash(pubkeyHash, &chaincfg.MainNetParams)
		if err != nil {
			return err
		}

		fmt.Printf("Address %d: %s\n", i, addr.EncodeAddress())
	}

	return nil
}

func main() {
	// Example usage with account xpub
	xpub := "xpub..." // Extended public key
	generateAddressesFromXpub(xpub, 5)
}
```
:::

---

## Security Best Practices

### Seed Phrase Storage

- **Physical backup**: Write on paper or metal, store securely
- **Never digital**: Don't store on computers, phones, or cloud
- **Multiple copies**: Keep backups in separate locations
- **Test recovery**: Verify you can restore from backup

### Passphrase (25th Word)

BIP39 supports an optional passphrase that:
- Creates a completely different wallet
- Provides plausible deniability
- Adds another layer of security

**Warning:** A forgotten passphrase means permanent loss of funds.

### Extended Public Key Exposure

Exposing an xpub reveals:
- All past and future addresses
- Complete transaction history
- Total balance

**Never share xpubs publicly** unless intentional (e.g., donation addresses).

---

## Gap Limit

The gap limit determines how many unused addresses to scan before stopping. Default is typically 20.

**Important for wallet recovery:** If you used addresses beyond the gap limit without using intermediate addresses, those funds may not appear in a recovered wallet.

---

## Summary

HD wallets provide:

- **Single backup**: One seed phrase backs up all keys
- **Organized structure**: Hierarchical account and address management
- **Watch-only capability**: Monitor without spending ability
- **Standardization**: BIP32/39/44 ensure wallet interoperability
- **Security**: Hardened derivation protects account-level keys

Understanding HD wallets is essential for building modern Bitcoin wallet applications.

---

## Related Topics

- [Bitcoin Wallets](/docs/wallets) - Introduction to Bitcoin wallets
- [Address Types](/docs/wallets/address-types) - Understanding different Bitcoin address formats
- [Key Management](/docs/bitcoin-development/keys) - Secure key generation and storage
- [Cryptography](/docs/bitcoin/cryptography) - Elliptic curve cryptography fundamentals
