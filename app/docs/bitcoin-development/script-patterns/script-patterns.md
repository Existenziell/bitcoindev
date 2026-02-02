# Bitcoin Script Patterns

[Bitcoin Script](/docs/bitcoin/script) defines spending conditions in locking scripts; [Smart Contracts & Advanced Scripting](/docs/wallets/smart-contracts) describes how those conditions act as contracts. The patterns here are reusable templates you can turn into scriptPubKeys and use in [address generation](/docs/bitcoin-development/addresses) and [transaction construction](/docs/bitcoin-development/transactions). You can build and experiment with them in [Stack Lab](/stack-lab). For a policy language that compiles to Script, see [Miniscript](/docs/bitcoin-development/miniscript).

## Common Patterns

### 1. Pay-to-Pubkey-Hash (P2PKH)

Standard single-signature:

```text
ScriptPubKey:
OP_DUP OP_HASH160 <pubkey_hash> OP_EQUALVERIFY OP_CHECKSIG

ScriptSig:
<signature> <pubkey>
```

### 2. Multisig

Multiple signatures required:

```text
ScriptPubKey:
<M> <pubkey1> <pubkey2> ... <pubkeyN> <N> OP_CHECKMULTISIG

ScriptSig:
OP_0 <sig1> <sig2> ... <sigM>
```

### 3. Hash Lock

Reveal secret to spend:

```text
ScriptPubKey:
OP_HASH256 <hash> OP_EQUAL

ScriptSig:
<secret>
```

### 4. Time Lock

Absolute timelock:

```text
ScriptPubKey:
<locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP <pubkey> OP_CHECKSIG

ScriptSig:
<signature>
```

### 5. Relative Time Lock

Relative timelock:

```text
ScriptPubKey:
<blocks> OP_CHECKSEQUENCEVERIFY OP_DROP <pubkey> OP_CHECKSIG

ScriptSig:
<signature>
```

---

## Advanced Patterns

### Escrow Contract

Three-party escrow:

```text
2-of-3 Multisig:
- Buyer + Seller
- Buyer + Escrow
- Seller + Escrow
```

### Vault Contract

Time-delayed recovery:

```text
Structure:
- Hot key: Immediate spend (small)
- Cold key: Delayed spend (large)
- Recovery: Longer delay
```

### Inheritance Contract

Time-locked beneficiary:

```text
Structure:
- Beneficiary key
- Time lock (absolute)
- Can claim after date
```

---

## Code Examples

### Creating Common Patterns

:::code-group
```rust
use bitcoin::{Script, ScriptBuf};
use bitcoin::opcodes::all::*;

// P2PKH
fn create_p2pkh_script(pubkey_hash: &[u8; 20]) -> ScriptBuf {
    let mut script = ScriptBuf::new();
    script.push_opcode(OP_DUP);
    script.push_opcode(OP_HASH160);
    script.push_slice(pubkey_hash);
    script.push_opcode(OP_EQUALVERIFY);
    script.push_opcode(OP_CHECKSIG);
    script
}

// Hash Lock
fn create_hash_lock_script(hash: &[u8; 32]) -> ScriptBuf {
    let mut script = ScriptBuf::new();
    script.push_opcode(OP_HASH256);
    script.push_slice(hash);
    script.push_opcode(OP_EQUAL);
    script
}
```

```python
from bitcoin.core.script import CScript, OP_DUP, OP_HASH160, OP_EQUALVERIFY, OP_CHECKSIG
from bitcoin.core.script import OP_HASH256, OP_EQUAL

# P2PKH
def create_p2pkh_script(pubkey_hash):
    return CScript([
        OP_DUP,
        OP_HASH160,
        pubkey_hash,
        OP_EQUALVERIFY,
        OP_CHECKSIG,
    ])

# Hash Lock
def create_hash_lock_script(hash_value):
    return CScript([
        OP_HASH256,
        hash_value,
        OP_EQUAL,
    ])
```

```cpp
#include <bitcoin/bitcoin.hpp>

// P2PKH
bc::script create_p2pkh_script(const bc::short_hash& pubkey_hash) {
    bc::script script;
    script.push_operation(bc::opcode::dup);
    script.push_operation(bc::opcode::hash160);
    script.push_data(bc::to_chunk(pubkey_hash));
    script.push_operation(bc::opcode::equalverify);
    script.push_operation(bc::opcode::checksig);
    return script;
}

// Hash Lock
bc::script create_hash_lock_script(const bc::hash_digest& hash) {
    bc::script script;
    script.push_operation(bc::opcode::hash256);
    script.push_data(bc::to_chunk(hash));
    script.push_operation(bc::opcode::equal);
    return script;
}
```

```go
package main

import (
	"github.com/btcsuite/btcd/txscript"
)

// P2PKH
func createP2PKHScript(pubkeyHash []byte) ([]byte, error) {
	builder := txscript.NewScriptBuilder()
	builder.AddOp(txscript.OP_DUP)
	builder.AddOp(txscript.OP_HASH160)
	builder.AddData(pubkeyHash)
	builder.AddOp(txscript.OP_EQUALVERIFY)
	builder.AddOp(txscript.OP_CHECKSIG)
	return builder.Script()
}

// Hash Lock
func createHashLockScript(hash []byte) ([]byte, error) {
	builder := txscript.NewScriptBuilder()
	builder.AddOp(txscript.OP_HASH256)
	builder.AddData(hash)
	builder.AddOp(txscript.OP_EQUAL)
	return builder.Script()
}
```

```javascript
const bitcoin = require('bitcoinjs-lib');

// P2PKH
function createP2PKHScript(pubkeyHash) {
    return bitcoin.script.compile([
        bitcoin.opcodes.OP_DUP,
        bitcoin.opcodes.OP_HASH160,
        pubkeyHash,
        bitcoin.opcodes.OP_EQUALVERIFY,
        bitcoin.opcodes.OP_CHECKSIG,
    ]);
}

// Hash Lock
function createHashLockScript(hash) {
    return bitcoin.script.compile([
        bitcoin.opcodes.OP_HASH256,
        hash,
        bitcoin.opcodes.OP_EQUAL,
    ]);
}
```
:::

---

## Miniscript

[Miniscript](/docs/bitcoin-development/miniscript) is a structured language for expressing spending *policies* that compiles to [Bitcoin Script](/docs/bitcoin/script). Instead of writing raw [OP codes](/docs/bitcoin/op-codes) directly, you define *what* must hold (e.g., "2-of-3 keys" or "key A and after block N") and tools produce correct, analyzable Script.

### Policy vs. Script

- **Policy**: High-level conditions (e.g., `2 of [pk(A), pk(B), pk(C)]` or `and(pk(A), after(100))`).
- **Script**: The actual bytecode that nodes execute; Miniscript compiles policy → Script.

### Fragments and Composition

Miniscript uses composable **fragments** (`pk`, `thresh`, `and`, `or`, `after`, `older`, `hash`, `multi`, etc.) that map to Script. This makes it easier to:

- Combine conditions (AND, OR, m-of-n) without hand-rolled scriptSig/witness.
- Analyze **correctness** and **safety** (no unintended spends, no dust).
- Estimate **satisfaction size** (witness size, number of [signatures](/docs/bitcoin/cryptography)).

### When to Use Miniscript

- **Wallets**: Multisig, [timelocks](/docs/bitcoin/timelocks), and recovery policies.
- **Contracts**: [Vaults](/docs/wallets/smart-contracts), [Atomic Swaps](/docs/advanced/atomic-swaps)-style hashlocks, and [Taproot](/docs/bitcoin/taproot) script trees.
- **Protocols**: [Lightning](/docs/lightning), [DLCs](/docs/advanced/dlcs), and other [smart contract](/docs/wallets/smart-contracts) templates.

See [Miniscript](/docs/bitcoin-development/miniscript) for the full specification, fragment set, and Tapscript support.

---

## Best Practices

### For Developers

1. **Use established patterns**: Don't reinvent
2. **Prefer Miniscript for complex policies**: Compile from policy when possible
3. **Test thoroughly**: Script bugs are costly
4. **Consider Taproot**: Better privacy and efficiency
5. **Document patterns**: Explain what contracts do

---

## Related Topics

- [Bitcoin Script](/docs/bitcoin/script) - Script system
- [OP Codes](/docs/bitcoin/op-codes) - Available operations
- [Miniscript](/docs/bitcoin-development/miniscript) - Policy-to-script compiler
- [Smart Contracts](/docs/wallets/smart-contracts) - Contract patterns

---

## Resources

- [Bitcoin Script Patterns](https://en.bitcoin.it/wiki/Script)
- [Miniscript](https://bitcoin.sipa.be/miniscript/) - Playground and reference
