# Address Generation & Validation

In the [UTXO model](/docs/fundamentals/utxos), coins are locked by **output scripts** (scriptPubKeys). Addresses are human-readable encodings of those scripts, so generating and validating addresses is how you turn [Bitcoin Script](/docs/bitcoin/script) into something users and APIs can use. This page covers the main address types (P2PKH, P2SH, P2WPKH, P2WSH, P2TR), encoding (Base58Check, Bech32, Bech32m), and how to derive and validate them in code.

## Address Types Overview

### Legacy Addresses (P2PKH)

**Format**: Starts with `1` (mainnet) or `m`/`n` (testnet)

```
1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2
```

**Script**: Pay-to-Public-Key-Hash
```
OP_DUP OP_HASH160 <pubkey_hash> OP_EQUALVERIFY OP_CHECKSIG
```

### Script Hash Addresses (P2SH)

**Format**: Starts with `3` (mainnet) or `2` (testnet)

```
3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy
```

**Script**: Pay-to-Script-Hash (can contain any script)
```
OP_HASH160 <script_hash> OP_EQUAL
```

### Native SegWit (P2WPKH)

**Format**: Starts with `bc1q` (mainnet) or `tb1q` (testnet)

```
bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq
```

**Script**: Pay-to-Witness-Public-Key-Hash
```
OP_0 <20-byte-pubkey-hash>
```

### Native SegWit Script (P2WSH)

**Format**: Starts with `bc1q` but longer (mainnet)

```
bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3
```

**Script**: Pay-to-Witness-Script-Hash
```
OP_0 <32-byte-script-hash>
```

### Taproot (P2TR)

**Format**: Starts with `bc1p` (mainnet) or `tb1p` (testnet)

```
bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297
```

**Script**: Pay-to-Taproot
```
OP_1 <32-byte-x-only-pubkey>
```

---

## Address Comparison

| Type | Prefix | Size | Encoding | Fee Efficiency |
|------|--------|------|----------|----------------|
| P2PKH | 1 | 25 bytes | Base58Check | Lowest |
| P2SH | 3 | 23 bytes | Base58Check | Low |
| P2WPKH | bc1q | 22 bytes | Bech32 | High |
| P2WSH | bc1q | 34 bytes | Bech32 | Medium |
| P2TR | bc1p | 34 bytes | Bech32m | Highest |

---

## Generating Addresses

### From Public Key to P2WPKH (Native SegWit)

:::code-group
```rust
use bitcoin::{Address, Network, PublicKey, CompressedPublicKey};
use bitcoin::secp256k1::{Secp256k1, SecretKey};

fn generate_address(secret_key: &SecretKey) -> Address {
    let secp = Secp256k1::new();
    let public_key = PublicKey::from_private_key(&secp, &secret_key.into());
    let compressed = CompressedPublicKey::try_from(public_key).unwrap();
    Address::p2wpkh(&compressed, Network::Bitcoin)
}
```

```python
import hashlib
import bech32

def pubkey_to_p2wpkh(pubkey_bytes, mainnet=True):
    sha256_hash = hashlib.sha256(pubkey_bytes).digest()
    ripemd160 = hashlib.new('ripemd160')
    ripemd160.update(sha256_hash)
    pubkey_hash = ripemd160.digest()
    
    hrp = 'bc' if mainnet else 'tb'
    converted = bech32.convertbits(pubkey_hash, 8, 5)
    return bech32.bech32_encode(hrp, [0] + converted)
```

```cpp
#include <bitcoin/bitcoin.hpp>

bc::wallet::payment_address generate_address(const bc::ec_secret& secret) {
    bc::ec_compressed pubkey;
    bc::secret_to_public(pubkey, secret);
    return bc::wallet::payment_address(
        bc::wallet::ec_public(pubkey), 
        bc::wallet::payment_address::mainnet_p2wpkh
    );
}
```

```javascript
import * as bitcoin from 'bitcoinjs-lib';

const p2wpkh = bitcoin.payments.p2wpkh({ 
  pubkey: publicKey,
  network: bitcoin.networks.bitcoin 
});
console.log(p2wpkh.address); // bc1q...
```

```go
package main

import (
	"fmt"

	"github.com/btcsuite/btcd/btcec/v2"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
)

func pubkeyToP2WPKH(pubkeyBytes []byte, mainnet bool) (string, error) {
	pubkey, err := btcec.ParsePubKey(pubkeyBytes)
	if err != nil {
		return "", err
	}

	pubkeyHash := btcutil.Hash160(pubkey.SerializeCompressed())
	
	params := &chaincfg.MainNetParams
	if !mainnet {
		params = &chaincfg.TestNet3Params
	}

	addr, err := btcutil.NewAddressWitnessPubKeyHash(pubkeyHash, params)
	if err != nil {
		return "", err
	}

	return addr.EncodeAddress(), nil
}

func main() {
	// Example usage
	pubkey, _ := btcec.NewPrivateKey()
	pubkeyBytes := pubkey.PubKey().SerializeCompressed()
	
	addr, _ := pubkeyToP2WPKH(pubkeyBytes, true)
	fmt.Println(addr) // bc1q...
}
```
:::

---

## Validating Addresses

:::code-group
```rust
use bitcoin::{Address, Network};
use std::str::FromStr;

fn validate_address(addr_str: &str) -> Result<String, String> {
    match Address::from_str(addr_str) {
        Ok(addr) => Ok(match addr.address_type() {
            Some(bitcoin::AddressType::P2pkh) => "P2PKH",
            Some(bitcoin::AddressType::P2wpkh) => "P2WPKH",
            Some(bitcoin::AddressType::P2tr) => "P2TR",
            _ => "Other",
        }.to_string()),
        Err(e) => Err(format!("Invalid: {}", e))
    }
}
```

```python
import hashlib, base58, bech32

def validate_address(address):
    if address.startswith('bc1') or address.startswith('tb1'):
        hrp, data = bech32.bech32_decode(address)
        if hrp: return True, "P2WPKH" if len(data) == 21 else "P2WSH"
        hrp, data = bech32.bech32m_decode(address)
        if hrp: return True, "P2TR"
    else:
        try:
            decoded = base58.b58decode_check(address)
            return True, "P2PKH" if decoded[0] == 0 else "P2SH"
        except: pass
    return False, "Invalid"
```

```cpp
#include <bitcoin/bitcoin.hpp>

bool validate_address(const std::string& address) {
    bc::wallet::payment_address addr(address);
    return addr.is_valid();
}
```

```javascript
import * as bitcoin from 'bitcoinjs-lib';

function validateAddress(address, network = bitcoin.networks.bitcoin) {
  try {
    bitcoin.address.toOutputScript(address, network);
    return true;
  } catch (e) {
    return false;
  }
}
```

```go
package main

import (
	"fmt"

	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
)

func validateAddress(address string) (bool, string) {
	addr, err := btcutil.DecodeAddress(address, &chaincfg.MainNetParams)
	if err != nil {
		// Try testnet
		addr, err = btcutil.DecodeAddress(address, &chaincfg.TestNet3Params)
		if err != nil {
			return false, "Invalid"
		}
	}

	switch addr.(type) {
	case *btcutil.AddressPubKeyHash:
		return true, "P2PKH"
	case *btcutil.AddressScriptHash:
		return true, "P2SH"
	case *btcutil.AddressWitnessPubKeyHash:
		return true, "P2WPKH"
	case *btcutil.AddressWitnessScriptHash:
		return true, "P2WSH"
	case *btcutil.AddressTaproot:
		return true, "P2TR"
	default:
		return true, "Other"
	}
}

func main() {
	valid, addrType := validateAddress("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2")
	fmt.Printf("Valid: %v, Type: %s\n", valid, addrType)
}
```
:::

---

## Bech32 Encoding Details

### Bech32 vs Bech32m

```
Bech32 (BIP-173):
- Used for SegWit v0 (P2WPKH, P2WSH)
- Checksum constant: 1

Bech32m (BIP-350):
- Used for SegWit v1+ (Taproot)
- Checksum constant: 0x2bc830a3
```

### Why Bech32m?

Bech32 had a weakness where certain error patterns could go undetected. Bech32m fixes this for future witness versions.

---

## From Script to Address

:::code-group
```rust
use bitcoin::{Address, Script, Network};

fn script_to_address(script: &Script) -> Option<Address> {
    Address::from_script(script, Network::Bitcoin).ok()
}
```

```python
from bitcoin.core.script import CScript
from bitcoin.wallet import CBitcoinAddress

def script_to_address(script):
    return str(CBitcoinAddress.from_scriptPubKey(script))
```

```cpp
#include <bitcoin/bitcoin.hpp>

std::string script_to_address(const bc::chain::script& script) {
    return bc::wallet::payment_address(script).encoded();
}
```

```javascript
import * as bitcoin from 'bitcoinjs-lib';

function scriptToAddress(script, network = bitcoin.networks.bitcoin) {
  return bitcoin.address.fromOutputScript(script, network);
}
```

```go
package main

import (
	"fmt"

	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcd/txscript"
)

func scriptToAddress(script []byte) (string, error) {
	addr, err := btcutil.NewAddressScriptHash(script, &chaincfg.MainNetParams)
	if err != nil {
		return "", err
	}
	return addr.EncodeAddress(), nil
}

func main() {
	// Example: Convert a script to address
	script, _ := txscript.NewScriptBuilder().
		AddOp(txscript.OP_DUP).
		AddOp(txscript.OP_HASH160).
		AddData([]byte("example_pubkey_hash")).
		AddOp(txscript.OP_EQUALVERIFY).
		AddOp(txscript.OP_CHECKSIG).
		Script()

	addr, _ := scriptToAddress(script)
	fmt.Println(addr)
}
```
:::

---

## Address Derivation Paths

### BIP Standards

| BIP | Path | Address Type | Example |
|-----|------|--------------|---------|
| BIP44 | m/44'/0'/0' | P2PKH | 1... |
| BIP49 | m/49'/0'/0' | P2SH-P2WPKH | 3... |
| BIP84 | m/84'/0'/0' | P2WPKH | bc1q... |
| BIP86 | m/86'/0'/0' | P2TR | bc1p... |

### Deriving Addresses from Seed

:::code-group
```rust
use bdk::keys::bip39::Mnemonic;
use bitcoin::bip32::{Xpriv, DerivationPath};

fn derive_address(mnemonic: &str) -> Address {
    let mnemonic = Mnemonic::parse(mnemonic).unwrap();
    let seed = mnemonic.to_seed("");
    let master = Xpriv::new_master(Network::Bitcoin, &seed).unwrap();
    let path = DerivationPath::from_str("m/84'/0'/0'/0/0").unwrap();
    let derived = master.derive_priv(&secp, &path).unwrap();
    // Convert to address...
}
```

```python
from mnemonic import Mnemonic
from bip32utils import BIP32Key

def derive_address(words):
    seed = Mnemonic("english").to_seed(words)
    master = BIP32Key.fromEntropy(seed)
    # Derive m/84'/0'/0'/0/0
    key = master.ChildKey(84 + 0x80000000).ChildKey(0x80000000).ChildKey(0x80000000).ChildKey(0).ChildKey(0)
    return key.Address()
```

```cpp
#include <bitcoin/bitcoin.hpp>

std::string derive_address(const std::string& mnemonic) {
    auto seed = bc::wallet::decode_mnemonic(bc::split(mnemonic));
    bc::wallet::hd_private master(seed);
    auto derived = master.derive_private(84 + bc::wallet::hd_first_hardened_key)
                        .derive_private(bc::wallet::hd_first_hardened_key)
                        .derive_private(bc::wallet::hd_first_hardened_key)
                        .derive_private(0).derive_private(0);
    return bc::wallet::payment_address(derived).encoded();
}
```

```javascript
import { BIP32Factory } from 'bip32';
import * as bip39 from 'bip39';

async function deriveAddress(mnemonic) {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const root = bip32.fromSeed(seed);
  const child = root.derivePath("m/84'/0'/0'/0/0");
  return bitcoin.payments.p2wpkh({ pubkey: child.publicKey }).address;
}
```
:::

---

## Multi-Signature Addresses

### Creating 2-of-3 Multisig

:::code-group
```rust
use bitcoin::{PublicKey, Script, Address};
use bitcoin::blockdata::script::Builder;

fn create_multisig(m: usize, pubkeys: &[PublicKey]) -> Address {
    let script = Builder::new()
        .push_int(m as i64)
        .push_keys(pubkeys)
        .push_int(pubkeys.len() as i64)
        .push_opcode(opcodes::all::OP_CHECKMULTISIG)
        .into_script();
    Address::p2wsh(&script, Network::Bitcoin)
}
```

```python
from bitcoin.core.script import CScript, OP_2, OP_3, OP_CHECKMULTISIG
from bitcoin.wallet import P2SHBitcoinAddress

def create_multisig(m, pubkeys):
    script = CScript([m] + pubkeys + [len(pubkeys), OP_CHECKMULTISIG])
    return str(P2SHBitcoinAddress.from_redeemScript(script))
```

```cpp
#include <bitcoin/bitcoin.hpp>

std::string create_multisig(uint8_t m, const std::vector<bc::ec_compressed>& pubkeys) {
    bc::chain::script script = bc::chain::script::to_pay_multisig_pattern(m, pubkeys);
    return bc::wallet::payment_address(script).encoded();
}
```

```javascript
import * as bitcoin from 'bitcoinjs-lib';

function createMultisig(m, pubkeys) {
  const multisig = bitcoin.payments.p2ms({ m, pubkeys });
  const p2wsh = bitcoin.payments.p2wsh({ redeem: multisig });
  return p2wsh.address; // bc1q... (P2WSH)
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

func createMultisig(m int, pubkeys [][]byte) (string, error) {
	// Create multisig script
	builder := txscript.NewScriptBuilder()
	builder.AddInt64(int64(m))
	for _, pubkey := range pubkeys {
		builder.AddData(pubkey)
	}
	builder.AddInt64(int64(len(pubkeys)))
	builder.AddOp(txscript.OP_CHECKMULTISIG)
	script, err := builder.Script()
	if err != nil {
		return "", err
	}

	// Create P2WSH address
	scriptHash := btcutil.Hash160(script)
	addr, err := btcutil.NewAddressWitnessScriptHash(scriptHash, &chaincfg.MainNetParams)
	if err != nil {
		return "", err
	}

	return addr.EncodeAddress(), nil
}

func main() {
	// Example: 2-of-3 multisig
	pubkeys := make([][]byte, 3)
	for i := 0; i < 3; i++ {
		privkey, _ := btcec.NewPrivateKey()
		pubkeys[i] = privkey.PubKey().SerializeCompressed()
	}

	addr, _ := createMultisig(2, pubkeys)
	fmt.Println(addr) // bc1q... (P2WSH)
}
```
:::

---

## Common Mistakes

### Address Validation Pitfalls

- **BAD**: Only checking prefix (`address.startsWith('bc1')`)
- **GOOD**: Full validation with checksum verification using library functions

### Network Mismatch

Always use consistent network parameters. Never mix mainnet keys with testnet addresses.

### Checksum Errors

Always validate checksums before using an address - all libraries provide validation functions.

---

## Best Practices

### Address Handling

1. **Case Sensitivity**: Bech32 is case-insensitive, Base58 is case-sensitive
2. **Display Formatting**: Consider QR codes for long addresses
3. **Copy Protection**: Use checksums to detect copy errors
4. **Network Verification**: Always verify mainnet vs testnet

---

## Summary

Understanding Bitcoin addresses requires knowledge of:

- **Encoding Schemes**: Base58Check, Bech32, Bech32m
- **Script Types**: P2PKH, P2SH, P2WPKH, P2WSH, P2TR
- **Derivation**: BIP32/39/44/49/84/86 standards
- **Validation**: Checksum verification and format checking

Modern applications should default to Bech32m (Taproot) addresses for the best fee efficiency and privacy features.

---

## Related Topics

- [Key Management](/docs/bitcoin-development/keys) - Managing private and public keys
- [Output Descriptors](/docs/bitcoin-development/descriptors) - Deriving addresses from descriptors
- [Payment Requests](/docs/bitcoin-development/payment-requests) - bitcoin: URIs and receiving payments
- [Address Types](/docs/wallets/address-types) - Detailed address type comparison
- [HD Wallets](/docs/wallets/hd-wallets) - Derivation paths and wallet structure
- [Transaction Construction](/docs/bitcoin-development/transactions) - Using addresses in transactions
