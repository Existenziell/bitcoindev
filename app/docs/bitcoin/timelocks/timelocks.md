# Timelocks

Timelocks prevent Bitcoin from being spent until certain time conditions are met. Bitcoin supports two types of timelocks: absolute (CLTV) and relative (CSV).

## Types of Timelocks

### Absolute Timelocks (CLTV)

**CheckLockTimeVerify (CLTV)** prevents spending until a specific block height or Unix timestamp:

```text
Example:
"Can't spend until block 800,000"
"Can't spend until January 1, 2025"
```

### Relative Timelocks (CSV)

**CheckSequenceVerify (CSV)** prevents spending until a certain time has passed since the UTXO was created:

```text
Example:
"Can't spend until 1000 blocks after this UTXO was confirmed"
"Can't spend until 2 weeks after creation"
```

---

## Use Cases

### Escrow

Hold funds until a dispute period expires:

```text
Escrow Contract:
1. Funds locked with timelock
2. Dispute period: 30 days
3. After 30 days, funds can be released
```

### Inheritance

Time-delayed access to funds:

```text
Inheritance Scheme:
1. Funds locked until specific date
2. Beneficiary can claim after date
3. Prevents immediate access
```

### Lightning Network

HTLCs use timelocks for payment routing:

```text
HTLC Timelock:
1. Payment locked with hash
2. Timelock prevents indefinite locking
3. Refund if not claimed in time
```

### Vesting

Gradual release of funds:

```text
Vesting Schedule:
- 25% after 1 year
- 25% after 2 years
- 50% after 3 years
```

---

## Code Examples

### Creating CLTV Timelock

:::code-group
```rust
use bitcoin::{Script, ScriptBuf};
use bitcoin::opcodes::all::*;
use bitcoin::locktime::absolute::LockTime;

fn create_cltv_script(locktime: LockTime, pubkey_hash: &[u8; 20]) -> ScriptBuf {
    let mut script = ScriptBuf::new();
    script.push_slice(locktime.to_consensus_u32().to_le_bytes());
    script.push_opcode(OP_CHECKLOCKTIMEVERIFY);
    script.push_opcode(OP_DROP);
    script.push_slice(pubkey_hash);
    script.push_opcode(OP_CHECKSIG);
    script
}
```

```python
from bitcoin.core.script import CScript, OP_CHECKLOCKTIMEVERIFY, OP_DROP, OP_CHECKSIG

def create_cltv_script(locktime, pubkey_hash):
    """Create CLTV timelock script."""
    return CScript([
        locktime,  # Block height or timestamp
        OP_CHECKLOCKTIMEVERIFY,
        OP_DROP,
        pubkey_hash,
        OP_CHECKSIG,
    ])
```

```cpp
#include <bitcoin/bitcoin.hpp>

bc::script create_cltv_script(
    uint32_t locktime,
    const bc::short_hash& pubkey_hash
) {
    bc::script script;
    script.push_data(bc::to_chunk(locktime));
    script.push_operation(bc::opcode::checklocktimeverify);
    script.push_operation(bc::opcode::drop);
    script.push_data(bc::to_chunk(pubkey_hash));
    script.push_operation(bc::opcode::checksig);
    return script;
}
```

```go
package main

import (
	"github.com/btcsuite/btcd/txscript"
)

func createCLTVScript(locktime uint32, pubkeyHash []byte) ([]byte, error) {
	builder := txscript.NewScriptBuilder()
	builder.AddInt64(int64(locktime))
	builder.AddOp(txscript.OP_CHECKLOCKTIMEVERIFY)
	builder.AddOp(txscript.OP_DROP)
	builder.AddData(pubkeyHash)
	builder.AddOp(txscript.OP_CHECKSIG)
	return builder.Script()
}
```

```javascript
const bitcoin = require('bitcoinjs-lib');

function createCLTVScript(locktime, pubkeyHash) {
    return bitcoin.script.compile([
        bitcoin.script.number.encode(locktime),
        bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
        bitcoin.opcodes.OP_DROP,
        pubkeyHash,
        bitcoin.opcodes.OP_CHECKSIG,
    ]);
}
```
:::

### Creating CSV Timelock

:::code-group
```rust
use bitcoin::{Script, ScriptBuf};
use bitcoin::opcodes::all::*;

fn create_csv_script(relative_blocks: u32, pubkey_hash: &[u8; 20]) -> ScriptBuf {
    let mut script = ScriptBuf::new();
    script.push_slice(relative_blocks.to_le_bytes());
    script.push_opcode(OP_CHECKSEQUENCEVERIFY);
    script.push_opcode(OP_DROP);
    script.push_slice(pubkey_hash);
    script.push_opcode(OP_CHECKSIG);
    script
}
```

```python
from bitcoin.core.script import CScript, OP_CHECKSEQUENCEVERIFY, OP_DROP, OP_CHECKSIG

def create_csv_script(relative_blocks, pubkey_hash):
    """Create CSV relative timelock script."""
    return CScript([
        relative_blocks,  # Blocks to wait
        OP_CHECKSEQUENCEVERIFY,
        OP_DROP,
        pubkey_hash,
        OP_CHECKSIG,
    ])
```

```cpp
#include <bitcoin/bitcoin.hpp>

bc::script create_csv_script(
    uint32_t relative_blocks,
    const bc::short_hash& pubkey_hash
) {
    bc::script script;
    script.push_data(bc::to_chunk(relative_blocks));
    script.push_operation(bc::opcode::checksequenceverify);
    script.push_operation(bc::opcode::drop);
    script.push_data(bc::to_chunk(pubkey_hash));
    script.push_operation(bc::opcode::checksig);
    return script;
}
```

```go
package main

import (
	"github.com/btcsuite/btcd/txscript"
)

func createCSVScript(relativeBlocks uint32, pubkeyHash []byte) ([]byte, error) {
	builder := txscript.NewScriptBuilder()
	builder.AddInt64(int64(relativeBlocks))
	builder.AddOp(txscript.OP_CHECKSEQUENCEVERIFY)
	builder.AddOp(txscript.OP_DROP)
	builder.AddData(pubkeyHash)
	builder.AddOp(txscript.OP_CHECKSIG)
	return builder.Script()
}
```

```javascript
const bitcoin = require('bitcoinjs-lib');

function createCSVScript(relativeBlocks, pubkeyHash) {
    return bitcoin.script.compile([
        bitcoin.script.number.encode(relativeBlocks),
        bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
        bitcoin.opcodes.OP_DROP,
        pubkeyHash,
        bitcoin.opcodes.OP_CHECKSIG,
    ]);
}
```
:::

---

## Transaction-Level Timelocks

### nLockTime

Transaction-level absolute timelock:

```text
[Transaction]
├── nLockTime: Block height or timestamp
└── nSequence: Must be < 0xFFFFFFFF for nLockTime to work
```

### nSequence

Transaction-level relative timelock (when used with CSV):

```text
[Transaction]
├── nSequence: Relative locktime value
└── Script: OP_CHECKSEQUENCEVERIFY
```

---

## Technical Details

### CLTV (BIP 65)

- **Activated**: December 2015 (block 388,381)
- **Opcode**: `OP_CHECKLOCKTIMEVERIFY` (0xb1)
- **Checks**: Transaction's `nLockTime` field
- **Values**: Block height (< 500,000,000) or Unix timestamp (≥ 500,000,000)

### CSV (BIP 112)

- **Activated**: July 2016 (block 419,328)
- **Opcode**: `OP_CHECKSEQUENCEVERIFY` (0xb2)
- **Checks**: Transaction's `nSequence` field
- **Values**: Blocks (mask 0x0000FFFF) or seconds (mask 0x40000000)

---

## Lightning Network Usage

### HTLC Timelocks

Lightning uses timelocks for HTLCs:

```text
[HTLC Structure]
├── Hash lock: Reveal preimage
└── Time lock: Refund if not claimed
```

Timelock ensures:
- Payments don't get stuck forever
- Refunds are possible
- Routing nodes have time to respond

### Channel Timelocks

Force-close channels use timelocks:

```text
Force Close:
1. Broadcast commitment transaction
2. Wait for timelock (typically 144-2016 blocks)
3. Access funds after timelock expires
```

---

## Related Topics

- [Bitcoin Script](/docs/bitcoin/script) - Script system overview
- [OP Codes](/docs/bitcoin/op-codes) - Script opcodes
- [Lightning Network](/docs/lightning) - Uses timelocks extensively
- [Smart Contracts](/docs/wallets/smart-contracts) - Advanced timelock patterns

---

## Resources

- [BIP 65: OP_CHECKLOCKTIMEVERIFY](https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki)
- [BIP 112: OP_CHECKSEQUENCEVERIFY](https://github.com/bitcoin/bips/blob/master/bip-0112.mediawiki)
- [BIP 68: Relative Lock-time](https://github.com/bitcoin/bips/blob/master/bip-0068.mediawiki)
