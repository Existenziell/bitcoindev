# OP Codes

The instruction set for Bitcoin. Bitcoin Script uses a stack-based programming language with various opcodes (operation codes) that perform different functions. This document provides a complete reference of Bitcoin OP codes with explanations and code examples. Try these opcodes in [Stack Lab](/interactive-tools/stack-lab).

## OP Code Categories

| Category | Description | Examples |
|----------|-------------|----------|
| Stack Operations | Manipulate the stack | OP_DUP, OP_DROP, OP_SWAP |
| Arithmetic | Mathematical operations | OP_ADD, OP_SUB |
| Cryptographic | Hash functions and signatures | OP_SHA256, OP_CHECKSIG |
| Comparison | Test conditions | OP_EQUAL, OP_LESSTHAN |
| Control Flow | Conditional execution | OP_IF, OP_ELSE |
| Time Locks | Transaction timing | OP_CLTV, OP_CSV |
| Disabled | Removed for security | OP_MUL, OP_CAT |

---

## Script Execution Example

:::code-group
```rust
use std::collections::VecDeque;

#[derive(Debug, Clone)]
enum StackItem {
    Bytes(Vec<u8>),
    Int(i64),
}

struct ScriptInterpreter {
    stack: VecDeque<StackItem>,
}

impl ScriptInterpreter {
    fn new() -> Self {
        Self { stack: VecDeque::new() }
    }

    fn push(&mut self, item: StackItem) {
        self.stack.push_back(item);
    }

    fn pop(&mut self) -> Option<StackItem> {
        self.stack.pop_back()
    }

    fn op_dup(&mut self) -> bool {
        if let Some(top) = self.stack.back().cloned() {
            self.stack.push_back(top);
            true
        } else {
            false
        }
    }

    fn op_add(&mut self) -> bool {
        if let (Some(StackItem::Int(b)), Some(StackItem::Int(a))) = (self.pop(), self.pop()) {
            self.push(StackItem::Int(a + b));
            true
        } else {
            false
        }
    }

    fn op_equal(&mut self) -> bool {
        if let (Some(b), Some(a)) = (self.pop(), self.pop()) {
            let equal = match (a, b) {
                (StackItem::Int(x), StackItem::Int(y)) => x == y,
                (StackItem::Bytes(x), StackItem::Bytes(y)) => x == y,
                _ => false,
            };
            self.push(StackItem::Int(if equal { 1 } else { 0 }));
            true
        } else {
            false
        }
    }
}

fn main() {
    let mut interp = ScriptInterpreter::new();
    
    // Simulate: 5 3 OP_ADD 8 OP_EQUAL
    interp.push(StackItem::Int(5));
    interp.push(StackItem::Int(3));
    interp.op_add();
    interp.push(StackItem::Int(8));
    interp.op_equal();
    
    println!("Result: {:?}", interp.stack);  // [Int(1)] = true
}
```

```python
from typing import Union, List
from hashlib import sha256, new as hashlib_new

StackItem = Union[bytes, int]

class ScriptInterpreter:
    def __init__(self):
        self.stack: List[StackItem] = []

    def push(self, item: StackItem):
        self.stack.append(item)

    def pop(self) -> StackItem:
        return self.stack.pop()

    def op_dup(self) -> bool:
        """OP_DUP: Duplicate top stack item."""
        if not self.stack:
            return False
        self.stack.append(self.stack[-1])
        return True

    def op_drop(self) -> bool:
        """OP_DROP: Remove top stack item."""
        if not self.stack:
            return False
        self.stack.pop()
        return True

    def op_add(self) -> bool:
        """OP_ADD: Add top two items."""
        if len(self.stack) < 2:
            return False
        b, a = self.pop(), self.pop()
        self.push(a + b)
        return True

    def op_equal(self) -> bool:
        """OP_EQUAL: Check if top two items are equal."""
        if len(self.stack) < 2:
            return False
        b, a = self.pop(), self.pop()
        self.push(1 if a == b else 0)
        return True

    def op_hash160(self) -> bool:
        """OP_HASH160: SHA256 then RIPEMD160."""
        if not self.stack:
            return False
        data = self.pop()
        if isinstance(data, int):
            data = data.to_bytes((data.bit_length() + 7) // 8, 'little')
        sha = sha256(data).digest()
        ripemd = hashlib_new('ripemd160', sha).digest()
        self.push(ripemd)
        return True

# Example: 5 + 3 = 8 ?
interp = ScriptInterpreter()
interp.push(5)
interp.push(3)
interp.op_add()
interp.push(8)
interp.op_equal()
print(f"Result: {interp.stack}")  # [1] = true
```

```cpp
#include <iostream>
#include <vector>
#include <variant>
#include <cstdint>

using StackItem = std::variant<std::vector<uint8_t>, int64_t>;

class ScriptInterpreter {
private:
    std::vector<StackItem> stack;

public:
    void push(StackItem item) {
        stack.push_back(std::move(item));
    }

    StackItem pop() {
        auto item = std::move(stack.back());
        stack.pop_back();
        return item;
    }

    bool op_dup() {
        if (stack.empty()) return false;
        stack.push_back(stack.back());
        return true;
    }

    bool op_add() {
        if (stack.size() < 2) return false;
        auto b = std::get<int64_t>(pop());
        auto a = std::get<int64_t>(pop());
        push(a + b);
        return true;
    }

    bool op_equal() {
        if (stack.size() < 2) return false;
        auto b = pop();
        auto a = pop();
        push(static_cast<int64_t>(a == b ? 1 : 0));
        return true;
    }

    void print_stack() const {
        std::cout << "Stack: [";
        for (const auto& item : stack) {
            if (std::holds_alternative<int64_t>(item)) {
                std::cout << std::get<int64_t>(item) << " ";
            }
        }
        std::cout << "]" << std::endl;
    }
};

int main() {
    ScriptInterpreter interp;
    
    // Simulate: 5 3 OP_ADD 8 OP_EQUAL
    interp.push(int64_t{5});
    interp.push(int64_t{3});
    interp.op_add();
    interp.push(int64_t{8});
    interp.op_equal();
    
    interp.print_stack();  // [1] = true
    return 0;
}
```

```go
package main

import (
	"crypto/sha256"
	"fmt"
	"golang.org/x/crypto/ripemd160"
)

type StackItem interface{}

type ScriptInterpreter struct {
	stack []StackItem
}

func NewScriptInterpreter() *ScriptInterpreter {
	return &ScriptInterpreter{
		stack: make([]StackItem, 0),
	}
}

func (si *ScriptInterpreter) Push(item StackItem) {
	si.stack = append(si.stack, item)
}

func (si *ScriptInterpreter) Pop() (StackItem, bool) {
	if len(si.stack) == 0 {
		return nil, false
	}
	item := si.stack[len(si.stack)-1]
	si.stack = si.stack[:len(si.stack)-1]
	return item, true
}

func (si *ScriptInterpreter) OpDup() bool {
	if len(si.stack) == 0 {
		return false
	}
	si.stack = append(si.stack, si.stack[len(si.stack)-1])
	return true
}

func (si *ScriptInterpreter) OpDrop() bool {
	if len(si.stack) == 0 {
		return false
	}
	si.stack = si.stack[:len(si.stack)-1]
	return true
}

func (si *ScriptInterpreter) OpAdd() bool {
	if len(si.stack) < 2 {
		return false
	}
	b, _ := si.Pop()
	a, _ := si.Pop()
	
	bInt, bOk := b.(int)
	aInt, aOk := a.(int)
	if !aOk || !bOk {
		return false
	}
	si.Push(aInt + bInt)
	return true
}

func (si *ScriptInterpreter) OpEqual() bool {
	if len(si.stack) < 2 {
		return false
	}
	b, _ := si.Pop()
	a, _ := si.Pop()
	
	var equal bool
	switch aVal := a.(type) {
	case int:
		if bVal, ok := b.(int); ok {
			equal = aVal == bVal
		}
	case []byte:
		if bVal, ok := b.([]byte); ok {
			equal = string(aVal) == string(bVal)
		}
	default:
		equal = false
	}
	
	if equal {
		si.Push(1)
	} else {
		si.Push(0)
	}
	return true
}

func (si *ScriptInterpreter) OpHash160() bool {
	if len(si.stack) == 0 {
		return false
	}
	data, _ := si.Pop()
	
	var dataBytes []byte
	switch v := data.(type) {
	case []byte:
		dataBytes = v
	case int:
		dataBytes = []byte{byte(v)}
	default:
		return false
	}
	
	sha := sha256.Sum256(dataBytes)
	hasher := ripemd160.New()
	hasher.Write(sha[:])
	ripemd := hasher.Sum(nil)
	si.Push(ripemd)
	return true
}

func main() {
	interp := NewScriptInterpreter()
	
	// Simulate: 5 3 OP_ADD 8 OP_EQUAL
	interp.Push(5)
	interp.Push(3)
	interp.OpAdd()
	interp.Push(8)
	interp.OpEqual()
	
	fmt.Printf("Result: %v\n", interp.stack) // [1] = true
}
```

```javascript
class ScriptInterpreter {
    constructor() {
        this.stack = [];
    }

    push(item) {
        this.stack.push(item);
    }

    pop() {
        return this.stack.pop();
    }

    opDup() {
        if (this.stack.length === 0) return false;
        this.stack.push(this.stack[this.stack.length - 1]);
        return true;
    }

    opDrop() {
        if (this.stack.length === 0) return false;
        this.stack.pop();
        return true;
    }

    opAdd() {
        if (this.stack.length < 2) return false;
        const b = this.pop();
        const a = this.pop();
        this.push(a + b);
        return true;
    }

    opEqual() {
        if (this.stack.length < 2) return false;
        const b = this.pop();
        const a = this.pop();
        // Deep comparison for buffers
        const equal = Buffer.isBuffer(a) && Buffer.isBuffer(b) 
            ? a.equals(b) 
            : a === b;
        this.push(equal ? 1 : 0);
        return true;
    }

    opHash160() {
        if (this.stack.length === 0) return false;
        const crypto = require('crypto');
        const data = this.pop();
        const sha = crypto.createHash('sha256').update(data).digest();
        const ripemd = crypto.createHash('ripemd160').update(sha).digest();
        this.push(ripemd);
        return true;
    }
}

// Example: 5 + 3 = 8 ?
const interp = new ScriptInterpreter();
interp.push(5);
interp.push(3);
interp.opAdd();
interp.push(8);
interp.opEqual();
console.log('Result:', interp.stack);  // [1] = true
```
:::

---

## Stack Operations

| OP Code | Hex | Function |
|---------|-----|----------|
| OP_DUP | 0x76 | Duplicates top stack item |
| OP_DROP | 0x75 | Removes top stack item |
| OP_SWAP | 0x7c | Swaps top two items |
| OP_OVER | 0x78 | Copies second-to-top to top |
| OP_ROT | 0x7b | Rotates top three items |
| OP_PICK | 0x79 | Copies nth item to top |
| OP_ROLL | 0x7a | Moves nth item to top |
| OP_2DROP | 0x6d | Removes top two items |
| OP_2DUP | 0x6e | Duplicates top two items |
| OP_3DUP | 0x6f | Duplicates top three items |
| OP_NIP | 0x77 | Removes second-to-top item |
| OP_TUCK | 0x7d | Copies top below second |

### Examples

```
OP_DUP:
  Before: [A]
  After:  [A, A]

OP_SWAP:
  Before: [A, B]
  After:  [B, A]

OP_ROT:
  Before: [A, B, C]
  After:  [B, C, A]
```

---

## Arithmetic Operations

| OP Code | Hex | Function | Status |
|---------|-----|----------|--------|
| OP_ADD | 0x93 | a + b | Active |
| OP_SUB | 0x94 | a - b | Active |
| OP_1ADD | 0x8b | a + 1 | Active |
| OP_1SUB | 0x8c | a - 1 | Active |
| OP_NEGATE | 0x8f | -a | Active |
| OP_ABS | 0x90 | abs(a) | Active |
| OP_NOT | 0x91 | !a (logical) | Active |
| OP_0NOTEQUAL | 0x92 | a != 0 | Active |
| OP_MUL | 0x95 | a * b | **Disabled** |
| OP_DIV | 0x96 | a / b | **Disabled** |
| OP_MOD | 0x97 | a % b | **Disabled** |
| OP_LSHIFT | 0x98 | a << b | **Disabled** |
| OP_RSHIFT | 0x99 | a >> b | **Disabled** |

> **Note**: OP_MUL, OP_DIV, OP_MOD, OP_LSHIFT, and OP_RSHIFT were disabled early in Bitcoin's history to prevent potential denial-of-service attacks through expensive computations.

---

## Comparison Operations

| OP Code | Hex | Function |
|---------|-----|----------|
| OP_EQUAL | 0x87 | Returns 1 if equal, else 0 |
| OP_EQUALVERIFY | 0x88 | OP_EQUAL + OP_VERIFY |
| OP_LESSTHAN | 0x9f | a < b |
| OP_GREATERTHAN | 0xa0 | a > b |
| OP_LESSTHANOREQUAL | 0xa1 | a <= b |
| OP_GREATERTHANOREQUAL | 0xa2 | a >= b |
| OP_MIN | 0xa3 | min(a, b) |
| OP_MAX | 0xa4 | max(a, b) |
| OP_WITHIN | 0xa5 | min <= x < max |

---

## Cryptographic Operations

| OP Code | Hex | Function |
|---------|-----|----------|
| OP_RIPEMD160 | 0xa6 | RIPEMD-160 hash |
| OP_SHA1 | 0xa7 | SHA-1 hash |
| OP_SHA256 | 0xa8 | SHA-256 hash |
| OP_HASH160 | 0xa9 | SHA256 + RIPEMD160 |
| OP_HASH256 | 0xaa | Double SHA-256 |
| OP_CHECKSIG | 0xac | Verify ECDSA signature |
| OP_CHECKSIGVERIFY | 0xad | OP_CHECKSIG + OP_VERIFY |
| OP_CHECKMULTISIG | 0xae | Verify multisig |
| OP_CHECKMULTISIGVERIFY | 0xaf | OP_CHECKMULTISIG + OP_VERIFY |

---

## Bitwise Operations (Disabled)

| OP Code | Hex | Function | Status |
|---------|-----|----------|--------|
| OP_AND | 0x84 | Bitwise AND | **Disabled** |
| OP_OR | 0x85 | Bitwise OR | **Disabled** |
| OP_XOR | 0x86 | Bitwise XOR | **Disabled** |
| OP_INVERT | 0x83 | Bitwise NOT | **Disabled** |

These were disabled to prevent potential vulnerabilities in early Bitcoin.

---

## Control Flow

| OP Code | Hex | Function |
|---------|-----|----------|
| OP_IF | 0x63 | Execute if top is non-zero |
| OP_NOTIF | 0x64 | Execute if top is zero |
| OP_ELSE | 0x67 | Else branch |
| OP_ENDIF | 0x68 | End conditional |
| OP_VERIFY | 0x69 | Fail if top is false |
| OP_RETURN | 0x6a | Mark output unspendable |

### Conditional Example

```
<condition>
OP_IF
    <execute if true>
OP_ELSE
    <execute if false>
OP_ENDIF
```

---

## Time Lock Operations

### OP_CHECKLOCKTIMEVERIFY (CLTV)

**Code**: `0xb1`

Verifies the transaction's nLockTime is at least the specified value (absolute time lock).

```
<locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP <pubkey> OP_CHECKSIG
```

Use cases:
- Payment channels
- Time-locked savings
- Inheritance planning

### OP_CHECKSEQUENCEVERIFY (CSV)

**Code**: `0xb2`

Verifies the input's sequence number enforces a relative time lock.

```
<relative_locktime> OP_CHECKSEQUENCEVERIFY OP_DROP <pubkey> OP_CHECKSIG
```

Use cases:
- Lightning Network HTLCs
- Escrow with timeout
- Revocable transactions

---

## Push Operations

| OP Code | Hex | Function |
|---------|-----|----------|
| OP_0 / OP_FALSE | 0x00 | Push empty array (false) |
| OP_1NEGATE | 0x4f | Push -1 |
| OP_1 / OP_TRUE | 0x51 | Push 1 |
| OP_2 - OP_16 | 0x52-0x60 | Push 2-16 |
| OP_PUSHDATA1 | 0x4c | Next byte is length |
| OP_PUSHDATA2 | 0x4d | Next 2 bytes are length |
| OP_PUSHDATA4 | 0x4e | Next 4 bytes are length |

---

## Tapscript Opcodes (BIP 342)

Taproot introduced new opcodes for Tapscript:

### OP_CHECKSIGADD

**Code**: `0xba`

Enables efficient Schnorr signature aggregation for multisig.

```
<pubkey1> OP_CHECKSIG
<pubkey2> OP_CHECKSIGADD
<pubkey3> OP_CHECKSIGADD
<threshold> OP_NUMEQUAL
```

Benefits over OP_CHECKMULTISIG:
- No dummy element needed
- More efficient batch validation
- Works with Schnorr signatures

### OP_SUCCESS Opcodes

Codes `0x50, 0x62, 0x89-0x8a, 0x8d-0x8e, 0x95-0x99, 0xbb-0xfe`

Reserved for future upgrades. Any script containing these immediately succeeds, allowing soft fork upgrades.

---

## Disabled Opcodes

These opcodes were disabled for security reasons:

| OP Code | Hex | Reason |
|---------|-----|--------|
| OP_CAT | 0x7e | Could create oversized scripts |
| OP_SUBSTR | 0x7f | Security concerns |
| OP_LEFT | 0x80 | Security concerns |
| OP_RIGHT | 0x81 | Security concerns |
| OP_INVERT | 0x83 | Security concerns |
| OP_AND | 0x84 | Security concerns |
| OP_OR | 0x85 | Security concerns |
| OP_XOR | 0x86 | Security concerns |
| OP_2MUL | 0x8d | Can be done with OP_ADD |
| OP_2DIV | 0x8e | Security concerns |
| OP_MUL | 0x95 | Expensive computation |
| OP_DIV | 0x96 | Division by zero issues |
| OP_MOD | 0x97 | Division by zero issues |
| OP_LSHIFT | 0x98 | Could create large numbers |
| OP_RSHIFT | 0x99 | Security concerns |

> **OP_CAT Revival**: There is ongoing discussion about re-enabling OP_CAT with proper limits, as it would enable new use cases like covenants.

---

## Common Script Patterns

### P2PKH (Pay-to-Pubkey-Hash)

```
Locking Script (scriptPubKey):
OP_DUP OP_HASH160 <pubkeyhash> OP_EQUALVERIFY OP_CHECKSIG

Unlocking Script (scriptSig):
<signature> <publickey>
```

### P2SH (Pay-to-Script-Hash)

```
Locking Script:
OP_HASH160 <scripthash> OP_EQUAL

Unlocking Script:
<data> ... <redeemscript>
```

### Multisig (2-of-3)

```
Locking Script:
OP_2 <pubkey1> <pubkey2> <pubkey3> OP_3 OP_CHECKMULTISIG

Unlocking Script:
OP_0 <sig1> <sig2>
```

Note: OP_0 is required due to a bug in OP_CHECKMULTISIG that pops one extra item.

### HTLC (Hash Time-Locked Contract)

```
OP_IF
    OP_SHA256 <hash> OP_EQUALVERIFY
    <receiver_pubkey> OP_CHECKSIG
OP_ELSE
    <timeout> OP_CHECKLOCKTIMEVERIFY OP_DROP
    <sender_pubkey> OP_CHECKSIG
OP_ENDIF
```

---

## Script Limits

| Limit | Value | Purpose |
|-------|-------|---------|
| Max script size | 10,000 bytes | Prevent oversized scripts |
| Max stack size | 1,000 items | Prevent stack overflow |
| Max item size | 520 bytes | Prevent oversized items |
| Max ops per script | 201 | Prevent expensive scripts |
| Max multisig keys | 20 | Limit signature checks |
| Max Tapscript size | No limit* | Weight-based limits apply |

*Tapscript has no explicit size limit but is constrained by block weight.

---

## OP Code Quick Reference

| Hex | Name | Description | Status |
|-----|------|-------------|--------|
| 0x00 | OP_0 | Push empty array | Active |
| 0x4f | OP_1NEGATE | Push -1 | Active |
| 0x51-0x60 | OP_1-OP_16 | Push 1-16 | Active |
| 0x63 | OP_IF | Conditional | Active |
| 0x64 | OP_NOTIF | Conditional | Active |
| 0x67 | OP_ELSE | Conditional | Active |
| 0x68 | OP_ENDIF | Conditional | Active |
| 0x69 | OP_VERIFY | Verify | Active |
| 0x6a | OP_RETURN | Data carrier | Active |
| 0x75 | OP_DROP | Remove top | Active |
| 0x76 | OP_DUP | Duplicate top | Active |
| 0x77 | OP_NIP | Remove second | Active |
| 0x78 | OP_OVER | Copy second | Active |
| 0x79 | OP_PICK | Copy nth | Active |
| 0x7a | OP_ROLL | Move nth | Active |
| 0x7b | OP_ROT | Rotate 3 | Active |
| 0x7c | OP_SWAP | Swap 2 | Active |
| 0x7d | OP_TUCK | Tuck top | Active |
| 0x7e | OP_CAT | Concatenate | Disabled |
| 0x84 | OP_AND | Bitwise AND | Disabled |
| 0x85 | OP_OR | Bitwise OR | Disabled |
| 0x86 | OP_XOR | Bitwise XOR | Disabled |
| 0x87 | OP_EQUAL | Equality | Active |
| 0x88 | OP_EQUALVERIFY | Equal + verify | Active |
| 0x93 | OP_ADD | Addition | Active |
| 0x94 | OP_SUB | Subtraction | Active |
| 0x95 | OP_MUL | Multiplication | Disabled |
| 0x96 | OP_DIV | Division | Disabled |
| 0x97 | OP_MOD | Modulo | Disabled |
| 0xa6 | OP_RIPEMD160 | RIPEMD160 | Active |
| 0xa7 | OP_SHA1 | SHA1 | Active |
| 0xa8 | OP_SHA256 | SHA256 | Active |
| 0xa9 | OP_HASH160 | SHA256+RIPEMD160 | Active |
| 0xaa | OP_HASH256 | Double SHA256 | Active |
| 0xac | OP_CHECKSIG | Check signature | Active |
| 0xae | OP_CHECKMULTISIG | Check multisig | Active |
| 0xb1 | OP_CLTV | Absolute timelock | Active |
| 0xb2 | OP_CSV | Relative timelock | Active |
| 0xba | OP_CHECKSIGADD | Tapscript multisig | Active |

---

## Related Topics

- [Script System](/docs/bitcoin/script): How Bitcoin Script works
- [OP_RETURN Debate](/docs/controversies/op-return): Controversy about data storage
- Taproot - Schnorr signatures and Tapscript

---

## Resources

- **[Bitcoin Wiki: Script](https://en.bitcoin.it/wiki/Script)**: Complete script reference
- **[BIP 342: Tapscript](https://github.com/bitcoin/bips/blob/master/bip-0342.mediawiki)**: Tapscript specification
- **[Learn Me a Bitcoin: Script](https://learnmeabitcoin.com/technical/script/)**: Visual script explanations
