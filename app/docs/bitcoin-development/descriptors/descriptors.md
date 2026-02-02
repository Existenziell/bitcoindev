# Output Descriptors

Output descriptors (BIP 380, BIP 386) are a standardized, human-readable way to describe which output scripts and [addresses](/docs/bitcoin-development/addresses) a wallet can generate. They encode script type, [keys](/docs/bitcoin-development/keys), and derivation paths in a single string, so wallets can interoperate, export watch-only setups, and back up "what to derive" without ambiguity. This guide covers descriptor syntax, common script expressions, key expressions, and how to use them in code. For policies that compile to Script, see [Miniscript](/docs/bitcoin-development/miniscript).

## What Descriptors Solve

Traditional backups (e.g. BIP 39 [mnemonic](/docs/wallets/hd-wallets)) describe *keys* but not *which script types or paths* to use. After [SegWit](/docs/bitcoin/segwit) and [Taproot](/docs/bitcoin/taproot), "restore from seed" could mean P2PKH, P2WPKH, P2TR, or custom scripts. Descriptors make this explicit: one string describes the script type and key derivation, so different software can derive the same addresses.

## Descriptor Structure

A descriptor typically has:

1. **Script expression**: e.g. `wpkh`, `wsh`, `tr`, `sh(wpkh(...))`
2. **Key expression**: e.g. xpub with derivation path
3. **Optional checksum**: 8 characters after `#` for error detection

Example (BIP 84 single-sig):

```text
wpkh([d34db33f/84h/0h/0h]xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVJrZwQY4VUNgqFJPMM3No2dFDFGTsxxpG5uJk7yd2j1uGcfFG9CP3Xk41B5kkEWpa/0/*)#checksum
```

## Common Script Expressions

| Expression | Meaning |
|------------|--------|
| `pk(key)` | Pay to raw public key |
| `pkh(key)` | Pay to public key hash (P2PKH) |
| `wpkh(key)` | Pay to witness public key hash (P2WPKH) |
| `sh(script)` | Pay to script hash (P2SH); inner script can be `wpkh`, `wsh`, etc. |
| `wsh(script)` | Pay to witness script hash (P2WSH) |
| `tr(key)` or `tr(key, tree)` | [Taproot](/docs/bitcoin/taproot) output (key or key + script tree) |
| `multi(n, key1, key2, ...)` | M-of-N multisig (inside `sh` or `wsh`) |

Key expressions can be: raw pubkey, xpub/xprv with path (e.g. `/0/*` for receive, `/1/*` for change), or a descriptor (for nested `sh(wsh(...))`).

## Key Expressions and Derivation

- **xpub / xprv**: BIP 32 extended key; path like `[fingerprint/84h/0h/0h]xpub.../0/*` means receive addresses, `/1/*` means change.
- **Origin**: The part in `[]` (e.g. `[d34db33f/84h/0h/0h]`) is the key origin; optional but recommended for [PSBT](/docs/bitcoin-development/psbt) and hardware wallets.
- **Checksum**: Append `#` plus 8-character checksum so typos can be detected; Bitcoin Core's `getdescriptorinfo` adds it.

## Parsing and Validating Descriptors

:::code-group
```rust
// Using bdk or rust-bitcoin descriptor support
use bdk::descriptor::Descriptor;
use std::str::FromStr;

fn parse_descriptor(desc: &str) -> Result<Descriptor<bdk::KeyMap>, Box<dyn std::error::Error>> {
    let (desc_with_checksum, _) = bdk::descriptor::Descriptor::parse_with_checksum(desc)?;
    Ok(desc_with_checksum)
}

fn main() {
    let desc = "wpkh([0f056943/84h/0h/0h]xpub6CaWStGvcXqM8BH3.../0/*)#l07d6h6y";
    match parse_descriptor(desc) {
        Ok(d) => println!("Descriptor valid: {:?}", d),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

```python
# python-bitcoinlib or bdk (Python bindings) can parse descriptors.
# Example: validate and get addresses using Bitcoin Core RPC.

import subprocess
import json

def get_descriptor_info(desc: str) -> dict:
    """Call getdescriptorinfo; returns descriptor with checksum and other info."""
    out = subprocess.run(
        ["bitcoin-cli", "getdescriptorinfo", desc],
        capture_output=True,
        text=True,
    )
    return json.loads(out.stdout)

def derive_addresses(desc: str, range_start: int, range_end: int) -> list:
    """Call deriveaddresses with descriptor and index range."""
    out = subprocess.run(
        ["bitcoin-cli", "deriveaddresses", f"{desc}", f"[{range_start},{range_end}]"],
        capture_output=True,
        text=True,
    )
    return json.loads(out.stdout)
```

```cpp
// Bitcoin Core: use the descriptor module (src/script/descriptor.h)
#include <script/descriptor.h>
#include <string>

bool parse_descriptor(const std::string& desc_str, FlatSigningProvider& out_provider) {
    std::string error;
    auto desc = Parse(desc_str, out_provider, error);
    return desc != nullptr;
}
```

```go
package main

import (
	"fmt"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcwallet/wallet/internal/legacy/keystore"
)

// btcd/btcwallet have limited descriptor support; often you call Bitcoin Core RPC.
func getDescriptorInfo(rpc *RPCClient, desc string) (string, error) {
	var result struct {
		Descriptor string `json:"descriptor"`
	}
	err := rpc.Call("getdescriptorinfo", []string{desc}, &result)
	return result.Descriptor, err
}

func deriveAddresses(rpc *RPCClient, desc string, start, end int) ([]string, error) {
	var addrs []string
	err := rpc.Call("deriveaddresses", []interface{}{desc, []int{start, end}}, &addrs)
	return addrs, err
}
```

```javascript
// Node: call Bitcoin Core RPC or use a library that parses descriptors.
const BitcoinCore = require('bitcoin-core');

async function getDescriptorInfo(client, desc) {
  const result = await client.command('getdescriptorinfo', desc);
  return result.descriptor; // includes checksum
}

async function deriveAddresses(client, desc, start, end) {
  return client.command('deriveaddresses', desc, [start, end]);
}
```
:::

## Deriving Addresses from a Descriptor

Bitcoin Core RPCs: `getdescriptorinfo` (validate and add checksum), `deriveaddresses` (derive addresses for an index range), `importdescriptors` (import watch-only or with keys). Other libraries (e.g. BDK, rust-bitcoin with descriptor support) derive addresses locally.

:::code-group
```rust
use bdk::descriptor::Descriptor;
use bdk::KeyMap;
use std::str::FromStr;

fn derive_receive_address(desc_str: &str, index: u32) -> Result<String, Box<dyn std::error::Error>> {
    let (desc, _) = Descriptor::parse_with_checksum(desc_str)?;
    let mut key_map = KeyMap::default();
    let address = desc.at_derivation_index(index)?.address(bdk::bitcoin::Network::Bitcoin)?;
    Ok(address.to_string())
}
```

```python
# Using Bitcoin Core
def derive_receive_address(rpc, desc: str, index: int) -> str:
    addrs = rpc.deriveaddresses(desc, [index, index + 1])
    return addrs[0]
```

```cpp
// After parsing descriptor, use Descriptor::Expand() with index and key provider
// to get scriptPubKey, then convert to address (see Bitcoin Core wallet code).
```

```go
func deriveReceiveAddress(rpc *RPCClient, desc string, index int) (string, error) {
	addrs, err := deriveAddresses(rpc, desc, index, index+1)
	if err != nil || len(addrs) == 0 {
		return "", err
	}
	return addrs[0], nil
}
```

```javascript
async function deriveReceiveAddress(client, desc, index) {
  const addrs = await deriveAddresses(client, desc, index, index + 1);
  return addrs[0];
}
```
:::

## Use Cases

- **Watch-only wallets**: Export an xpub descriptor (no private keys); another app can derive addresses and watch the blockchain. See [Blockchain Monitoring](/docs/bitcoin-development/blockchain-monitoring).
- **Backup and restore**: One descriptor string (with origin and path) tells any compatible wallet which script type and derivation to use.
- **Hardware wallet interoperability**: Devices like COLDCARD export descriptors; software imports them for receive/change addresses and [PSBT](/docs/bitcoin-development/psbt) signing.
- **Scanning**: Bitcoin Core's `scantxoutset` accepts a descriptor to find UTXOs that match, without importing keys.

## Relation to Miniscript

[Miniscript](/docs/bitcoin-development/miniscript) compiles policies to Script; the result is often wrapped in a descriptor (e.g. `wsh(miniscript_expression)` or Taproot). So: policy → Miniscript → Script → descriptor. Descriptors can also contain raw script (e.g. `raw(...)` in Core) or Miniscript fragments.

## Related Topics

- [Key Management](/docs/bitcoin-development/keys) - HD keys and derivation paths
- [Address Generation](/docs/bitcoin-development/addresses) - Address types and encoding
- [Miniscript](/docs/bitcoin-development/miniscript) - Policy to script and descriptors
- [PSBT](/docs/bitcoin-development/psbt) - Descriptors in PSBT global map and inputs

## Resources

- [BIP 380](https://github.com/bitcoin/bips/blob/master/bip-0380.mediawiki) - Output Script Descriptors
- [BIP 386](https://github.com/bitcoin/bips/blob/master/bip-0386.mediawiki) - Miniscript within descriptors
- [Bitcoin Core descriptors](https://github.com/bitcoin/bitcoin/blob/master/doc/descriptors.md) - Implementation notes
