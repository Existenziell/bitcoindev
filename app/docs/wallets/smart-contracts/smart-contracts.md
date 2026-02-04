# Smart Contracts & Advanced Scripting

Bitcoin Script enables smart contracts through conditional spending. While intentionally limited (no loops, no complex state), Bitcoin's scripting system supports powerful contract patterns.

Bitcoin smart contracts are **spending conditions** encoded in Script:

```text
Smart Contract = Locking Script + Unlocking Script

Locking Script: Defines conditions
Unlocking Script: Proves conditions are met
```

See this in action in [Stack Lab](/interactive-tools/stack-lab).

Unlike Ethereum, Bitcoin contracts are:
- **Stateless**: No persistent contract state
- **Deterministic**: Same inputs = same result
- **Limited**: No loops, no external data
- **Secure**: Simpler = fewer vulnerabilities

---

## Common Contract Patterns

### 1. Multisig

Multiple signatures required:

```text
2-of-3 Multisig:
- Requires 2 of 3 keys to sign
- More secure than single key
- Common for shared custody
```

### 2. Timelocks

Time-based conditions:

```text
Escrow Contract:
- Funds locked until date
- Can't be spent before
- Useful for inheritance, vesting
```

### 3. Hash Locks

Reveal secret to spend:

```text
Hash Lock:
- Locked to hash of secret
- Reveal secret to unlock
- Used in atomic swaps, Lightning
```

### 4. Escrow

Three-party contracts:

```text
Escrow:
- Buyer sends funds
- Seller provides goods
- Escrow releases funds
- Dispute resolution possible
```

---

## Code Examples

### Creating a Multisig Contract

:::code-group
```rust
use bitcoin::{Script, ScriptBuf};
use bitcoin::opcodes::all::*;

fn create_multisig_script(
    pubkeys: &[[u8; 33]; 3],
    threshold: u8,
) -> ScriptBuf {
    let mut script = ScriptBuf::new();
    script.push_int(threshold as i64);
    for pubkey in pubkeys {
        script.push_slice(pubkey);
    }
    script.push_int(pubkeys.len() as i64);
    script.push_opcode(OP_CHECKMULTISIG);
    script
}
```

```python
from bitcoin.core.script import CScript, OP_CHECKMULTISIG

def create_multisig_script(pubkeys, threshold):
    """Create multisig script."""
    return CScript([
        threshold,
        *pubkeys,
        len(pubkeys),
        OP_CHECKMULTISIG,
    ])
```

```cpp
#include <bitcoin/bitcoin.hpp>

bc::script create_multisig_script(
    const std::vector<bc::ec_compressed>& pubkeys,
    uint8_t threshold
) {
    bc::script script;
    script.push_operation(bc::opcode(threshold));
    for (const auto& pubkey : pubkeys) {
        script.push_data(bc::to_chunk(pubkey));
    }
    script.push_operation(bc::opcode(pubkeys.size()));
    script.push_operation(bc::opcode::checkmultisig);
    return script;
}
```

```go
package main

import (
	"github.com/btcsuite/btcd/txscript"
)

func createMultisigScript(pubkeys [][]byte, threshold int) ([]byte, error) {
	builder := txscript.NewScriptBuilder()
	builder.AddInt64(int64(threshold))
	for _, pubkey := range pubkeys {
		builder.AddData(pubkey)
	}
	builder.AddInt64(int64(len(pubkeys)))
	builder.AddOp(txscript.OP_CHECKMULTISIG)
	return builder.Script()
}
```

```javascript
const bitcoin = require('bitcoinjs-lib');

function createMultisigScript(pubkeys, threshold) {
    return bitcoin.script.multisig.output.encode(threshold, pubkeys);
}
```
:::

### Creating an Escrow Contract

:::code-group
```rust
use bitcoin::{Script, ScriptBuf};
use bitcoin::opcodes::all::*;

fn create_escrow_script(
    buyer_pubkey: &[u8; 33],
    seller_pubkey: &[u8; 33],
    escrow_pubkey: &[u8; 33],
) -> ScriptBuf {
    let mut script = ScriptBuf::new();
    // 2-of-3 multisig: buyer + seller, or buyer + escrow, or seller + escrow
    script.push_int(2);
    script.push_slice(buyer_pubkey);
    script.push_slice(seller_pubkey);
    script.push_slice(escrow_pubkey);
    script.push_int(3);
    script.push_opcode(OP_CHECKMULTISIG);
    script
}
```

```python
from bitcoin.core.script import CScript, OP_CHECKMULTISIG

def create_escrow_script(buyer_pubkey, seller_pubkey, escrow_pubkey):
    """Create escrow contract script."""
    return CScript([
        2,  # 2-of-3
        buyer_pubkey,
        seller_pubkey,
        escrow_pubkey,
        3,
        OP_CHECKMULTISIG,
    ])
```

```cpp
#include <bitcoin/bitcoin.hpp>

bc::script create_escrow_script(
    const bc::ec_compressed& buyer_pubkey,
    const bc::ec_compressed& seller_pubkey,
    const bc::ec_compressed& escrow_pubkey
) {
    bc::script script;
    script.push_operation(bc::opcode(2)); // 2-of-3
    script.push_data(bc::to_chunk(buyer_pubkey));
    script.push_data(bc::to_chunk(seller_pubkey));
    script.push_data(bc::to_chunk(escrow_pubkey));
    script.push_operation(bc::opcode(3));
    script.push_operation(bc::opcode::checkmultisig);
    return script;
}
```

```go
package main

import (
	"github.com/btcsuite/btcd/txscript"
)

func createEscrowScript(buyerPubkey, sellerPubkey, escrowPubkey []byte) ([]byte, error) {
	builder := txscript.NewScriptBuilder()
	builder.AddInt64(2) // 2-of-3
	builder.AddData(buyerPubkey)
	builder.AddData(sellerPubkey)
	builder.AddData(escrowPubkey)
	builder.AddInt64(3)
	builder.AddOp(txscript.OP_CHECKMULTISIG)
	return builder.Script()
}
```

```javascript
const bitcoin = require('bitcoinjs-lib');

function createEscrowScript(buyerPubkey, sellerPubkey, escrowPubkey) {
    return bitcoin.script.multisig.output.encode(2, [
        buyerPubkey,
        sellerPubkey,
        escrowPubkey,
    ]);
}
```
:::

---

## Advanced Patterns

### Vault Contracts

Time-delayed recovery:

```text
Vault Structure:
1. Hot key: Can spend immediately (small amount)
2. Cold key: Can spend after delay (large amount)
3. Recovery key: Can spend after longer delay

Use case: Theft protection
```

### Inheritance Contracts

Gradual fund release:

```text
Inheritance:
- Beneficiary can claim after date
- Multiple beneficiaries possible
- Time-locked release
```

### Atomic Swaps

Cross-chain exchanges:

```text
Atomic Swap:
1. Lock funds with hash lock
2. Reveal secret to claim
3. Either both succeed or both fail
```

---

## Taproot Contracts

Taproot enables better contracts:

```text
Benefits:
- Privacy: Complex contracts look like simple payments
- Efficiency: Smaller transaction sizes
- Flexibility: MAST hides unused conditions
```

---

## Miniscript

[Miniscript](/docs/bitcoin-development/miniscript) is a structured language for expressing spending *policies* that compiles to [Bitcoin Script](/docs/bitcoin/script). You describe *what* must hold (e.g., 2-of-3 keys, or "key A and after block N") and tools produce correct, analyzable Script. This simplifies multisig, [timelocks](/docs/bitcoin/timelocks), vaults, and [Taproot](/docs/bitcoin/taproot) script trees. See [Miniscript](/docs/bitcoin-development/miniscript) for the full specification and use in wallets and protocols.

---

## Covenants (Proposed)

[Covenants](/docs/advanced/covenants) are a *proposed* type of contract that would restrict how outputs can be spent in *future* [transactions](/docs/bitcoin/transaction-lifecycle), for example, "this UTXO may only be spent to addresses of type X" or "funds must pass through a timelocked recovery path." Proposals such as **OP_CAT**, **OP_CTV** (CheckTemplateVerify), and **SIGHASH_ANYPREVOUT** aim to enable covenant-like behavior. None are in consensus today; see [Covenants](/docs/advanced/covenants) for the design space and BIPs.

---

## Limitations

### What Bitcoin Can't Do

1. **Complex state**: No persistent contract state
2. **Loops**: No iterative operations
3. **External data**: No oracles (without DLCs)
4. **Turing-complete**: Intentionally limited

### Why Limitations Exist

- **Security**: Simpler = fewer bugs
- **DoS prevention**: No infinite loops
- **Determinism**: Predictable execution
- **Decentralization**: Easy to validate

---

## Best Practices

### For Developers

1. **Use established patterns**: Don't reinvent the wheel
2. **Test thoroughly**: Script bugs are costly
3. **Consider Taproot**: Better privacy and efficiency
4. **Document contracts**: Explain conditions clearly

### For Users

1. **Understand conditions**: Know when funds can be spent
2. **Test on testnet**: Verify contracts work
3. **Use reputable services**: Escrow, etc.
4. **Backup keys**: Multisig requires key management

---

## Related Topics

- [Bitcoin Script](/docs/bitcoin/script) - Script system
- [OP Codes](/docs/bitcoin/op-codes) - Available operations
- [Miniscript](/docs/bitcoin-development/miniscript) - Policy-to-script compiler
- [Covenants](/docs/advanced/covenants) - Proposed output-spend constraints
- [Timelocks](/docs/bitcoin/timelocks) - Time-based conditions
- [Multisig](/docs/wallets/multisig) - Multi-signature wallets
- [Atomic Swaps](/docs/advanced/atomic-swaps) - Cross-chain contracts

---

## Resources

- [Bitcoin Script Patterns](https://en.bitcoin.it/wiki/Script)
- [Miniscript](https://bitcoin.sipa.be/miniscript/) - Policy to script compiler
