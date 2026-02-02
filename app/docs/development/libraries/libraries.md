# Libraries & SDKs Reference

This guide compares major Bitcoin libraries across languages and provides practical examples for common development tasks.

> Library Versions
> Code examples in this documentation are tested with the following library versions:
> - **bitcoinjs-lib**: v6.x (uses factory pattern for bip32/ecpair)
> - **bip32**: v4.x (requires `tiny-secp256k1` via `BIP32Factory`)
> - **rust-bitcoin**: v0.31.x
> - **BDK**: v0.29.x
> - **python-bitcoinlib**: v0.12.x
> - **bip32utils**: v0.3.x (use `BIP32Key.fromSeed()` for seed-based derivation)

When using different versions, consult each library's migration guides for API changes.

## Library Overview

### By Language

| Language | Library | Best For | Maintenance |
|----------|---------|----------|-------------|
| JavaScript | bitcoinjs-lib | Web apps, general use | Active |
| Rust | rust-bitcoin | Core development | Active |
| Rust | BDK | Wallet development | Active |
| Python | python-bitcoinlib | Scripts, learning | Moderate |
| Go | btcd/btcutil | Infrastructure | Active |
| C++ | libbitcoin | Performance-critical | Active |

### Feature Comparison

| Feature | bitcoinjs-lib | rust-bitcoin | BDK | python-bitcoinlib |
|---------|--------------|--------------|-----|-------------------|
| Transaction Building | ✓ | ✓ | ✓ | ✓ |
| PSBT Support | ✓ | ✓ | ✓ | Partial |
| Taproot | ✓ | ✓ | ✓ | Limited |
| HD Wallets | Via bip32/bip39 | Via bip32 | ✓ | Via bip32utils |
| Coin Selection | Manual | Manual | ✓ | Manual |
| Blockchain Sync | No | No | ✓ | No |

---

## JavaScript/TypeScript

### bitcoinjs-lib

The most popular JavaScript Bitcoin library.

**Installation:**

```bash
npm install bitcoinjs-lib
npm install ecpair tiny-secp256k1  # For signing
npm install bip32 bip39            # For HD wallets
```

**Basic Usage:**

```typescript
import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import * as bip39 from 'bip39';

const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

// Generate mnemonic and derive keys
const mnemonic = bip39.generateMnemonic(256);
const seed = await bip39.mnemonicToSeed(mnemonic);
const root = bip32.fromSeed(seed);

// BIP84 derivation (Native SegWit)
const child = root.derivePath("m/84'/0'/0'/0/0");

// Create address
const { address } = bitcoin.payments.p2wpkh({
  pubkey: child.publicKey,
  network: bitcoin.networks.bitcoin,
});
console.log('Address:', address);
```

**Transaction Building:**

```typescript
const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

// Add input
psbt.addInput({
  hash: 'txid_hex',
  index: 0,
  witnessUtxo: {
    script: Buffer.from('0014...', 'hex'),
    value: 100000,
  },
});

// Add output
psbt.addOutput({
  address: 'bc1q...',
  value: 50000,
});

// Sign
psbt.signInput(0, ECPair.fromPrivateKey(child.privateKey!));
psbt.finalizeAllInputs();

// Get raw transaction
const tx = psbt.extractTransaction();
console.log('Raw TX:', tx.toHex());
```

### noble-secp256k1

Lightweight cryptographic library for schnorr/ECDSA.

```typescript
import * as secp from '@noble/secp256k1';

// Generate key pair
const privateKey = secp.utils.randomPrivateKey();
const publicKey = secp.getPublicKey(privateKey);

// Sign message (Schnorr for Taproot)
const message = new Uint8Array(32); // Your message hash
const signature = await secp.schnorr.sign(message, privateKey);

// Verify
const isValid = await secp.schnorr.verify(signature, message, publicKey);
```

---

## Rust

### rust-bitcoin

Low-level Bitcoin library for Rust.

**Cargo.toml:**

```toml
[dependencies]
bitcoin = "0.31"
secp256k1 = { version = "0.28", features = ["global-context"] }
```

**Basic Usage:**

```rust
use bitcoin::{
    Address, Network, PrivateKey, PublicKey,
    secp256k1::{Secp256k1, SecretKey},
};

fn main() {
    let secp = Secp256k1::new();
    
    // Generate key pair
    let secret_key = SecretKey::new(&mut rand::thread_rng());
    let private_key = PrivateKey::new(secret_key, Network::Bitcoin);
    let public_key = PublicKey::from_private_key(&secp, &private_key);
    
    // Create addresses
    let p2wpkh = Address::p2wpkh(&public_key, Network::Bitcoin).unwrap();
    println!("P2WPKH: {}", p2wpkh);
}
```

**Transaction Building:**

```rust
use bitcoin::{
    Transaction, TxIn, TxOut, OutPoint, Sequence,
    absolute::LockTime, Amount, ScriptBuf,
    sighash::{SighashCache, EcdsaSighashType},
};

fn create_transaction(
    prev_txid: Txid,
    prev_vout: u32,
    recipient: Address,
    amount: Amount,
) -> Transaction {
    let tx = Transaction {
        version: 2,
        lock_time: LockTime::ZERO,
        input: vec![TxIn {
            previous_output: OutPoint::new(prev_txid, prev_vout),
            script_sig: ScriptBuf::new(),
            sequence: Sequence::ENABLE_RBF_NO_LOCKTIME,
            witness: bitcoin::Witness::default(),
        }],
        output: vec![TxOut {
            value: amount,
            script_pubkey: recipient.script_pubkey(),
        }],
    };
    
    tx
}
```

### BDK (Bitcoin Dev Kit)

High-level wallet library built on rust-bitcoin.

**Cargo.toml:**

```toml
[dependencies]
bdk = "0.29"
```

**Wallet Creation:**

```rust
use bdk::{
    Wallet, SignOptions,
    database::MemoryDatabase,
    bitcoin::Network,
    keys::{DerivableKey, GeneratableKey, bip39::{Mnemonic, Language}},
    template::Bip84,
};

fn create_wallet() -> Result<Wallet<MemoryDatabase>, Box<dyn std::error::Error>> {
    // Generate mnemonic
    let mnemonic = Mnemonic::generate((bdk::keys::bip39::WordCount::Words24, Language::English))?;
    
    // Create wallet with BIP84 descriptors
    let wallet = Wallet::new(
        Bip84(mnemonic.clone(), None),
        Some(Bip84(mnemonic, None)),
        Network::Bitcoin,
        MemoryDatabase::default(),
    )?;
    
    Ok(wallet)
}
```

**Transaction Building with BDK:**

```rust
use bdk::{FeeRate, wallet::AddressIndex};

fn send_transaction(
    wallet: &Wallet<MemoryDatabase>,
    recipient: &str,
    amount: u64,
) -> Result<Transaction, Box<dyn std::error::Error>> {
    let recipient = Address::from_str(recipient)?;
    
    // Build transaction
    let mut builder = wallet.build_tx();
    builder
        .add_recipient(recipient.script_pubkey(), amount)
        .fee_rate(FeeRate::from_sat_per_vb(5.0))
        .enable_rbf();
    
    let (mut psbt, _details) = builder.finish()?;
    
    // Sign
    wallet.sign(&mut psbt, SignOptions::default())?;
    
    // Extract final transaction
    let tx = psbt.extract_tx();
    Ok(tx)
}
```

### LDK (Lightning Dev Kit)

Embed Lightning in your Rust application.

```rust
use lightning::chain::keysinterface::KeysManager;
use lightning::ln::channelmanager::ChannelManager;

// LDK requires more setup - see lightning.dev for full examples
// Key components:
// - ChannelManager: Manages channels
// - PeerManager: Handles peer connections  
// - ChainMonitor: Monitors on-chain events
```

---

## Python

### python-bitcoinlib

```bash
pip install python-bitcoinlib
```

**Basic Usage:**

```python
from bitcoin import SelectParams
from bitcoin.core import CTransaction, CTxIn, CTxOut, COutPoint, COIN
from bitcoin.core.script import CScript, OP_DUP, OP_HASH160, OP_EQUALVERIFY, OP_CHECKSIG
from bitcoin.wallet import CBitcoinAddress, CBitcoinSecret

# Select network
SelectParams('mainnet')  # or 'testnet', 'regtest'

# Create address from private key
secret = CBitcoinSecret.from_secret_bytes(bytes(32))  # Use real entropy!
address = CBitcoinAddress.from_pubkey(secret.pub)
print(f"Address: {address}")
```

**Transaction Building:**

```python
from bitcoin.core import CTransaction, CTxIn, CTxOut, COutPoint
from bitcoin.core.script import SignatureHash, SIGHASH_ALL

def create_transaction(prev_txid, prev_vout, recipient, amount, private_key):
    # Create input
    outpoint = COutPoint(bytes.fromhex(prev_txid)[::-1], prev_vout)
    txin = CTxIn(outpoint)
    
    # Create output
    recipient_addr = CBitcoinAddress(recipient)
    txout = CTxOut(amount, recipient_addr.to_scriptPubKey())
    
    # Create unsigned transaction
    tx = CTransaction([txin], [txout])
    
    # Sign
    sighash = SignatureHash(
        recipient_addr.to_scriptPubKey(),
        tx, 0, SIGHASH_ALL
    )
    sig = private_key.sign(sighash) + bytes([SIGHASH_ALL])
    
    # Add signature to input
    txin.scriptSig = CScript([sig, private_key.pub])
    
    return CTransaction([txin], [txout])
```

### bip32utils

For HD wallet derivation in Python.

```python
from bip32utils import BIP32Key
from mnemonic import Mnemonic

# Generate mnemonic
mnemo = Mnemonic("english")
words = mnemo.generate(256)
seed = mnemo.to_seed(words)

# Create master key
master = BIP32Key.fromEntropy(seed)

# Derive BIP84 path
account = master.ChildKey(84 + 0x80000000)  # purpose (hardened)
account = account.ChildKey(0 + 0x80000000)   # coin_type (hardened)
account = account.ChildKey(0 + 0x80000000)   # account (hardened)
external = account.ChildKey(0)                # change
address_key = external.ChildKey(0)            # address_index

print(f"Address: {address_key.Address()}")
```

---

## Go

### btcd/btcutil

```go
import (
    "github.com/btcsuite/btcd/btcec/v2"
    "github.com/btcsuite/btcd/btcutil"
    "github.com/btcsuite/btcd/chaincfg"
)

func generateAddress() {
    // Generate private key
    privateKey, _ := btcec.NewPrivateKey()
    
    // Get public key
    publicKey := privateKey.PubKey()
    
    // Create P2WPKH address
    pubKeyHash := btcutil.Hash160(publicKey.SerializeCompressed())
    addr, _ := btcutil.NewAddressWitnessPubKeyHash(
        pubKeyHash,
        &chaincfg.MainNetParams,
    )
    
    fmt.Println("Address:", addr.String())
}
```

### lnd/lnrpc

For Lightning Network in Go.

```go
import (
    "github.com/lightningnetwork/lnd/lnrpc"
    "google.golang.org/grpc"
)

func connectToLND() {
    // Connect to LND
    conn, _ := grpc.Dial("localhost:10009", grpc.WithInsecure())
    client := lnrpc.NewLightningClient(conn)
    
    // Get node info
    info, _ := client.GetInfo(context.Background(), &lnrpc.GetInfoRequest{})
    fmt.Println("Node pubkey:", info.IdentityPubkey)
    
    // Create invoice
    invoice, _ := client.AddInvoice(context.Background(), &lnrpc.Invoice{
        Value: 1000,
        Memo:  "Test payment",
    })
    fmt.Println("Payment request:", invoice.PaymentRequest)
}
```

---

## Common Tasks

### Generate Address (All Languages)

```typescript
// JavaScript
const { address } = bitcoin.payments.p2wpkh({ pubkey: publicKey });
```

```rust
// Rust
let address = Address::p2wpkh(&public_key, Network::Bitcoin)?;
```

```python
# Python
address = CBitcoinAddress.from_pubkey(public_key)
```

```go
// Go
addr, _ := btcutil.NewAddressWitnessPubKeyHash(pubKeyHash, &chaincfg.MainNetParams)
```

### Parse Transaction

```typescript
// JavaScript
const tx = bitcoin.Transaction.fromHex(rawTxHex);
console.log('TXID:', tx.getId());
console.log('Inputs:', tx.ins.length);
console.log('Outputs:', tx.outs.length);
```

```rust
// Rust
let tx: Transaction = deserialize(&hex::decode(raw_tx_hex)?)?;
println!("TXID: {}", tx.txid());
```

```python
# Python
tx = CTransaction.deserialize(bytes.fromhex(raw_tx_hex))
print(f"TXID: {tx.GetTxid().hex()}")
```

### Validate Address

```typescript
// JavaScript
function isValidAddress(address: string): boolean {
  try {
    bitcoin.address.toOutputScript(address, bitcoin.networks.bitcoin);
    return true;
  } catch {
    return false;
  }
}
```

```rust
// Rust
fn is_valid_address(addr_str: &str) -> bool {
    Address::from_str(addr_str)
        .map(|a| a.is_valid_for_network(Network::Bitcoin))
        .unwrap_or(false)
}
```

```python
# Python
def is_valid_address(address):
    try:
        CBitcoinAddress(address)
        return True
    except:
        return False
```

---

## Choosing a Library

### Decision Matrix

| Use Case | Recommended |
|----------|-------------|
| Web wallet | bitcoinjs-lib |
| Mobile app (React Native) | bitcoinjs-lib |
| Backend service | rust-bitcoin or btcd |
| Wallet application | BDK |
| Lightning integration | LDK (Rust) or lnd (Go) |
| Scripting/automation | python-bitcoinlib |
| Learning/education | python-bitcoinlib |
| High-performance | rust-bitcoin or libbitcoin |

### Considerations

**bitcoinjs-lib:**
- Pros: Wide adoption, good docs, browser support
- Cons: JavaScript ecosystem complexity

**rust-bitcoin:**
- Pros: Type safety, performance, active development
- Cons: Steeper learning curve

**BDK:**
- Pros: Full wallet features, handles complexity
- Cons: Rust knowledge required

**python-bitcoinlib:**
- Pros: Easy to learn, great for scripts
- Cons: Slower, less complete Taproot support

---

## Summary

Each library has its strengths:

- **bitcoinjs-lib**: Best for web and cross-platform
- **rust-bitcoin/BDK**: Best for production applications
- **python-bitcoinlib**: Best for learning and scripting
- **btcd**: Best for Go infrastructure

Choose based on your language preference, use case, and required features. For production wallets, consider BDK for its completeness; for web apps, bitcoinjs-lib remains the standard choice.

---

## Related Topics

- [Getting Started](/docs/development) - Development environment setup
- [Transaction Construction](/docs/bitcoin-development/transactions) - Using libraries for transactions
- [PSBT](/docs/bitcoin-development/psbt) - Library support for PSBTs
- [Testing & Debugging](/docs/development/testing) - Library testing utilities
