# Bitcoin Wallets

## Overview

A Bitcoin wallet is a software application or device that allows users to store, send, and receive Bitcoin. Despite the name, a wallet doesn't actually "store" Bitcoin. Bitcoin exists only on the blockchain. Instead, a wallet stores the **private keys** needed to access and control Bitcoin addresses.

### Key Concepts

- **Private Key**: Secret cryptographic key that proves ownership of Bitcoin
- **Public Key**: Derived from private key, used to generate addresses
- **Address**: Public identifier where Bitcoin can be received (like an account number)
- **UTXO**: Unspent Transaction Output, the actual "coins" on the blockchain
- **Seed Phrase**: Human-readable backup of private keys (12-24 words)

---

## Types of Wallets

### By Storage Location

#### Hot Wallets
- **Online**: Connected to the internet
- **Examples**: Mobile apps, web wallets, exchange wallets
- **Pros**: Easy to use, quick access
- **Cons**: More vulnerable to hacking

#### Cold Wallets
- **Offline**: Not connected to the internet
- **Examples**: Hardware wallets, paper wallets
- **Pros**: More secure, less vulnerable to attacks
- **Cons**: Less convenient for frequent transactions

### By Control

#### Custodial Wallets
- **Third-party control**: Exchange or service holds your keys
- **Examples**: Coinbase, Binance wallets
- **Pros**: Easy recovery, user-friendly
- **Cons**: You don't control your keys ("not your keys, not your coins")

#### Non-Custodial Wallets
- **Self-custody**: You control your private keys
- **Examples**: Electrum, Bitcoin Core, hardware wallets
- **Pros**: Full control, more secure
- **Cons**: You're responsible for key management

### By Technology

#### Full Node Wallets
- **Bitcoin Core**: Downloads entire blockchain
- **Pros**: Maximum privacy, validates all transactions
- **Cons**: Requires significant storage and bandwidth

#### SPV (Simplified Payment Verification) Wallets
- **Light clients**: Don't download full blockchain
- **Pros**: Faster setup, less storage
- **Cons**: Less privacy, relies on other nodes

#### Hardware Wallets
- **Physical devices**: Ledger, Trezor, Coldcard
- **Pros**: Excellent security, keys never leave device
- **Cons**: Cost, requires physical device

---

## How Wallets Work

### Key Generation

1. **Random Generation**: Private key is randomly generated (256 bits)
2. **Public Key Derivation**: Public key derived using elliptic curve cryptography
3. **Address Creation**: Address generated from public key using hash functions
4. **Address Types**: P2PKH, P2SH, P2WPKH, P2TR (Taproot)

### Getting your first bitcoin

You can buy bitcoin on exchanges (often with identity checks) or at some ATMs, then withdraw to your own wallet. Withdrawing to a non-custodial wallet gives you self-custody.

### Sending safely

Before sending, double-check the recipient address (Bitcoin addresses are long; a typo can lose funds). Check current [fee](/docs/bitcoin/transaction-fees) conditions so your transaction is included in a reasonable time. See [Transaction Lifecycle](/docs/bitcoin/transaction-lifecycle) for how confirmations work.

### Transaction Process

1. **UTXO Selection**: Wallet chooses which UTXOs to spend (coin selection)
2. **Transaction Creation**: Builds transaction with inputs and outputs
3. **Signing**: Signs transaction with private key(s)
4. **Broadcasting**: Sends transaction to Bitcoin network
5. **Confirmation**: Transaction included in a block

### Address Management

- **HD Wallets**: Hierarchical Deterministic wallets generate addresses from a single seed
- **Key Derivation**: Uses BIP32/BIP44 standards with derivation paths
- **Address Reuse**: Generally discouraged for privacy
- **Change Addresses**: New addresses created for change outputs

---

## Creating a Wallet

### Software Wallet (Bitcoin Core)

```bash
# Install Bitcoin Core
# Download from bitcoin.org

# Start Bitcoin Core (will create wallet.dat)
bitcoind -daemon

# Create new wallet
bitcoin-cli createwallet "mywallet"

# Get new address
bitcoin-cli getnewaddress

# Get wallet info
bitcoin-cli getwalletinfo
```

### Software Wallet (Electrum)

1. **Download**: Get Electrum from electrum.org
2. **Install**: Run installer for your platform
3. **Create Wallet**: 
   - Choose "Standard wallet"
   - Select "Create a new seed"
   - Save seed phrase securely
4. **Set Password**: Choose encryption password
5. **Ready**: Wallet is created and ready to use

### Hardware Wallet

1. **Purchase**: Buy hardware wallet (Ledger, Trezor, etc.)
2. **Initialize**: Follow device instructions
3. **Generate Seed**: Device generates 24-word seed phrase
4. **Backup Seed**: Write down seed phrase (never digital!)
5. **Set PIN**: Create PIN for device access
6. **Install Software**: Install companion app (Ledger Live, etc.)
7. **Connect**: Connect device and create Bitcoin account

### Programmatic Wallet Creation

:::code-group
```rust
use bitcoin::{
    secp256k1::{Secp256k1, rand::rngs::OsRng},
    Address, Network, PublicKey, PrivateKey,
};

fn main() {
    let secp = Secp256k1::new();
    
    // Generate key pair
    let (secret_key, public_key) = secp.generate_keypair(&mut OsRng);
    
    // Create private key
    let private_key = PrivateKey::new(secret_key, Network::Bitcoin);
    
    // Create public key and address (P2PKH)
    let public_key = PublicKey::new(public_key);
    let address = Address::p2pkh(&public_key, Network::Bitcoin);
    
    println!("Private Key (WIF): {}", private_key);
    println!("Address: {}", address);
}
```

```python
import secrets
import hashlib
from ecdsa import SECP256k1, SigningKey

# Generate random 256-bit private key
private_key_bytes = secrets.token_bytes(32)
private_key_hex = private_key_bytes.hex()

# Derive public key using secp256k1
signing_key = SigningKey.from_string(private_key_bytes, curve=SECP256k1)
verifying_key = signing_key.get_verifying_key()
public_key_bytes = b'\x04' + verifying_key.to_string()  # Uncompressed

# Generate P2PKH address
sha256_hash = hashlib.sha256(public_key_bytes).digest()
ripemd160_hash = hashlib.new('ripemd160', sha256_hash).digest()
versioned = b'\x00' + ripemd160_hash  # 0x00 = mainnet

# Double SHA256 for checksum
checksum = hashlib.sha256(hashlib.sha256(versioned).digest()).digest()[:4]

# Base58Check encode
import base58
address = base58.b58encode(versioned + checksum).decode()

print(f"Private Key: {private_key_hex}")
print(f"Address: {address}")
```

```cpp
#include <bitcoin/bitcoin.hpp>
#include <iostream>

int main() {
    // Generate random private key (256 bits)
    bc::data_chunk seed(32);
    bc::pseudo_random_fill(seed);
    
    bc::ec_secret secret;
    std::copy(seed.begin(), seed.end(), secret.begin());
    
    // Derive public key
    bc::ec_compressed public_key;
    bc::secret_to_public(public_key, secret);
    
    // Generate P2PKH address
    bc::wallet::ec_private private_key(secret, bc::wallet::ec_private::mainnet);
    bc::wallet::payment_address address(public_key);
    
    std::cout << "Private Key (WIF): " << private_key.encoded() << std::endl;
    std::cout << "Address: " << address.encoded() << std::endl;
    
    return 0;
}
```

```go
package main

import (
	"crypto/rand"
	"fmt"

	"github.com/btcsuite/btcd/btcec/v2"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
)

func main() {
	// Generate key pair
	privateKey, err := btcec.NewPrivateKey()
	if err != nil {
		panic(err)
	}

	// Get private key (WIF format)
	wif, err := btcutil.NewWIF(privateKey, &chaincfg.MainNetParams, true)
	if err != nil {
		panic(err)
	}

	// Generate address (P2PKH)
	pubKeyHash := btcutil.Hash160(privateKey.PubKey().SerializeCompressed())
	addr, err := btcutil.NewAddressPubKeyHash(pubKeyHash, &chaincfg.MainNetParams)
	if err != nil {
		panic(err)
	}

	fmt.Printf("Private Key: %s\n", wif.String())
	fmt.Printf("Address: %s\n", addr.EncodeAddress())
}
```

```javascript
const bitcoin = require('bitcoinjs-lib');
const { randomBytes } = require('crypto');

// Generate key pair
const keyPair = bitcoin.ECPair.makeRandom();

// Get private key (WIF format)
const privateKey = keyPair.toWIF();

// Generate address (P2PKH)
const { address } = bitcoin.payments.p2pkh({ 
  pubkey: keyPair.publicKey 
});

console.log('Private Key:', privateKey);
console.log('Address:', address);
```
:::

---

## Wallet Security Best Practices

### Private Key Management

- **Never share**: Never share your private keys or seed phrase
- **Secure storage**: Store seed phrases offline, physically secure
- **Multiple backups**: Create multiple backups in different locations
- **No digital storage**: Never store seed phrases on computers or cloud

### Security Measures

- **Use hardware wallets**: For significant amounts
- **Enable 2FA**: Where possible (for custodial wallets)
- **Verify addresses**: Always verify receiving addresses
- **Test transactions**: Send small amounts first
- **Keep software updated**: Update wallet software regularly

### Backup Strategies

- **Seed phrase backup**: Write down seed phrase, store securely
- **Multiple locations**: Keep backups in different physical locations
- **Test recovery**: Verify you can recover wallet from seed phrase
- **Encryption**: Encrypt backups if storing digitally (but prefer physical)

---

## Wallet Features

### Basic Features

- **Send Bitcoin**: Create and broadcast transactions
- **Receive Bitcoin**: Generate addresses for receiving
- **View Balance**: Check UTXO balance
- **Transaction History**: View past transactions

### Advanced Features

- **Multisig**: Require multiple signatures
- **Coin Control**: Manually select which UTXOs to spend
- **Fee Estimation**: Calculate appropriate fee rates
- **RBF**: Replace unconfirmed transactions
- **PSBT**: Partially Signed Bitcoin Transactions

---

## Related Topics

- [HD Wallets](/docs/wallets/hd-wallets) - Hierarchical deterministic wallet architecture
- [Address Types](/docs/wallets/address-types) - Understanding different Bitcoin address formats
- [Coin Selection](/docs/wallets/coin-selection) - How wallets choose UTXOs to spend
- [Multisig](/docs/wallets/multisig) - Multi-signature wallet concepts
- [Transaction Creation](/docs/wallets/transactions) - How to create and sign transactions
- [Privacy Techniques](/docs/wallets/privacy) - CoinJoin, Payjoin, and privacy best practices
- [Smart Contracts](/docs/wallets/smart-contracts) - Advanced scripting and contract patterns
