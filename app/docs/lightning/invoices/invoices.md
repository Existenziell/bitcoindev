# Lightning Invoices (BOLT11)

Lightning invoices are payment requests encoded in the BOLT11 format. They contain all the information a payer needs to send a payment, including the payment hash, amount, destination, and expiry.

## Invoice Structure

A BOLT11 invoice consists of three parts:

1. **Human-Readable Part (HRP)**: Network prefix and amount
2. **Data Part**: Encoded payment details
3. **Signature**: Proves invoice authenticity

```text
Example Invoice:
lnbc2500u1pvjluezsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpu9qxpqysgq...
```

```mermaid
flowchart TD
  Inv[Invoice Breakdown]
  Inv --> lnbc["lnbc - Network (mainnet Bitcoin)"]
  Inv --> amt["2500u - Amount (250,000 sats)"]
  Inv --> sep["1 - Separator"]
  Inv --> data["pvjluez... - Bech32-encoded data"]
  Inv --> sig["9qxpqysgq... - Signature"]
```

---

## Human-Readable Part

### Network Prefixes

| Prefix | Network |
|--------|---------|
| `lnbc` | Bitcoin mainnet |
| `lntb` | Bitcoin testnet |
| `lntbs` | Bitcoin signet |
| `lnbcrt` | Bitcoin regtest |

### Amount Encoding

| Suffix | Multiplier | Example |
|--------|------------|---------|
| (none) | 1 BTC | `lnbc1` = 1 BTC |
| `m` | milli (0.001) | `lnbc100m` = 0.1 BTC |
| `u` | micro (0.000001) | `lnbc2500u` = 0.0025 BTC |
| `n` | nano (0.000000001) | `lnbc1000n` = 0.000001 BTC |
| `p` | pico (0.000000000001) | `lnbc1000000p` = 0.000001 BTC |

Note: Pico amounts must be multiples of 10 (minimum resolution is 1 millisatoshi).

---

## Data Part Fields

The data section uses tagged fields in TLV (Type-Length-Value) format:

| Tag | Field | Description |
|-----|-------|-------------|
| `p` | Payment Hash | 52 chars, SHA256 of preimage |
| `s` | Payment Secret | 52 chars, for MPP and probing protection |
| `d` | Description | Human-readable purpose |
| `h` | Description Hash | SHA256 of long description |
| `n` | Payee Node ID | 53 chars, destination public key |
| `x` | Expiry | Seconds until invoice expires (default: 3600) |
| `c` | Min Final CLTV Expiry | Blocks for final hop (default: 18) |
| `f` | Fallback Address | On-chain fallback |
| `r` | Route Hints | Private channel routing info |
| `9` | Feature Bits | Supported features |

---

## Parsing Invoices

:::code-group
```rust
use bech32::{self, FromBase32};
use sha2::{Sha256, Digest};

/// Parsed BOLT11 invoice fields
#[derive(Debug)]
struct ParsedInvoice {
    network: String,
    amount_msat: Option<u64>,
    payment_hash: [u8; 32],
    description: Option<String>,
    expiry_seconds: u32,
    timestamp: u64,
}

/// Parse the human-readable part of a BOLT11 invoice
fn parse_hrp(hrp: &str) -> Result<(String, Option<u64>), &'static str> {
    // Extract network prefix
    let network = if hrp.starts_with("lnbc") {
        "mainnet"
    } else if hrp.starts_with("lntb") {
        "testnet"
    } else if hrp.starts_with("lntbs") {
        "signet"
    } else {
        return Err("Unknown network prefix");
    };
    
    // Extract amount (simplified)
    let amount_str = hrp.trim_start_matches("lnbc")
                        .trim_start_matches("lntbs")
                        .trim_start_matches("lntb");
    
    // Amount in millisatoshis: 1 BTC = 100,000,000,000 msat
    let amount_msat = if amount_str.is_empty() {
        None
    } else {
        // Parse amount with multiplier (to millisatoshis)
        // m = milli (10^-3), u = micro (10^-6), n = nano (10^-9), p = pico (10^-12)
        let (num_str, multiplier, is_pico) = if amount_str.ends_with('m') {
            (&amount_str[..amount_str.len()-1], 100_000_000u64, false) // milli-BTC
        } else if amount_str.ends_with('u') {
            (&amount_str[..amount_str.len()-1], 100_000u64, false) // micro-BTC
        } else if amount_str.ends_with('n') {
            (&amount_str[..amount_str.len()-1], 100u64, false) // nano-BTC
        } else if amount_str.ends_with('p') {
            (&amount_str[..amount_str.len()-1], 1u64, true) // pico-BTC (0.1 msat)
        } else {
            (amount_str, 100_000_000_000u64, false) // whole BTC
        };
        
        num_str.parse::<u64>().ok().map(|n| {
            let value = n * multiplier;
            // For pico, divide by 10 since 1p = 0.1 msat
            if is_pico { value / 10 } else { value }
        })
    };
    
    Ok((network.to_string(), amount_msat))
}

fn main() {
    // Example: Parse HRP
    let (network, amount) = parse_hrp("lnbc2500u").unwrap();
    println!("Network: {}", network);
    println!("Amount: {:?} msat", amount);
}
```

```python
import re
import hashlib
from dataclasses import dataclass
from typing import Optional
import bech32

@dataclass
class ParsedInvoice:
    network: str
    amount_msat: Optional[int]
    payment_hash: bytes
    description: Optional[str]
    expiry_seconds: int
    timestamp: int
    payee_pubkey: Optional[bytes]

def parse_amount(hrp: str) -> Optional[int]:
    """Parse amount from human-readable part.
    
    Returns amount in millisatoshis.
    1 BTC = 100,000,000 sat = 100,000,000,000 msat
    """
    # Remove network prefix
    amount_str = hrp.lstrip('lnbcrts')
    
    if not amount_str:
        return None
    
    # Multipliers to convert to millisatoshis
    # m = milli (10^-3), u = micro (10^-6), n = nano (10^-9), p = pico (10^-12)
    multipliers = {
        'm': 100_000_000,      # milli-BTC: 0.001 BTC = 100,000 sat = 100,000,000 msat
        'u': 100_000,          # micro-BTC: 0.000001 BTC = 100 sat = 100,000 msat
        'n': 100,              # nano-BTC: 0.000000001 BTC = 0.1 sat = 100 msat
        'p': 1,                # pico-BTC: 0.1 msat (must be multiple of 10)
    }
    
    if amount_str[-1] in multipliers:
        value = int(amount_str[:-1]) * multipliers[amount_str[-1]]
        # For pico, divide by 10 since 1p = 0.1 msat
        if amount_str[-1] == 'p':
            value = value // 10
        return value
    else:
        return int(amount_str) * 100_000_000_000  # BTC to msat

def decode_invoice(invoice: str) -> ParsedInvoice:
    """Decode a BOLT11 invoice string."""
    invoice = invoice.lower()
    
    # Determine network
    if invoice.startswith('lnbc'):
        network = 'mainnet'
    elif invoice.startswith('lntbs'):
        network = 'signet'
    elif invoice.startswith('lntb'):
        network = 'testnet'
    else:
        raise ValueError("Unknown network prefix")
    
    # Find separator (1)
    sep_idx = invoice.rfind('1')
    hrp = invoice[:sep_idx]
    data = invoice[sep_idx+1:]
    
    # Parse amount from HRP
    amount_msat = parse_amount(hrp)
    
    # Decode bech32 data
    _, data_5bit = bech32.bech32_decode(invoice)
    if data_5bit is None:
        raise ValueError("Invalid bech32 encoding")
    
    # Convert from 5-bit to 8-bit
    data_bytes = bytes(bech32.convertbits(data_5bit, 5, 8, False))
    
    # First 7 bytes: timestamp (35 bits)
    timestamp = int.from_bytes(data_bytes[:5], 'big') >> 5
    
    return ParsedInvoice(
        network=network,
        amount_msat=amount_msat,
        payment_hash=bytes(32),  # Would parse from tagged fields
        description=None,
        expiry_seconds=3600,
        timestamp=timestamp,
        payee_pubkey=None
    )

# Example usage
invoice = "lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpusp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygskqhwvl"
print(f"Amount: {parse_amount('lnbc2500u')} msat")
```

```cpp
#include <iostream>
#include <string>
#include <optional>
#include <cstdint>
#include <array>

struct ParsedInvoice {
    std::string network;
    std::optional<uint64_t> amount_msat;
    std::array<uint8_t, 32> payment_hash;
    std::string description;
    uint32_t expiry_seconds;
    uint64_t timestamp;
};

/**
 * Parse amount from human-readable part
 * Returns amount in millisatoshis.
 * 1 BTC = 100,000,000 sat = 100,000,000,000 msat
 */
std::optional<uint64_t> parse_amount(const std::string& hrp) {
    // Find where the amount starts (after network prefix)
    size_t start = 0;
    if (hrp.substr(0, 6) == "lnbcrt") start = 6;
    else if (hrp.substr(0, 5) == "lntbs") start = 5;
    else if (hrp.substr(0, 4) == "lnbc") start = 4;
    else if (hrp.substr(0, 4) == "lntb") start = 4;
    else return std::nullopt;
    
    std::string amount_str = hrp.substr(start);
    if (amount_str.empty()) return std::nullopt;
    
    // Determine multiplier (to millisatoshis)
    // m = milli (10^-3), u = micro (10^-6), n = nano (10^-9), p = pico (10^-12)
    uint64_t multiplier;
    bool is_pico = false;
    char suffix = amount_str.back();
    
    switch (suffix) {
        case 'm': multiplier = 100000000ULL; break;     // milli-BTC: 100,000,000 msat
        case 'u': multiplier = 100000ULL; break;        // micro-BTC: 100,000 msat
        case 'n': multiplier = 100ULL; break;           // nano-BTC: 100 msat
        case 'p': multiplier = 1ULL; is_pico = true; break; // pico-BTC: 0.1 msat
        default:
            multiplier = 100000000000ULL;                // whole BTC: 100,000,000,000 msat
            return std::stoull(amount_str) * multiplier;
    }
    
    std::string num_str = amount_str.substr(0, amount_str.length() - 1);
    uint64_t value = std::stoull(num_str) * multiplier;
    // For pico, divide by 10 since 1p = 0.1 msat
    return is_pico ? value / 10 : value;
}

/**
 * Get network from invoice prefix
 */
std::string get_network(const std::string& invoice) {
    if (invoice.substr(0, 5) == "lntbs") return "signet";
    if (invoice.substr(0, 4) == "lntb") return "testnet";
    if (invoice.substr(0, 4) == "lnbc") return "mainnet";
    return "unknown";
}

int main() {
    std::string hrp = "lnbc2500u";
    auto amount = parse_amount(hrp);
    
    if (amount) {
        std::cout << "Amount: " << *amount << " msat" << std::endl;
        std::cout << "Amount: " << (*amount / 1000) << " sats" << std::endl;
    }
    
    std::cout << "Network: " << get_network("lnbc2500u1...") << std::endl;
    
    return 0;
}
```

```go
package main

import (
	"fmt"
	"strconv"
	"strings"
)

// ParseAmount parses amount from human-readable part.
// Returns amount in millisatoshis.
func ParseAmount(hrp string) (*uint64, error) {
	// Remove network prefix
	amountStr := strings.TrimLeft(hrp, "lnbcrts")
	
	// Parse suffix (m, u, n, p)
	multipliers := map[byte]uint64{
		'm': 100_000_000_000_000, // milli
		'u': 100_000_000_000,     // micro
		'n': 100_000_000,         // nano
		'p': 10_000_000,          // pico
	}
	
	if len(amountStr) > 0 {
		suffix := amountStr[len(amountStr)-1]
		if multiplier, ok := multipliers[suffix]; ok {
			numStr := amountStr[:len(amountStr)-1]
			num, err := strconv.ParseUint(numStr, 10, 64)
			if err != nil {
				return nil, err
			}
			value := num * multiplier
			// For pico, divide by 10 since 1p = 0.1 msat
			if suffix == 'p' {
				value = value / 10
			}
			result := value
			return &result, nil
		}
	}
	
	// No suffix = whole BTC
	num, err := strconv.ParseUint(amountStr, 10, 64)
	if err != nil {
		return nil, err
	}
	result := num * 100_000_000_000
	return &result, nil
}

// GetNetwork gets network from invoice string
func GetNetwork(invoice string) string {
	invoice = strings.ToLower(invoice)
	if strings.HasPrefix(invoice, "lntbs") {
		return "signet"
	}
	if strings.HasPrefix(invoice, "lntb") {
		return "testnet"
	}
	if strings.HasPrefix(invoice, "lnbcrt") {
		return "regtest"
	}
	if strings.HasPrefix(invoice, "lnbc") {
		return "mainnet"
	}
	return "unknown"
}

func main() {
	hrp := "lnbc2500u"
	amount, err := ParseAmount(hrp)
	if err == nil && amount != nil {
		fmt.Printf("Amount: %d msat\n", *amount)
		fmt.Printf("Amount: %d sats\n", *amount/1000)
	}
	
	fmt.Printf("Network: %s\n", GetNetwork("lnbc2500u1..."))
}
```

```javascript
/**
 * @typedef {Object} ParsedInvoice
 * @property {string} network
 * @property {bigint|null} amountMsat
 * @property {Buffer} paymentHash
 * @property {string|null} description
 * @property {number} expirySeconds
 * @property {number} timestamp
 */

const bech32 = require('bech32');

/**
 * Parse amount from human-readable part
 * Returns amount in millisatoshis.
 * 1 BTC = 100,000,000 sat = 100,000,000,000 msat
 * 
 * @param {string} hrp
 * @returns {bigint|null}
 */
function parseAmount(hrp) {
    // Remove network prefix
    let amountStr = hrp.replace(/^lnbc|^lntbs|^lntb|^lnbcrt/, '');
    
    if (!amountStr) return null;
    
    // Multipliers to convert to millisatoshis
    // m = milli (10^-3), u = micro (10^-6), n = nano (10^-9), p = pico (10^-12)
    const multipliers = {
        'm': 100_000_000n,     // milli-BTC: 0.001 BTC = 100,000,000 msat
        'u': 100_000n,         // micro-BTC: 0.000001 BTC = 100,000 msat
        'n': 100n,             // nano-BTC: 0.000000001 BTC = 100 msat
        'p': 1n,               // pico-BTC: 0.1 msat (must be multiple of 10)
    };
    
    const suffix = amountStr.slice(-1);
    if (multipliers[suffix]) {
        const num = BigInt(amountStr.slice(0, -1));
        let value = num * multipliers[suffix];
        // For pico, divide by 10 since 1p = 0.1 msat
        if (suffix === 'p') {
            value = value / 10n;
        }
        return value;
    }
    
    // No suffix = whole BTC (1 BTC = 100,000,000,000 msat)
    return BigInt(amountStr) * 100_000_000_000n;
}

/**
 * Get network from invoice string
 * @param {string} invoice
 * @returns {string}
 */
function getNetwork(invoice) {
    invoice = invoice.toLowerCase();
    if (invoice.startsWith('lntbs')) return 'signet';
    if (invoice.startsWith('lntb')) return 'testnet';
    if (invoice.startsWith('lnbcrt')) return 'regtest';
    if (invoice.startsWith('lnbc')) return 'mainnet';
    return 'unknown';
}

/**
 * Basic invoice parsing
 * @param {string} invoice
 * @returns {Object}
 */
function parseInvoice(invoice) {
    invoice = invoice.toLowerCase();
    
    // Find the separator
    const sepIndex = invoice.lastIndexOf('1');
    const hrp = invoice.slice(0, sepIndex);
    
    return {
        network: getNetwork(invoice),
        amountMsat: parseAmount(hrp),
        hrp: hrp,
    };
}

// Example usage
const invoice = 'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypq...';
const parsed = parseInvoice(invoice);

console.log(`Network: ${parsed.network}`);
console.log(`Amount: ${parsed.amountMsat} msat`);
console.log(`Amount: ${parsed.amountMsat / 1000n} sats`);
```
:::

---

## Creating Invoices

Using `lncli`:

```bash
# Create invoice for 10,000 sats with description
lncli addinvoice --amt=10000 --memo="Payment for coffee"

# Create invoice with specific expiry (1 hour)
lncli addinvoice --amt=50000 --memo="Service fee" --expiry=3600

# Create invoice with private route hints
lncli addinvoice --amt=25000 --private

# Create zero-amount invoice (payer chooses amount)
lncli addinvoice --memo="Donation"
```

---

## Invoice Expiry

Invoices have a default expiry of 1 hour (3600 seconds). After expiry:

- Invoice should not be paid
- Payment hash may be reused by recipient
- Sender's wallet should reject expired invoices

Common expiry values:

| Use Case | Expiry | Seconds |
|----------|--------|---------|
| Point of sale | 5-15 min | 300-900 |
| E-commerce | 1 hour | 3600 |
| Subscription | 24 hours | 86400 |
| Donation | 7 days | 604800 |

---

## Route Hints

Private channels require route hints to be payable:

```mermaid
flowchart TD
  RH[Route Hint Structure]
  RH --> NodeID[Node ID 33 bytes]
  RH --> SCID[Short Channel ID 8 bytes]
  RH --> FeeBase[Fee Base 4 bytes]
  RH --> FeeProp[Fee Proportional 4 bytes]
  RH --> CLTV[CLTV Expiry Delta 2 bytes]
```

Route hints tell the sender how to reach a node through private/unannounced channels.

---

## Payment Secret (s field)

The payment secret (added in BOLT11 amendment):

- **32 bytes** of random data
- Prevents payment probing attacks
- Required for [Multi-Part Payments (MPP)](/docs/lightning/routing/mpp)
- Proves payer has the actual invoice

---

## Feature Bits

The `9` field encodes supported features:

| Bit | Feature |
|-----|---------|
| 8/9 | TLV onion payload |
| 14/15 | Payment secret required |
| 16/17 | Basic MPP |
| 24/25 | Keysend |

---

## BOLT12 and Offers

[BOLT12](/docs/lightning/bolt12-offers) extends the Lightning payment model with **offers** and **invoice requests**. Unlike BOLT11, where the payee creates an [invoice](/docs/lightning/invoices) when they want to be paid, BOLT12 **offers** are static, reusable descriptors that payers use to **request** an [invoice](/docs/lightning/invoices) from the payee. Benefits include:

- **Reusable offers**: One offer can yield many [invoices](/docs/lightning/invoices) (e.g., subscriptions, donations, any-amount).
- **Payee offline at creation**: The offer can be published (e.g., on a website); the payee only needs to be online when the payer sends an **invoice request** and the payee returns an [invoice](/docs/lightning/invoices).
- **Keysend-style flows**: Structured alternative to [keysend](/docs/glossary#keysend) where the payee still controls the [payment hash](/docs/lightning/routing/htlc) and amount via the invoice they generate.

Support varies: [Core Lightning](https://github.com/ElementsProject/lightning) and [LDK](https://github.com/lightningdevkit/rust-lightning) have BOLT12 support; [LND](https://github.com/lightningnetwork/lnd) and others are adding it. See [Offers (BOLT12)](/docs/lightning/bolt12-offers) for details.

---

## Common Patterns

### Reusable Invoices

Standard BOLT11 [invoices](/docs/lightning/invoices) should only be paid once. For reusable or dynamic payments:

- Use [Keysend](/docs/glossary#keysend) (no [invoice](/docs/lightning/invoices) needed)
- Use LNURL-pay (dynamic [invoice](/docs/lightning/invoices) generation)
- Use [Offers (BOLT12)](/docs/lightning/bolt12-offers) (when supported by your node and payees)

### Fallback Addresses

Include on-chain fallback for large amounts:

```bash
lncli addinvoice --amt=1000000 --fallback_addr=bc1q...
```

If Lightning payment fails, payer can use on-chain address.

---

## Validation Checklist

When receiving an invoice, verify:

1. **Network matches** your node (mainnet/testnet)
2. **Not expired** (current time < timestamp + expiry)
3. **Amount is acceptable** (if specified)
4. **Features are supported** by your node
5. **Signature is valid** (proves invoice authenticity)

---

## Summary

BOLT11 invoices provide:

- **Standardized format** for payment requests
- **Amount encoding** from pico-BTC to whole BTC
- **Expiry handling** to prevent stale payments
- **Route hints** for private channel payments
- **Payment secrets** for security and MPP support

---

## Related Topics

- [Offers (BOLT12)](/docs/lightning/bolt12-offers) - Offers, invoice requests, and reusable payment flows
- [Multi-Part Payments](/docs/lightning/routing/mpp) - Splitting large payments
- [Channels](/docs/lightning/channels) - Where payments flow
- [HTLCs](/docs/lightning/routing/htlc) - Payment mechanism

---

## Resources

- [BOLT 11 Specification](https://github.com/lightning/bolts/blob/master/11-payment-encoding.md)
- [Lightning Invoice Decoder](https://lightningdecoder.com/) - Online tool
