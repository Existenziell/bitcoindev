# Taproot

Taproot is a major Bitcoin protocol upgrade activated in November 2021 (block 709,632). It combines Schnorr signatures with MAST (Merkle Abstract Syntax Trees) to provide better privacy, efficiency, and flexibility for Bitcoin transactions. [Pieter Wuille](/docs/history/people#pieter-wuille) was a key designer (BIPs 340, 341, 342). **Taproot** introduces a new output type (P2TR) that enables:

- **Schnorr signatures**: More efficient than ECDSA, enables signature aggregation
- **MAST**: Hides unused script conditions in a Merkle tree
- **Better privacy**: Complex contracts look identical to simple payments
- **Lower fees**: Smaller transaction sizes for complex scripts
- **Key path spending**: Simple single-signature spends look normal

---

## Key Components

### 1. Schnorr Signatures (BIP 340)

Taproot uses Schnorr for all P2TR signatures: 64-byte fixed size, signature aggregation (MuSig / MuSig2), and batch verification. See [Schnorr Signatures](/docs/bitcoin/cryptography#schnorr-signatures) for the full treatment.

### 2. MAST (Merkle Abstract Syntax Trees)

MAST allows multiple spending conditions while only revealing the one used:

```text
[Complex Contract]
├── Condition 1: 2-of-3 multisig
├── Condition 2: Timelock + signature
├── Condition 3: Hash preimage reveal
└── Condition 4: Simple signature (key path)
```

When spending:
- Use Condition 4 → Looks like simple payment
- Use Condition 1 → Only reveal that condition
- Other conditions remain hidden in Merkle tree

### 3. Taproot Outputs (P2TR)

Addresses start with `bc1p` and use Bech32m encoding:

```text
Format: bc1p + 32 characters
Example: bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac36sfj9ugtg7etq5
```

---

## How Taproot Works

### Key Path vs. Script Path

Taproot outputs can be spent in two ways:

#### Key Path (Simple Spend)

```text
Output: P2TR address
Spend: Single Schnorr signature
Result: Looks identical to any other Taproot spend
Privacy: Maximum (no script revealed)
```

#### Script Path (Complex Spend)

```text
Output: P2TR address (with hidden script tree)
Spend: Reveal one script branch + proof
Result: Reveals only the used condition
Privacy: Good (other conditions hidden)
```

### Taproot Construction

```text
1. Create internal key (from private key)
2. Create script tree (if needed)
3. Compute taproot output key:
   - If script tree: tweak internal key with script root
   - If key path only: use internal key directly
4. Generate P2TR address from output key
```

---

## Code Examples

### Creating a Taproot Address

:::code-group
```rust
use bitcoin::{Address, Network, PublicKey, XOnlyPublicKey};
use bitcoin::secp256k1::{Secp256k1, SecretKey, KeyPair};
use bitcoin::taproot::{TaprootBuilder, TaprootSpendInfo};

fn create_taproot_address(secret_key: SecretKey) -> (Address, TaprootSpendInfo) {
    let secp = Secp256k1::new();
    let keypair = KeyPair::from_secret_key(&secp, &secret_key);
    let (x_only_pubkey, _) = keypair.x_only_public_key();
    
    // Create taproot spend info (key path only)
    let spend_info = TaprootBuilder::new()
        .add_key(x_only_pubkey, None)
        .finalize(&secp, x_only_pubkey)
        .unwrap();
    
    let address = Address::from_str(
        &spend_info.output_key().to_string()
    ).unwrap();
    
    (address, spend_info)
}
```

```python
from bitcoin import SelectParams
from bitcoin.core import CKey
from bitcoin.wallet import P2TRBitcoinAddress
from bitcoin.taproot import TaprootSpendInfo, TaprootBuilder

def create_taproot_address(privkey):
    """Create a Taproot address from private key."""
    pubkey = privkey.pub
    x_only_pubkey = pubkey[1:]  # Remove 0x02/0x03 prefix
    
    # Create taproot spend info (key path only)
    builder = TaprootBuilder()
    builder.add_key(x_only_pubkey, None)
    spend_info = builder.finalize(x_only_pubkey)
    
    # Generate address
    address = P2TRBitcoinAddress.from_output_key(
        spend_info.output_pubkey()
    )
    
    return address, spend_info
```

```cpp
#include <bitcoin/bitcoin.hpp>

bc::wallet::payment_address create_taproot_address(
    const bc::ec_secret& secret
) {
    bc::ec_compressed pubkey;
    bc::secret_to_public(pubkey, secret);
    
    // Extract x-only public key (remove y coordinate)
    bc::data_chunk x_only(32);
    std::copy(pubkey.begin() + 1, pubkey.end(), x_only.begin());
    
    // Create taproot output key
    bc::hash_digest taproot_hash;
    bc::taproot_tweak_pubkey(pubkey, taproot_hash);
    
    // Generate P2TR address
    return bc::wallet::payment_address(
        bc::wallet::payment_address::mainnet_p2tr,
        taproot_hash
    );
}
```

```go
package main

import (
	"github.com/btcsuite/btcd/btcec/v2"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcd/txscript"
)

func createTaprootAddress(privKey *btcec.PrivateKey) (btcutil.Address, error) {
	pubKey := privKey.PubKey()
	
	// Create taproot output key (simplified - key path only)
	outputKey := txscript.ComputeTaprootOutputKey(pubKey, nil)
	
	// Generate P2TR address
	addr, err := btcutil.NewAddressTaproot(
		outputKey.SerializeCompressed()[1:], // x-only
		&chaincfg.MainNetParams,
	)
	
	return addr, err
}
```

```javascript
const bitcoin = require('bitcoinjs-lib');
const { schnorr } = require('@noble/secp256k1');

function createTaprootAddress(privateKey) {
    // Derive public key
    const publicKey = schnorr.getPublicKey(privateKey);
    
    // Create taproot output (simplified - key path only)
    const { address } = bitcoin.payments.p2tr({
        internalPubkey: publicKey.slice(1), // x-only
    });
    
    return address;
}
```
:::

### Creating a MAST Script Tree

:::code-group
```rust
use bitcoin::taproot::{TaprootBuilder, LeafVersion};
use bitcoin::Script;

fn create_mast_script_tree() -> TaprootBuilder {
    let mut builder = TaprootBuilder::new();
    
    // Add script leaves
    let script1 = Script::from_hex("...").unwrap(); // 2-of-3 multisig
    let script2 = Script::from_hex("...").unwrap(); // Timelock
    let script3 = Script::from_hex("...").unwrap(); // Hash lock
    
    builder = builder.add_leaf(0, script1.clone()).unwrap();
    builder = builder.add_leaf(0, script2.clone()).unwrap();
    builder = builder.add_leaf(0, script3.clone()).unwrap();
    
    builder
}
```

```python
from bitcoin.taproot import TaprootBuilder, LeafVersion
from bitcoin.core.script import CScript

def create_mast_script_tree():
    """Create a MAST script tree with multiple conditions."""
    builder = TaprootBuilder()
    
    # Add script leaves
    script1 = CScript([...])  # 2-of-3 multisig
    script2 = CScript([...])  # Timelock
    script3 = CScript([...])  # Hash lock
    
    builder.add_leaf(0, script1)
    builder.add_leaf(0, script2)
    builder.add_leaf(0, script3)
    
    return builder
```

```cpp
#include <bitcoin/bitcoin.hpp>

bc::taproot_builder create_mast_script_tree() {
    bc::taproot_builder builder;
    
    // Add script leaves
    bc::script script1 = bc::script::from_string("...");
    bc::script script2 = bc::script::from_string("...");
    bc::script script3 = bc::script::from_string("...");
    
    builder.add_leaf(0, script1);
    builder.add_leaf(0, script2);
    builder.add_leaf(0, script3);
    
    return builder;
}
```

```go
package main

import (
	"github.com/btcsuite/btcd/txscript"
)

func createMASTScriptTree() *txscript.IndexedTapScriptTree {
	// Create script leaves
	script1 := []byte{...} // 2-of-3 multisig
	script2 := []byte{...} // Timelock
	script3 := []byte{...} // Hash lock
	
	leaves := []txscript.TapLeaf{
		txscript.NewBaseTapLeaf(script1),
		txscript.NewBaseTapLeaf(script2),
		txscript.NewBaseTapLeaf(script3),
	}
	
	tree := txscript.AssembleTaprootScriptTree(leaves...)
	return tree
}
```

```javascript
const bitcoin = require('bitcoinjs-lib');

function createMASTScriptTree() {
    // Create script leaves
    const script1 = Buffer.from([...]); // 2-of-3 multisig
    const script2 = Buffer.from([...]); // Timelock
    const script3 = Buffer.from([...]); // Hash lock
    
    // Build Merkle tree (simplified)
    const leaves = [script1, script2, script3];
    // Note: Full MAST implementation requires Merkle tree construction
    
    return leaves;
}
```
:::

---

## Privacy Benefits

### Before Taproot

```text
Multisig Transaction:
- Reveals all public keys
- Reveals all signatures
- Obvious it's a multisig
- Linkable to other multisig transactions
```

### After Taproot

```text
Multisig Transaction (key path):
- Looks identical to single-sig
- No script revealed
- No way to tell it's multisig
- Maximum privacy
```

### Script Path Privacy

Even when using script path:

```text
Complex Contract with 10 conditions:
- Only reveals 1 used condition
- Other 9 conditions hidden in Merkle tree
- Much better than revealing all conditions
```

---

## Efficiency Benefits

### Signature Size

```text
ECDSA (SegWit):
- Signature: 71-72 bytes
- Public key: 33 bytes
- Total: ~104-105 bytes

Schnorr (Taproot):
- Signature: 64 bytes
- Public key: 32 bytes (x-only)
- Total: 96 bytes
- Savings: ~8-9 bytes per input
```

### Transaction Size

For a 2-of-3 multisig:

```text
Before Taproot (P2WSH):
- Script: ~105 bytes
- 2 signatures: ~142 bytes
- Total: ~247 bytes

After Taproot (key path):
- 1 signature: 64 bytes
- Total: 64 bytes
- Savings: ~74%!
```

---

## MuSig (Multi-Signature Aggregation)

Taproot enables MuSig, where multiple signatures are combined into one. The underlying [Schnorr](/docs/bitcoin/cryptography#schnorr-signatures) scheme makes this aggregation possible.

```text
Traditional Multisig:
- Key 1 signature: 71 bytes
- Key 2 signature: 71 bytes
- Key 3 signature: 71 bytes
- Total: 213 bytes

MuSig (Taproot):
- Aggregated signature: 64 bytes
- Savings: 70%!
```

---

## Adoption

### Current Usage

As of 2024:
- **~5-10% of transactions** use Taproot
- Growing adoption in modern wallets
- Required for advanced smart contracts

### Migration

1. **Use P2TR addresses** for new outputs
2. **Support Taproot** in wallet software
3. **Migrate existing funds** to Taproot for better privacy

---

## Technical Details

### Bech32m Encoding

Taproot uses Bech32m (modified Bech32) instead of Bech32:

- **Bech32**: Used for SegWit (P2WPKH, P2WSH)
- **Bech32m**: Used for Taproot (P2TR)
- **Difference**: Constant in checksum calculation

### Taproot Version

Taproot uses witness version 1:

```text
[Witness Program]
├── Version (1 byte): 0x01
└── Program (32 bytes): Taproot output key
```

### Tapscript

Taproot introduces Tapscript, a new scripting language:

- Based on Bitcoin Script
- New opcodes: `OP_CHECKSIGADD`
- Resource limits similar to SegWit

---

## Related Topics

- [SegWit](/docs/bitcoin/segwit) - Previous major upgrade
- [Schnorr Signatures](/docs/bitcoin/cryptography#schnorr-signatures) - Signature scheme
- MAST - Merkle Abstract Syntax Trees
- [Address Types](/docs/wallets/address-types) - Understanding P2TR addresses

---

## Resources

- [BIP 340: Schnorr Signatures](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)
- [BIP 341: Taproot](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki)
- [BIP 342: Validation of Taproot Scripts](https://github.com/bitcoin/bips/blob/master/bip-0342.mediawiki)
