# Miniscript

**Miniscript** is a structured language for writing [Bitcoin Script](/docs/bitcoin/script) that is easier to analyze, compose, and reason about than raw Script. It maps to a well-defined subset of Script and provides guarantees about spending conditions, costs, and the number and type of signatures required. It sits on top of [Bitcoin Script](/docs/bitcoin/script) and the same [smart contract](/docs/wallets/smart-contracts) spending conditions, giving you a policy language that compiles to correct Script.

## Why Miniscript?

Raw Bitcoin Script is flexible but hard to work with:

- **Opaque**: Deciding what a script does, what can satisfy it, and how much it costs requires careful analysis.
- **Brittle**: Small changes can produce invalid or unexpected scripts.
- **Composition**: Combining scripts (e.g., "2-of-3 OR after 90 days") is error-prone when done by hand.

Miniscript addresses this by:

- **Policy vs. script**: You express a *policy* (high-level spending conditions); Miniscript compiles it to Script.
- **Fragments**: A small set of composable *fragments* (e.g., `pk`, `thresh`, `after`) that map to Script.
- **Analyzable**: Tools can compute correctness, satisfaction size, and signature requirements automatically.

---

## Policy and Fragments

### Policy

A **policy** is a high-level description of who can spend and under what conditions. Examples:

```text
pk(A)                          — A’s key alone
2 of [pk(A), pk(B), pk(C)]     — 2-of-3 multisig
and(pk(A), after(100))         — A, but only after 100 blocks
or(2 of [pk(A),pk(B),pk(C)], and(pk(D), after(1000)))
  — 2-of-3 multisig, or D after 1000 blocks
```

### Core Fragments

| Fragment | Meaning | Script equivalent (conceptually) |
|----------|---------|----------------------------------|
| `pk(K)` | Key K must sign | `K OP_CHECKSIG` |
| `pk_h(K)` | Hash of K; reveal in witness | P2PKH-style |
| `thresh(n, A, B, ...)` | At least n of the sub-policies | Combined `OP_CHECKSIG` / `OP_CHECKMULTISIG`-style |
| `and(A, B)` | Both A and B | A then B in sequence |
| `or(A, B)` | A or B | `OP_IF` / `OP_ELSE` / `OP_ENDIF` |
| `after(N)` | Absolute [timelock](/docs/bitcoin/timelocks) (block height) | `N OP_CHECKLOCKTIMEVERIFY OP_DROP` |
| `older(N)` | Relative timelock (N blocks) | `N OP_CHECKSEQUENCEVERIFY OP_DROP` |
| `hash(H)` | Reveal preimage of H | `OP_HASH256 H OP_EQUAL` |
| `multi(n, K1, K2, ...)` | n-of-m multisig | `n K1 K2 ... m OP_CHECKMULTISIG` |

Miniscript supports more fragments (e.g., `and_v`, `or_c`, `andor`) for different Script encodings and sighash behavior. The exact set is defined in the [Miniscript specification](https://github.com/bitcoin/bips/blob/master/bip-0382.mediawiki).

---

## Correctness and Safety

Miniscript distinguishes:

- **Correctness**: Every valid satisfaction (according to the policy) is accepted by the compiled Script.
- **Safety**: No satisfaction is possible that the policy was not meant to allow; in particular, no **dust** or non-canonical spend that could lose funds.

Not every Miniscript expression is **safe**; the compiler and analyzers can report whether a given Miniscript is safe and what it requires to spend.

---

## Compilation to Script

A Miniscript policy is compiled down to [Script](/docs/bitcoin/script) (and thus to P2WSH or [P2TR](/docs/bitcoin/taproot) Tapscript). The exact output depends on:

- The target (pre-Taproot P2WSH vs [Taproot](/docs/bitcoin/taproot) Tapscript)
- Optimization options (e.g., minimize size, minimize signature count)

Libraries such as `rust-miniscript` and `miniscript` (C++) (and the reference `miniscript` site) perform this compilation.

### Code: Policy to Descriptor

:::code-group
```rust
// Cargo: miniscript = "11", bitcoin = "0.32"
use miniscript::policy::Concrete;
use std::str::FromStr;

fn policy_to_descriptor(policy_str: &str) -> Result<String, Box<dyn std::error::Error>> {
    let policy = Concrete::<bitcoin::PublicKey>::from_str(policy_str)?;
    let ms = policy.compile()?;
    let desc = ms.to_string();
    Ok(format!("wsh({})", desc))
}

fn main() {
    // Simple policy: single key
    let policy = "pk(0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798)";
    match policy_to_descriptor(policy) {
        Ok(desc) => println!("Descriptor: {}", desc),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

```python
# Policy-to-script compilation is typically done via rust-miniscript (e.g. in BDK).
# This example shows the policy string and output shape; use bdk or the reference
# miniscript.bitcoin.sipa.be API for full compilation.

def policy_to_descriptor_usage():
    policy = "pk(0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798)"
    # In practice: use BDK's miniscript or call rust-miniscript
    # descriptor = compile_policy(policy)  # e.g. wsh(pk(...))
    return "Policy: " + policy + " -> compile to wsh(...) descriptor"
```

```cpp
// Bitcoin Core has miniscript in src/script/miniscript.h
// This illustrates the idea; use the actual Miniscript API in production.

#include <script/miniscript.h>
#include <string>

std::string policy_to_descriptor(const std::string& policy_str) {
    using namespace miniscript;
    auto fragment = Miniscript::FromString(policy_str, CONVERTER);
    if (!fragment) return "";
    return "wsh(" + fragment->ToScript().ToString() + ")";
}

// Example: policy_to_descriptor("pk(0279be66...)") -> "wsh(...)"
```

```go
// Miniscript compilation in Go is often done by calling rust-miniscript
// or the reference compiler. This shows the policy and expected output.

package main

import "fmt"

func policyToDescriptor(policy string) string {
    // Use rust-miniscript bindings or external tool for real compilation.
    // Policy e.g. "pk(0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798)"
    return fmt.Sprintf("wsh(compiled from %s)", policy)
}

func main() {
    policy := "pk(0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798)"
    fmt.Println(policyToDescriptor(policy))
}
```

```javascript
// Miniscript compilation in JS is available via wasm (e.g. rust-miniscript)
// or the reference miniscript.bitcoin.sipa.be. This shows the structure.

function policyToDescriptor(policy) {
  // In practice: use a wasm build of rust-miniscript or call reference API
  // Policy e.g. "pk(0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798)"
  return `wsh(compiled from ${policy})`;
}

const policy = "pk(0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798)";
console.log(policyToDescriptor(policy));
```
:::

---

## Use Cases

- **Wallets**: Encode withdrawal policies (multisig, [timelocks](/docs/bitcoin/timelocks), recovery) and compile to Script; derive [addresses](/docs/wallets/address-types) and [PSBT](/docs/bitcoin-development/psbt) flows.
- **Vaults and covenants**: Express "can only go to addresses of type X" or "must wait N blocks"; with proposed [covenant](/docs/advanced/covenants) opcodes, Miniscript could target those too.
- **Protocols**: [Lightning](/docs/lightning), [DLCs](/docs/advanced/dlcs), and other protocols use script templates that Miniscript can represent and analyze.

---

## Taproot and Miniscript

[Taproot](/docs/bitcoin/taproot) and [Tapscript](/docs/bitcoin/script) add:

- **Schnorr** and `OP_CHECKSIGADD`
- New rules and limits (e.g., 32-byte x-only [pubkeys](/docs/bitcoin/cryptography))

Miniscript has been extended (see [BIP 382](https://github.com/bitcoin/bips/blob/master/bip-0382.mediawiki) and implementations) to support **Tapscript**, so the same policy language can target both pre-Taproot P2WSH and Taproot script paths.

---

## Tools and Libraries

- **[miniscript.bitcoin.sipa.be](https://bitcoin.sipa.be/miniscript/)**: Playground and reference
- **rust-miniscript**: Rust; used in [BDK](https://github.com/bitcoindevkit/bdk) and other wallets
- **C++ miniscript**: In [Bitcoin Core](https://github.com/bitcoin/bitcoin) (e.g., for descriptors and output script analysis)
- **Policy-to-Miniscript**: Higher-level policy languages can target Miniscript, which then compiles to Script

---

## Related Topics

- [Bitcoin Script](/docs/bitcoin/script) - Script system
- [Script Patterns](/docs/bitcoin-development/script-patterns) - Common patterns and Miniscript
- [Smart Contracts](/docs/wallets/smart-contracts) - Contract patterns and Miniscript
- [Taproot](/docs/bitcoin/taproot) - Tapscript and Miniscript
- [Covenants](/docs/advanced/covenants) - Proposed opcodes and policy

---

## Resources

- [Miniscript (bitcoin.sipa.be)](https://bitcoin.sipa.be/miniscript/) - Playground and specification
- [BIP 382: Miniscript for Tapscript](https://github.com/bitcoin/bips/blob/master/bip-0382.mediawiki)
- [rust-miniscript](https://github.com/rust-bitcoin/rust-miniscript) - Rust implementation
