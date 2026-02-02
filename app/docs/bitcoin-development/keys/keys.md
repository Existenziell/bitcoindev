# Key Management & Security

In Bitcoin's [trust model](/docs/fundamentals/trust-model), you don't rely on a custodian; you prove ownership with private keys and signatures. "Not your keys, not your coins" means key management is the foundation of security. This guide covers HD wallets, seed phrases, derivation paths, and best practices so you can generate and use keys in code without trusting third parties.

## HD Wallets (BIP32)

Hierarchical Deterministic (HD) wallets generate an entire tree of keys from a single seed. This enables:

- **Backup Simplicity**: One seed backs up all keys
- **Key Organization**: Structured derivation paths
- **Privacy**: Fresh addresses without new backups
- **Watch-Only Wallets**: Share xpubs without exposing keys

### Key Derivation

```text
[Master Seed]
      |
      |
[Master Key m]
|
├─── Account 0 (m/44'/0'/0')
│    ├── External Chain (m/44'/0'/0'/0) --> Address 0, Address 1
│    └── Internal Chain (m/44'/0'/0'/1) --> Change 0
└─── Account 1 (m/44'/0'/1')
```

### HD Wallet Implementation

:::code-group
```rust
use bitcoin::bip32::{Xpriv, DerivationPath};
use bitcoin::secp256k1::Secp256k1;

fn derive_key(seed: &[u8]) -> Xpriv {
    let secp = Secp256k1::new();
    let master = Xpriv::new_master(bitcoin::Network::Bitcoin, seed).unwrap();
    let path = DerivationPath::from_str("m/84'/0'/0'/0/0").unwrap();
    master.derive_priv(&secp, &path).unwrap()
}
```

```python
from mnemonic import Mnemonic
from bip32utils import BIP32Key

mnemo = Mnemonic("english")
words = mnemo.generate(256)  # 24 words
seed = mnemo.to_seed(words)
master = BIP32Key.fromSeed(seed)
# Derive m/84'/0'/0'/0/0
key = master.ChildKey(84 + 0x80000000).ChildKey(0x80000000).ChildKey(0x80000000).ChildKey(0).ChildKey(0)
```

```cpp
#include <bitcoin/bitcoin.hpp>

bc::wallet::hd_private derive_key(const bc::data_chunk& seed) {
    bc::wallet::hd_private master(seed);
    return master.derive_private(84 + bc::wallet::hd_first_hardened_key)
                 .derive_private(bc::wallet::hd_first_hardened_key)
                 .derive_private(bc::wallet::hd_first_hardened_key)
                 .derive_private(0).derive_private(0);
}
```

```javascript
import { BIP32Factory } from 'bip32';
import * as bip39 from 'bip39';

const mnemonic = bip39.generateMnemonic(256);
const seed = await bip39.mnemonicToSeed(mnemonic);
const root = bip32.fromSeed(seed);
const child = root.derivePath("m/84'/0'/0'/0/0");
```

```go
package main

import (
	"fmt"

	"github.com/tyler-smith/go-bip32"
	"github.com/tyler-smith/go-bip39"
)

func deriveKey(seed []byte) (*bip32.Key, error) {
	master, err := bip32.NewMasterKey(seed)
	if err != nil {
		return nil, err
	}
	
	// Derive m/84'/0'/0'/0/0
	child, err := master.NewChildKey(bip32.FirstHardenedChild + 84)
	if err != nil {
		return nil, err
	}
	child, err = child.NewChildKey(bip32.FirstHardenedChild + 0)
	if err != nil {
		return nil, err
	}
	child, err = child.NewChildKey(bip32.FirstHardenedChild + 0)
	if err != nil {
		return nil, err
	}
	child, err = child.NewChildKey(0)
	if err != nil {
		return nil, err
	}
	child, err = child.NewChildKey(0)
	if err != nil {
		return nil, err
	}
	
	return child, nil
}

func main() {
	mnemonic, _ := bip39.NewMnemonic(bip39.NewEntropy(256))
	seed, _ := bip39.NewSeedWithErrorChecking(mnemonic, "")
	
	key, err := deriveKey(seed)
	if err != nil {
		panic(err)
	}
	
	fmt.Printf("Derived key: %x\n", key.Key)
}
```
:::

---

## Seed Phrases (BIP39)

### Mnemonic Generation and Validation

:::code-group
```rust
use bip39::{Mnemonic, Language};

let mnemonic = Mnemonic::generate_in(Language::English, 24);
let is_valid = Mnemonic::parse(&mnemonic.to_string()).is_ok();
let seed = mnemonic.to_seed("optional_passphrase");
```

```python
from mnemonic import Mnemonic

mnemo = Mnemonic("english")
words = mnemo.generate(256)  # 24 words
is_valid = mnemo.check(words)
seed = mnemo.to_seed(words, passphrase="optional")
```

```cpp
#include <bitcoin/bitcoin.hpp>

auto entropy = bc::data_chunk(32);
bc::pseudo_random_fill(entropy);
auto words = bc::wallet::create_mnemonic(entropy);
bool is_valid = bc::wallet::validate_mnemonic(words);
auto seed = bc::wallet::decode_mnemonic(words);
```

```javascript
import * as bip39 from 'bip39';

const mnemonic = bip39.generateMnemonic(256);
const isValid = bip39.validateMnemonic(mnemonic);
const seed = await bip39.mnemonicToSeed(mnemonic, 'optional_passphrase');
```

```go
package main

import (
	"fmt"

	"github.com/tyler-smith/go-bip39"
)

func main() {
	// Generate mnemonic (128=12 words, 256=24 words)
	entropy, err := bip39.NewEntropy(256)
	if err != nil {
		panic(err)
	}
	
	mnemonic, err := bip39.NewMnemonic(entropy)
	if err != nil {
		panic(err)
	}
	
	// Validate mnemonic
	isValid := bip39.IsMnemonicValid(mnemonic)
	
	// Convert to seed with optional passphrase
	seed, err := bip39.NewSeedWithErrorChecking(mnemonic, "optional_passphrase")
	if err != nil {
		panic(err)
	}
	
	fmt.Printf("Mnemonic: %s\n", mnemonic)
	fmt.Printf("Valid: %v\n", isValid)
	fmt.Printf("Seed: %x\n", seed)
}
```
:::

### Security Considerations

```typescript
// NEVER do this
const badMnemonic = "abandon ".repeat(12).trim(); // Predictable!

// ALWAYS use cryptographically secure random
import { randomBytes } from 'crypto';
const entropy = randomBytes(32); // 256 bits
const secureMnemonic = bip39.entropyToMnemonic(entropy);
```

---

## Derivation Paths

### Standard Paths (BIPs)

| BIP | Path | Purpose | Address Type |
|-----|------|---------|--------------|
| BIP44 | m/44'/0'/0' | Legacy | P2PKH (1...) |
| BIP49 | m/49'/0'/0' | Nested SegWit | P2SH-P2WPKH (3...) |
| BIP84 | m/84'/0'/0' | Native SegWit | P2WPKH (bc1q...) |
| BIP86 | m/86'/0'/0' | Taproot | P2TR (bc1p...) |

### Path Components

```
m / purpose' / coin_type' / account' / change / address_index

m           - Master key
purpose'    - BIP number (44, 49, 84, 86)
coin_type'  - 0 for Bitcoin, 1 for testnet
account'    - Account number (0, 1, 2...)
change      - 0 for receiving, 1 for change
address_index - Sequential index (0, 1, 2...)

' = hardened derivation
```

### Deriving Multiple Address Types

```typescript
import * as bitcoin from 'bitcoinjs-lib';

function deriveAllAddressTypes(root: BIP32Interface) {
  const network = bitcoin.networks.bitcoin;
  
  // BIP44 - Legacy
  const bip44 = root.derivePath("m/44'/0'/0'/0/0");
  const p2pkh = bitcoin.payments.p2pkh({ 
    pubkey: bip44.publicKey, 
    network 
  });
  
  // BIP49 - Nested SegWit
  const bip49 = root.derivePath("m/49'/0'/0'/0/0");
  const p2shp2wpkh = bitcoin.payments.p2sh({
    redeem: bitcoin.payments.p2wpkh({ 
      pubkey: bip49.publicKey, 
      network 
    }),
    network
  });
  
  // BIP84 - Native SegWit
  const bip84 = root.derivePath("m/84'/0'/0'/0/0");
  const p2wpkh = bitcoin.payments.p2wpkh({ 
    pubkey: bip84.publicKey, 
    network 
  });
  
  // BIP86 - Taproot
  const bip86 = root.derivePath("m/86'/0'/0'/0/0");
  const p2tr = bitcoin.payments.p2tr({
    internalPubkey: bip86.publicKey.slice(1, 33),
    network
  });
  
  return {
    legacy: p2pkh.address,
    nestedSegwit: p2shp2wpkh.address,
    nativeSegwit: p2wpkh.address,
    taproot: p2tr.address
  };
}
```

---

## Extended Keys (xpub/xprv)

### Exporting Extended Keys

```typescript
// Export extended private key (KEEP SECRET!)
const xprv = root.toBase58();
// xprv9s21ZrQH143K...

// Export extended public key (safe to share for watch-only)
const xpub = root.neutered().toBase58();
// xpub661MyMwAqRbc...
```

### Version Bytes

| Prefix | Network | Key Type | Address Type |
|--------|---------|----------|--------------|
| xpub/xprv | Mainnet | Standard | P2PKH |
| ypub/yprv | Mainnet | BIP49 | P2SH-P2WPKH |
| zpub/zprv | Mainnet | BIP84 | P2WPKH |
| tpub/tprv | Testnet | Standard | Any |

### Converting Between Formats

```typescript
import bs58check from 'bs58check';

function convertXpubToZpub(xpub: string): string {
  const data = bs58check.decode(xpub);
  // Replace version bytes (first 4 bytes)
  // xpub: 0x0488B21E -> zpub: 0x04B24746
  const zpubVersion = Buffer.from([0x04, 0xB2, 0x47, 0x46]);
  const converted = Buffer.concat([zpubVersion, data.slice(4)]);
  return bs58check.encode(converted);
}
```

---

## Secure Key Storage

### In-Memory Security

```typescript
import { randomBytes } from 'crypto';

class SecureKeyStore {
  private encryptedKey: Buffer | null = null;
  private iv: Buffer | null = null;
  
  async store(privateKey: Buffer, password: string): Promise<void> {
    const crypto = await import('crypto');
    
    // Derive encryption key from password
    const salt = randomBytes(16);
    const key = crypto.scryptSync(password, salt, 32);
    
    // Encrypt private key
    this.iv = randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, this.iv);
    
    this.encryptedKey = Buffer.concat([
      salt,
      cipher.update(privateKey),
      cipher.final(),
      cipher.getAuthTag()
    ]);
    
    // Clear original from memory
    privateKey.fill(0);
  }
  
  async retrieve(password: string): Promise<Buffer> {
    if (!this.encryptedKey || !this.iv) {
      throw new Error('No key stored');
    }
    
    const crypto = await import('crypto');
    const salt = this.encryptedKey.slice(0, 16);
    const key = crypto.scryptSync(password, salt, 32);
    
    const authTag = this.encryptedKey.slice(-16);
    const encrypted = this.encryptedKey.slice(16, -16);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, this.iv);
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
  }
  
  clear(): void {
    if (this.encryptedKey) {
      this.encryptedKey.fill(0);
      this.encryptedKey = null;
    }
    if (this.iv) {
      this.iv.fill(0);
      this.iv = null;
    }
  }
}
```

### Hardware Wallet Integration

```typescript
// Example: Ledger integration concept
interface HardwareWallet {
  getPublicKey(path: string): Promise<Buffer>;
  signTransaction(path: string, txHash: Buffer): Promise<Buffer>;
}

class LedgerWallet implements HardwareWallet {
  async getPublicKey(path: string): Promise<Buffer> {
    // Connect to Ledger and get public key
    // Private key never leaves device
    const transport = await TransportWebUSB.create();
    const btc = new AppBtc({ transport });
    const result = await btc.getWalletPublicKey(path);
    return Buffer.from(result.publicKey, 'hex');
  }
  
  async signTransaction(path: string, txHash: Buffer): Promise<Buffer> {
    // Sign on device - private key stays secure
    const transport = await TransportWebUSB.create();
    const btc = new AppBtc({ transport });
    // ... signing logic
    return signature;
  }
}
```

---

## Multi-Signature Setup

### Creating Multisig Wallet

```typescript
import * as bitcoin from 'bitcoinjs-lib';

interface MultisigConfig {
  m: number;  // Required signatures
  n: number;  // Total keys
  pubkeys: Buffer[];
}

function createMultisigWallet(config: MultisigConfig) {
  const { m, pubkeys } = config;
  
  // Sort pubkeys (BIP67)
  const sortedPubkeys = [...pubkeys].sort((a, b) => a.compare(b));
  
  // Create P2WSH multisig
  const multisig = bitcoin.payments.p2ms({
    m: m,
    pubkeys: sortedPubkeys,
  });
  
  const p2wsh = bitcoin.payments.p2wsh({
    redeem: multisig,
  });
  
  return {
    address: p2wsh.address,
    redeemScript: multisig.output,
    witnessScript: p2wsh.redeem?.output,
  };
}

// Example: 2-of-3 multisig
const wallet = createMultisigWallet({
  m: 2,
  n: 3,
  pubkeys: [pubkey1, pubkey2, pubkey3],
});
```

### Multisig Key Distribution

```
Recommended 2-of-3 Setup:

Key 1: Personal device (phone/computer)
Key 2: Hardware wallet (Coldcard, Ledger, etc.)
Key 3: Secure backup (safety deposit box, trusted party)

Benefits:
- Lose one key? Still have access
- One key compromised? Funds still safe
- No single point of failure
```

---

## Backup Strategies

### Seed Phrase Backup

```
DO:
✓ Write on paper/metal (fire/water resistant)
✓ Store in multiple secure locations
✓ Consider splitting (e.g., 2-of-3 Shamir)
✓ Test recovery before storing funds

DON'T:
✗ Store digitally (photos, cloud, email)
✗ Share with anyone
✗ Store all copies in one location
✗ Use brain wallet (memorized passphrase only)
```

### Shamir's Secret Sharing

```typescript
import * as secrets from 'secrets.js-grempe';

function splitSeed(seed: string, shares: number, threshold: number): string[] {
  // Convert seed to hex
  const seedHex = Buffer.from(seed).toString('hex');
  
  // Split into shares
  const shareArray = secrets.share(seedHex, shares, threshold);
  
  return shareArray;
}

function recoverSeed(shares: string[]): string {
  // Combine shares
  const seedHex = secrets.combine(shares);
  
  return Buffer.from(seedHex, 'hex').toString();
}

// Example: 2-of-3 split
const shares = splitSeed(mnemonic, 3, 2);
// Give shares[0] to location A
// Give shares[1] to location B  
// Give shares[2] to location C
// Any 2 shares can recover the seed
```

---

## Security Best Practices

### Key Generation

```typescript
// SECURE: Use crypto.getRandomValues or crypto.randomBytes
import { randomBytes } from 'crypto';
const entropy = randomBytes(32);

// INSECURE: Never use Math.random()
const badEntropy = Math.random(); // NEVER DO THIS

// INSECURE: Never use predictable data
const predictable = Date.now(); // NEVER DO THIS
```

### Memory Handling

```typescript
function secureSign(privateKey: Buffer, message: Buffer): Buffer {
  try {
    // Sign the message
    const signature = secp256k1.sign(message, privateKey);
    return signature;
  } finally {
    // Always clear sensitive data
    privateKey.fill(0);
  }
}
```

### Environment Security

```typescript
// Check for common security issues
function securityCheck(): string[] {
  const warnings: string[] = [];
  
  // Check if running in browser
  if (typeof window !== 'undefined') {
    warnings.push('Browser environment - keys may be exposed to extensions');
  }
  
  // Check for debugger
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    warnings.push('Development mode - ensure production security');
  }
  
  return warnings;
}
```

---

## Recovery Procedures

### From Mnemonic

```typescript
async function recoverWallet(mnemonic: string, passphrase = ''): Promise<WalletData> {
  // Validate mnemonic
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic');
  }
  
  // Generate seed
  const seed = await bip39.mnemonicToSeed(mnemonic, passphrase);
  const root = bip32.fromSeed(seed);
  
  // Derive standard paths
  const addresses = {
    bip44: deriveAddresses(root, "m/44'/0'/0'"),
    bip49: deriveAddresses(root, "m/49'/0'/0'"),
    bip84: deriveAddresses(root, "m/84'/0'/0'"),
    bip86: deriveAddresses(root, "m/86'/0'/0'"),
  };
  
  return { root, addresses };
}

function deriveAddresses(root: BIP32Interface, basePath: string, count = 20) {
  const addresses = [];
  for (let i = 0; i < count; i++) {
    const child = root.derivePath(`${basePath}/0/${i}`);
    addresses.push(deriveAddress(child));
  }
  return addresses;
}
```

### Gap Limit Scanning

```typescript
async function scanForUsedAddresses(
  xpub: string,
  gapLimit = 20
): Promise<string[]> {
  const root = bip32.fromBase58(xpub);
  const usedAddresses: string[] = [];
  let consecutiveUnused = 0;
  let index = 0;
  
  while (consecutiveUnused < gapLimit) {
    const child = root.derivePath(`0/${index}`);
    const address = deriveAddress(child);
    
    const hasHistory = await checkAddressHistory(address);
    
    if (hasHistory) {
      usedAddresses.push(address);
      consecutiveUnused = 0;
    } else {
      consecutiveUnused++;
    }
    
    index++;
  }
  
  return usedAddresses;
}
```

---

## Summary

Secure key management requires:

- **HD Wallets**: Use BIP32/39/44/49/84/86 standards
- **Secure Generation**: Cryptographically secure randomness
- **Proper Storage**: Encrypted storage, hardware wallets
- **Backup Strategy**: Multiple secure backups
- **Recovery Testing**: Test recovery before storing significant funds

Never expose private keys, use hardware wallets for significant amounts, and always have tested backup procedures.

---

## Related Topics

- [Address Generation](/docs/bitcoin-development/addresses) - Creating addresses from keys
- [HD Wallets](/docs/wallets/hd-wallets) - Hierarchical deterministic wallet concepts
- [Multisig](/docs/wallets/multisig) - Multi-signature security setups
- [Cryptography](/docs/bitcoin/cryptography) - Underlying cryptographic primitives
